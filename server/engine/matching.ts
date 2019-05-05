import { H256, U64 } from "codechain-primitives";
import { SDK } from "codechain-sdk";
import {
  AssetTransferInput,
  Order,
  SignedTransaction,
  Transaction,
  TransferAsset
} from "codechain-sdk/lib/core/classes";
import { SignedTransactionJSON } from "codechain-sdk/lib/core/SignedTransaction";
import { AssetTransferInputJSON } from "codechain-sdk/lib/core/transaction/AssetTransferInput";
import { fromJSONToSignedTransaction } from "codechain-sdk/lib/core/transaction/json";
import * as _ from "lodash";
import * as Config from "../config/dex.json";
import { controllers } from "../controllers";
import { OrderAttriubutes, OrderInstance } from "../models/order";

const env: string = process.env.NODE_ENV || "development";
const rpcServer: string = require("../config/dex.json").node[env].rpc;
const networkId: string = require("../config/dex.json").node[env]["network-id"];
const sdk = new SDK({ server: rpcServer, networkId });
const DEX_ASSET_ADDRESS = require("../config/dex.json")["dex-asset-address"][
  env
];
const FEE_RATE = Config["fee-rate"];
const FEE_ASSET_TYPE = Config["fee-asset-type"];

const ACCOUNT_SECRET_TEST = Config["test-secret"];
const ACCOUNT_ADDRESS_TEST = Config["test-account"];
const ACCOUNT_SECRET_DEV =
  "ede1d4ccb4ec9a8bbbae9a13db3f4a7b56ea04189be86ac3a6a439d9a0a1addd";
const ACCOUNT_ADDRESS_DEV = "tccq9h7vnl68frvqapzv3tujrxtxtwqdnxw6yamrrgd";

interface MarketIndexSig {
  [key: string]: { id: number; asset1: string; asset2: string };
}

// FIXME - Make do not get makerAddress instead find it in the order
export async function submit(
  assetList: AssetTransferInput[],
  order: Order,
  makerAddress: string,
  splitTx?: Transaction
): Promise<void | SignedTransactionJSON> {
  let isSplit: boolean = true;

  // Check the split transaction is along with the order transaction
  if (splitTx === null) {
    isSplit = false;
  }

  // Check the validity of the order
  const marketId = checkTX(assetList, order, isSplit, splitTx);

  const rate = getRate(order, marketId);

  const assetTypeFrom: H256 = order.assetTypeFrom;
  const assetTypeTo: H256 = order.assetTypeTo;
  const assetQuantityFrom: number = order.assetQuantityFrom.value.toNumber();

  let orders;
  if (marketId === 0) {
    // In test, dev mode rate is calculated based on asset from type
    orders = await controllers.orderController.find(
      assetTypeTo.toJSON(),
      assetTypeFrom.toJSON(),
      null,
      1 / rate,
      null,
      null,
      null,
      null,
      0
    );
  } else {
    // In production mode rate is calculated based on fee asset type
    // FIXME - Check shardId
    orders = await controllers.orderController.find(
      assetTypeTo.toJSON(),
      assetTypeFrom.toJSON(),
      null,
      rate,
      null,
      null,
      null,
      null,
      marketId
    );
  }

  // In case that there is no any matched orders
  if (orders.length === 0) {
    const splitTransaction = isSplit
      ? JSON.parse(JSON.stringify(splitTx.toJSON()))
      : null;
    await controllers.orderController.create(
      assetTypeFrom.toJSON(),
      assetTypeTo.toJSON(),
      assetQuantityFrom,
      rate,
      makerAddress,
      JSON.parse(JSON.stringify(assetList.map(input => input.toJSON()))),
      JSON.parse(JSON.stringify(order.toJSON())),
      splitTransaction,
      marketId
    );
    // FIXME - register UTXO and expiration date to order watcher
    return null;
  }

  // FIXME - `orders` need to be sorted by creation time
  // In case that there are matched orders
  await matchOrder(
    assetList,
    order,
    orders,
    makerAddress,
    rate,
    marketId,
    splitTx
  );
  return null;
}

function checkTX(
  inputs: AssetTransferInput[],
  order: Order,
  isSplit: boolean,
  splitTx?: Transaction
): number {
  // Check if unlock scripts in inputs of the orderTx are valid
  if (!executeScript(inputs, splitTx)) {
    throw { message: "Unlock scripts in order transaction are not valid" };
  }

  if (isSplit) {
    // Check if splitTx is assetTransferTransaction and unlock scripts in inputs of the it are valid
    if (splitTx.type() === "transferAsset") {
      if (!executeScript((splitTx as TransferAsset).inputs())) {
        throw Error("Unlock scripts in split transaction are not valid");
      }
    } else {
      throw Error("Split transaction is not assetTransferTransaction");
    }

    // Check if splitTx properly supports the orderTx
    for (const input of inputs) {
      const index = input.prevOut.index;
      const quantity = input.prevOut.quantity;

      try {
        if ((splitTx as TransferAsset).output(index).quantity !== quantity) {
          throw Error;
        }
      } catch (error) {
        throw Error("splitTx can not support the orderTx");
      }
    }
  }

  // Only in the production mode, Check the orderInfo properly meet the exchange's fee rules
  if (env === "production") {
    // Check if the incoming transaction is fee paying transaction
    const isFeePayingOrder: boolean =
      order.assetTypeFrom.toJSON() === FEE_ASSET_TYPE ? true : false;

    // Check if a fee is properly paid
    if (isFeePayingOrder) {
      if (order.assetTypeFee.toJSON() !== FEE_ASSET_TYPE) {
        throw Error("assetTypeFee is illegal");
      }
      if (
        !order.assetQuantityFee.isGreaterThanOrEqualTo(
          order.assetQuantityFrom.times(FEE_RATE)
        )
      ) {
        throw Error(
          `assetQuantityFee is illegal ${
            order.assetQuantityFee
          } < ${order.assetQuantityFrom.times(FEE_RATE)}`
        );
      }
    }
  }

  // check if orderTx meat the orderInfo
  checkOrderTx(inputs, order);

  // Check if the market ID is valid
  return checkMarket(order);
}

// FIXME - use codechain RPC
function executeScript(
  inputs: AssetTransferInput[],
  splitTx?: Transaction
): boolean {
  if (splitTx) {
    const parameters = new Array();
    for (const input of inputs) {
      parameters.push(
        (splitTx as TransferAsset).output(input.prevOut.index).parameters
      );
    }
  } else {
    console.log("Not implemented");
  }
  return true;
}

function checkOrderTx(inputs: AssetTransferInput[], order: Order): void {
  const assets: Map<string, U64> = new Map();
  for (const input of inputs) {
    if (assets.has(input.prevOut.assetType.toJSON())) {
      const quantity = assets.get(input.prevOut.assetType.toJSON());
      assets.set(
        input.prevOut.assetType.toJSON(),
        input.prevOut.quantity.plus(quantity)
      );
    } else {
      assets.set(input.prevOut.assetType.toJSON(), input.prevOut.quantity);
    }
  }

  // FIXME -  Check feeRecipient is the DEX address by feeParameter

  // Check if there is sufficient amount of asset
  // Fee
  if (!order.assetQuantityFee.eq(0)) {
    if (
      assets.has(order.assetTypeFee.toJSON()) === false ||
      assets.get(order.assetTypeFee.toJSON()).isLessThan(order.assetQuantityFee)
    ) {
      throw Error(
        `Fee inputs are not sufficient for paying order ${
          assets.get(order.assetTypeFee.toJSON()) === undefined
            ? 0
            : assets.get(order.assetTypeFee.toJSON())
        } < ${order.assetQuantityFee}`
      );
    } else {
      const remained = assets
        .get(order.assetTypeFee.toJSON())
        .minus(order.assetQuantityFee);
      if (remained.eq(0)) {
        assets.delete(order.assetTypeFee.toJSON());
      } else {
        assets.set(order.assetTypeFee.toJSON(), remained);
      }
    }
  }
  // assetTypeFrom
  if (
    assets.has(order.assetTypeFrom.toJSON()) === false ||
    assets.get(order.assetTypeFrom.toJSON()).isLessThan(order.assetQuantityFrom)
  ) {
    throw Error(
      `Fee inputs are not sufficient for paying order ${
        assets.get(order.assetTypeFrom.toJSON()) === undefined
          ? 0
          : assets.get(order.assetTypeFrom.toJSON())
      } < ${order.assetQuantityFrom}`
    );
  } else {
    const remained = assets
      .get(order.assetTypeFrom.toJSON())
      .minus(order.assetQuantityFrom);
    if (remained.eq(0)) {
      assets.delete(order.assetTypeFrom.toJSON());
    } else {
      assets.set(order.assetTypeFrom.toJSON(), remained);
    }
  }

  // Check if there is any invalid assets in the inputs
  assets.delete(order.assetTypeFrom.toJSON());
  assets.delete(order.assetTypeFee.toJSON());
  if (assets.size !== 0) {
    throw Error(`The inputs include invalid assets ${assets}`);
  }

  return;
}

function checkMarket(order: Order): number {
  // If not in the production mode
  if (env !== "production") {
    return 0;
  }

  const assetTypeFrom: H256 = order.assetTypeFrom;
  const assetTypeTo: H256 = order.assetTypeTo;

  // Check if the market ID is valid
  Object.keys(Config.market).forEach(key => {
    const marketInfo = (Config.market as MarketIndexSig)[key];
    if (marketInfo.asset1 === assetTypeFrom.toJSON()) {
      if (marketInfo.asset2 === assetTypeTo.toJSON()) {
        return marketInfo.id;
      }
    } else if (marketInfo.asset1 === assetTypeTo.toJSON()) {
      if (marketInfo.asset2 === assetTypeFrom.toJSON()) {
        return marketInfo.id;
      }
    }
  });
  throw { message: "Invalid market" };
}

function getRate(order: Order, marketId: number): number {
  const assetTypeFrom: H256 = order.assetTypeFrom;
  const assetTypeTo: H256 = order.assetTypeTo;
  const assetQuantityFrom: U64 = order.assetQuantityFrom;
  const assetQuantityTo: U64 = order.assetQuantityTo;

  // If not production mode. Always Calculate rate as assetTypeTo/assetTypeFrom
  if (marketId === 0) {
    return assetQuantityTo.value.dividedBy(assetQuantityFrom.value).toNumber();
  }

  // Get market information
  let marketConfig: { id: number; asset1: string; asset2: string };
  Object.keys(Config.market).forEach(key => {
    if ((Config.market as MarketIndexSig)[key].id === marketId) {
      marketConfig = (Config.market as MarketIndexSig)[key];
    }
  });
  if (marketConfig === undefined) {
    throw { message: "Invalid marketId" };
  }

  // Check if the targeted asset types is valid and get a rate between them
  let rate: number;
  if (
    marketConfig.asset1 === assetTypeFrom.toEncodeObject().slice(2) &&
    marketConfig.asset2 === assetTypeTo.toEncodeObject().slice(2)
  ) {
    rate = assetQuantityTo.value.dividedBy(assetQuantityFrom.value).toNumber();
  } else if (
    marketConfig.asset2 === assetTypeFrom.toEncodeObject().slice(2) &&
    marketConfig.asset1 === assetTypeTo.toEncodeObject().slice(2)
  ) {
    rate = assetQuantityFrom.value.dividedBy(assetQuantityTo.value).toNumber();
  } else {
    throw { message: "OrderInfo has invalid asset types" };
  }

  return rate;
}

async function matchOrder(
  inputs: AssetTransferInput[],
  order: Order,
  orders: OrderInstance[],
  makerAddress: string,
  rate: number,
  marketId: number,
  splitTx?: Transaction
): Promise<void | number> {
  while (true) {
    const matchedOrderAux = orders.pop();

    // In case there is no any more order which is matched with incoming order
    if (matchedOrderAux === undefined) {
      const ins = await controllers.orderController.create(
        order.assetTypeFrom.toEncodeObject().slice(2),
        order.assetTypeTo.toEncodeObject().slice(2),
        order.assetQuantityFrom.value.toNumber(),
        rate,
        makerAddress,
        JSON.parse(JSON.stringify(inputs.map(input => input.toJSON()))),
        JSON.parse(JSON.stringify(order.toJSON())),
        null,
        marketId
      );
      // FIXME - Update orderWatcher

      return parseInt(ins.get("id"), 10);
    }

    const matchedOrder = matchedOrderAux.get();
    const remained = matchedOrder.amount;
    const relayedInputs = (JSON.parse(
      JSON.stringify(matchedOrder.assetList)
    ) as AssetTransferInputJSON[]).map(input =>
      AssetTransferInput.fromJSON(input)
    );
    const relayedOrder = Order.fromJSON(
      JSON.parse(JSON.stringify(matchedOrder.order))
    );
    let relayedSplitTx;
    if (matchedOrder.splitTx !== null) {
      relayedSplitTx = fromJSONToSignedTransaction(
        JSON.parse(JSON.stringify(matchedOrder.splitTx))
      );
    } else {
      relayedSplitTx = null;
    }

    // Check a validity of orders
    if (remained !== relayedOrder.assetQuantityFrom.value.toNumber()) {
      throw Error("Matched order is broken - 0");
    }
    if (
      relayedOrder.assetTypeFrom.toJSON() !== matchedOrder.makerAsset ||
      relayedOrder.assetTypeTo.toJSON() !== matchedOrder.takerAsset
    ) {
      throw Error("Matched order is broken - 1");
    }
    const relayedAddress = matchedOrder.makerAddress;

    // In case that matched order is complete fill
    if (remained === order.assetQuantityTo.value.toNumber()) {
      await matchSame(
        relayedInputs,
        inputs,
        relayedAddress,
        relayedOrder,
        makerAddress,
        order,
        matchedOrder,
        relayedSplitTx,
        splitTx
      );
      return null;
    }

    // In case that matched order is partially filled
    else if (remained > order.assetQuantityTo.value.toNumber()) {
      await matchAbove(
        relayedInputs,
        inputs,
        relayedAddress,
        relayedOrder,
        makerAddress,
        matchedOrder,
        order
      );
      return null;
    }
    // In case that incoming order is partially filled
    else {
      const updated = await matchBelow(
        relayedInputs,
        inputs,
        relayedAddress,
        relayedOrder,
        makerAddress,
        matchedOrder,
        order
      );
      inputs = [updated.inputs];
      order = updated.order;
    }
  }
}

// Complete fill
async function matchSame(
  relayedInputs: AssetTransferInput[],
  incomingInputs: AssetTransferInput[],
  relayedOrderAddress: string,
  relayedOrder: Order,
  incomingOrderAddress: string,
  incomingOrder: Order,
  matchedOrder: OrderAttriubutes,
  realyedSplitTx?: SignedTransaction,
  splitTx?: Transaction
): Promise<void> {
  let idx = 0;
  const relayedOutputIdx = [];
  const incomingOutputIdx = [];

  // Add asset newely gain
  const transferTx = sdk.core
    .createTransferAssetTransaction()
    .addInputs(relayedInputs)
    .addInputs(incomingInputs)
    .addOutputs(
      {
        recipient: relayedOrderAddress,
        quantity: relayedOrder.assetQuantityTo,
        assetType: relayedOrder.assetTypeTo,
        shardId: relayedOrder.shardIdTo
      },
      {
        recipient: incomingOrderAddress,
        quantity: incomingOrder.assetQuantityTo,
        assetType: incomingOrder.assetTypeTo,
        shardId: incomingOrder.shardIdTo
      }
    );
  relayedOutputIdx.push(idx++);
  incomingOutputIdx.push(idx++);

  // Add remain asset for relayed order
  const relayedassets: Map<string, U64> = new Map();
  for (const input of relayedInputs) {
    if (relayedassets.has(input.prevOut.assetType.toJSON())) {
      const quantity = relayedassets.get(input.prevOut.assetType.toJSON());
      relayedassets.set(
        input.prevOut.assetType.toJSON(),
        input.prevOut.quantity.plus(quantity)
      );
    } else {
      relayedassets.set(
        input.prevOut.assetType.toJSON(),
        input.prevOut.quantity
      );
    }
  }
  let remainAmount = relayedassets
    .get(relayedOrder.assetTypeFrom.toJSON())
    .minus(relayedOrder.assetQuantityFrom);
  if (remainAmount.eq(0)) {
    relayedassets.delete(relayedOrder.assetTypeFee.toJSON());
  } else {
    relayedassets.set(relayedOrder.assetTypeFee.toJSON(), remainAmount);
  }
  if (remainAmount.isGreaterThan(0)) {
    transferTx.addOutputs({
      recipient: relayedOrderAddress,
      quantity: remainAmount,
      assetType: relayedOrder.assetTypeFrom,
      shardId: relayedOrder.shardIdFrom
    });
    relayedOutputIdx.push(idx++);
  }
  if (!relayedOrder.assetQuantityFee.eq(0)) {
    const remainFeeAmount = relayedassets
      .get(relayedOrder.assetTypeFee.toJSON())
      .minus(relayedOrder.assetQuantityFee);
    if (remainFeeAmount.eq(0)) {
      relayedassets.delete(relayedOrder.assetTypeFee.toJSON());
    } else {
      relayedassets.set(relayedOrder.assetTypeFee.toJSON(), remainFeeAmount);
    }
    if (remainFeeAmount.isGreaterThan(0)) {
      transferTx.addOutputs({
        recipient: relayedOrderAddress,
        quantity: remainFeeAmount,
        assetType: relayedOrder.assetTypeFee,
        shardId: relayedOrder.shardIdFee
      });
      relayedOutputIdx.push(idx++);
    }
  }

  const incomingassets: Map<string, U64> = new Map();
  for (const input of incomingInputs) {
    if (incomingassets.has(input.prevOut.assetType.toJSON())) {
      const quantity = incomingassets.get(input.prevOut.assetType.toJSON());
      incomingassets.set(
        input.prevOut.assetType.toJSON(),
        input.prevOut.quantity.plus(quantity)
      );
    } else {
      incomingassets.set(
        input.prevOut.assetType.toJSON(),
        input.prevOut.quantity
      );
    }
  }
  remainAmount = incomingassets
    .get(incomingOrder.assetTypeFrom.toJSON())
    .minus(incomingOrder.assetQuantityFrom);
  if (remainAmount.eq(0)) {
    incomingassets.delete(incomingOrder.assetTypeFrom.toJSON());
  } else {
    incomingassets.set(incomingOrder.assetTypeFrom.toJSON(), remainAmount);
  }
  if (remainAmount.isGreaterThan(0)) {
    transferTx.addOutputs({
      recipient: incomingOrderAddress,
      quantity: remainAmount,
      assetType: incomingOrder.assetTypeFrom,
      shardId: incomingOrder.shardIdFrom
    });
    incomingOutputIdx.push(idx++);
  }
  if (!incomingOrder.assetQuantityFee.eq(0)) {
    const remainFeeAmount = incomingassets
      .get(incomingOrder.assetTypeFee.toJSON())
      .minus(incomingOrder.assetQuantityFee);
    if (remainFeeAmount.eq(0)) {
      incomingassets.delete(incomingOrder.assetTypeFee.toJSON());
    } else {
      incomingassets.set(incomingOrder.assetTypeFee.toJSON(), remainFeeAmount);
    }
    if (remainFeeAmount.isGreaterThan(0)) {
      transferTx.addOutputs({
        recipient: incomingOrderAddress,
        quantity: remainFeeAmount,
        assetType: incomingOrder.assetTypeFee,
        shardId: incomingOrder.shardIdFee
      });
      incomingOutputIdx.push(idx++);
    }
  }

  // Add fee payment Output
  if (!relayedOrder.assetQuantityFee.eq(0)) {
    transferTx.addOutputs({
      recipient: DEX_ASSET_ADDRESS,
      quantity: relayedOrder.assetQuantityFee,
      assetType: relayedOrder.assetTypeFee,
      shardId: relayedOrder.shardIdFee
    });
    relayedOutputIdx.push(idx++);
  }
  if (!incomingOrder.assetQuantityFee.eq(0)) {
    transferTx.addOutputs({
      recipient: DEX_ASSET_ADDRESS,
      quantity: incomingOrder.assetQuantityFee,
      assetType: incomingOrder.assetTypeFee,
      shardId: incomingOrder.shardIdFee
    });
    incomingOutputIdx.push(idx++);
  }

  // Add order
  transferTx
    .addOrder({
      order: relayedOrder,
      spentQuantity: relayedOrder.assetQuantityFrom,
      inputIndices: _.range(relayedInputs.length),
      outputIndices: relayedOutputIdx
    })
    .addOrder({
      order: incomingOrder,
      spentQuantity: relayedOrder.assetQuantityTo,
      inputIndices: _.range(relayedInputs.length + incomingInputs.length).slice(
        relayedInputs.length
      ),
      outputIndices: incomingOutputIdx
    });

  // FIXME - Confirm the splitTx if exists
  if (splitTx) {
    console.log("Not implemented");
  }
  if (realyedSplitTx) {
    console.log("Not implemented");
  }

  // Confirm the order transaction
  if (env === "development") {
    const seq = await sdk.rpc.chain.getSeq(ACCOUNT_ADDRESS_DEV);
    await sdk.rpc.chain.sendSignedTransaction(
      transferTx.sign({
        secret: ACCOUNT_SECRET_DEV,
        fee: 100,
        seq
      })
    );
  } else if (env === "test") {
    // Run on Corgi test network
    const seq = await sdk.rpc.chain.getSeq(ACCOUNT_ADDRESS_TEST);
    await sdk.rpc.chain.sendSignedTransaction(
      transferTx.sign({
        secret: ACCOUNT_SECRET_TEST,
        fee: 100,
        seq
      })
    );
  } else {
    // Run on main network
    const keyStore = await sdk.key.createLocalKeyStore("../config/keystore.db");
    const platformAddress = await keyStore.platform.getKeyList();

    // Local keystore should store only one key. If not, which key will be used is undefined.
    const seq = await sdk.rpc.chain.getSeq(platformAddress[0]);

    await sdk.key.signTransaction(transferTx, {
      keyStore,
      account: platformAddress[0],
      fee: 100,
      seq
    });
  }

  const transferTxResults = await sdk.rpc.chain.getTransactionResultsByTracker(
    transferTx.tracker(),
    {
      timeout: 300 * 1000
    }
  );
  if (!transferTxResults[0]) {
    throw Error(
      `AssetTransferTransaction failed: ${JSON.stringify(transferTxResults[0])}`
    );
  }

  // Destory realyed order
  await controllers.orderController.destroy(parseInt(matchedOrder.id, 10));

  return;
}

// Matched order is partially filled
async function matchAbove(
  relayedInputs: AssetTransferInput[],
  inputs: AssetTransferInput[],
  relayedAddress: string,
  relayedOrder: Order,
  makerAddress: string,
  matchedOrder: OrderAttriubutes,
  order: Order
): Promise<void> {
  // Add asset newely gain
  const transferTx = sdk.core
    .createTransferAssetTransaction()
    .addInputs(relayedInputs)
    .addInputs(inputs)
    .addOutputs(
      {
        recipient: relayedAddress,
        quantity: order.assetQuantityFrom,
        assetType: matchedOrder.takerAsset,
        shardId: 0
      },
      {
        recipient: makerAddress,
        quantity: order.assetQuantityTo,
        assetType: matchedOrder.makerAsset,
        shardId: 0
      }
    );

  // Add remain asset
  let relayedAmount: number;
  for (const input of relayedInputs) {
    relayedAmount += input.prevOut.quantity.value.toNumber();
  }
  const relayedRemainedAsset =
    relayedAmount - order.assetQuantityTo.value.toNumber();
  if (relayedRemainedAsset > 0) {
    transferTx.addOutputs({
      recipient: relayedAddress,
      quantity: relayedRemainedAsset,
      assetType: matchedOrder.makerAsset,
      shardId: 0
    });
  }
  let amount: number;
  for (const input of inputs) {
    amount += input.prevOut.quantity.value.toNumber();
  }
  const remainedAsset = amount - order.assetQuantityFrom.value.toNumber();
  if (remainedAsset > 0) {
    transferTx.addOutputs({
      recipient: makerAddress,
      quantity: remainedAsset,
      assetType: matchedOrder.takerAsset,
      shardId: 0
    });
  }

  // Add order
  transferTx
    .addOrder({
      order: relayedOrder,
      spentQuantity: order.assetQuantityTo,
      inputIndices: Array.from(Array(relayedInputs.length).keys()),
      outputIndices: [2]
    })
    .addOrder({
      order,
      spentQuantity: order.assetQuantityFrom,
      inputIndices: Array.from(
        Array(relayedInputs.length + inputs.length).keys()
      ).slice(relayedInputs.length),
      outputIndices: []
    });
  // FIXME - Add fee payment Output
  // FIXME - Confirm the transaction and update ramain order
}

// Incoming order is partially filled
async function matchBelow(
  relayedInputs: AssetTransferInput[],
  inputs: AssetTransferInput[],
  relayedAddress: string,
  relayedOrder: Order,
  makerAddress: string,
  matchedOrder: OrderAttriubutes,
  order: Order
): Promise<{ inputs: AssetTransferInput; order: Order }> {
  // Add asset newely gain
  const transferTx = sdk.core
    .createTransferAssetTransaction()
    .addInputs(relayedInputs)
    .addInputs(inputs)
    .addOutputs(
      {
        recipient: relayedAddress,
        quantity: relayedOrder.assetQuantityTo,
        assetType: matchedOrder.takerAsset,
        shardId: 0
      },
      {
        recipient: makerAddress,
        quantity: relayedOrder.assetQuantityFrom,
        assetType: matchedOrder.makerAsset,
        shardId: 0
      }
    );

  // Add remain asset
  let relayedAmount: number;
  for (const input of relayedInputs) {
    relayedAmount += input.prevOut.quantity.value.toNumber();
  }
  const relayedRemainedAsset =
    relayedAmount - relayedOrder.assetQuantityFrom.value.toNumber();
  if (relayedRemainedAsset > 0) {
    transferTx.addOutputs({
      recipient: relayedAddress,
      quantity: relayedRemainedAsset,
      assetType: matchedOrder.makerAsset,
      shardId: 0
    });
  }
  let amount: number;
  for (const input of inputs) {
    amount += input.prevOut.quantity.value.toNumber();
  }
  const remainedAsset = amount - relayedOrder.assetQuantityTo.value.toNumber();
  if (remainedAsset > 0) {
    transferTx.addOutputs({
      recipient: makerAddress,
      quantity: remainedAsset,
      assetType: matchedOrder.takerAsset,
      shardId: 0
    });
  }

  // Add order
  transferTx
    .addOrder({
      order: relayedOrder,
      spentQuantity: order.assetQuantityTo,
      inputIndices: Array.from(Array(relayedInputs.length).keys()),
      outputIndices: []
    })
    .addOrder({
      order,
      spentQuantity: order.assetQuantityFrom,
      inputIndices: Array.from(
        Array(relayedInputs.length + inputs.length).keys()
      ).slice(relayedInputs.length),
      outputIndices: [3]
    });

  // FIXME - Add fee payment Output
  // FIXME - Confirm the transaction and return remain amount

  return {
    inputs: null,
    order: null
  };
}
