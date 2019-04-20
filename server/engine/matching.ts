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
const sdk = new SDK({ server: rpcServer });
const DEX_PLATFORM_ADDRESS = Config["dex-platform-address"];
const DEX_ASSET_ADDRESS = Config["dex-asset-address"];
const passpharase = Config["dex-passphrase"];
const FEE_RATE = Config["fee-rate"];
const FEE_ASSET_TYPE = Config["fee-asset-type"];

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
  let isSplit: boolean = null;
  if (splitTx === null) {
    isSplit = false;
    console.log("splitTx is not along with orderTx " + isSplit);
  }

  const assetTypeFrom: H256 = order.assetTypeFrom;
  const isFeePayingOrder: boolean =
    assetTypeFrom.toJSON() === FEE_ASSET_TYPE ? true : false;

  const marketId = checkTX(
    assetList,
    order,
    isSplit,
    isFeePayingOrder,
    splitTx
  );
  const rate = getRate(order, marketId);

  const assetTypeTo: H256 = order.assetTypeTo;
  const assetQuantityFrom: number = order.assetQuantityFrom.value.toNumber();

  if (rate === null) {
    throw Error("Invalid transaction - 1");
  }

  const orders = await controllers.orderController.find(
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
  // In case that there is no any matched orders
  if (orders.length === 0) {
    if (isSplit) {
      await controllers.orderController.create(
        assetTypeFrom.toJSON(),
        assetTypeTo.toJSON(),
        assetQuantityFrom,
        rate,
        makerAddress,
        JSON.parse(JSON.stringify(assetList.map(input => input.toJSON()))),
        JSON.parse(JSON.stringify(order.toJSON())),
        JSON.parse(JSON.stringify(splitTx.toJSON())),
        marketId
      );
    } else {
      await controllers.orderController.create(
        assetTypeFrom.toJSON(),
        assetTypeTo.toJSON(),
        assetQuantityFrom,
        rate,
        makerAddress,
        JSON.parse(JSON.stringify(assetList.map(input => input.toJSON()))),
        JSON.parse(JSON.stringify(order.toJSON())),
        null,
        marketId
      );
    }

    return null;
  }

  // In case that there are matched orders
  await matchOrder(
    assetList,
    order,
    orders,
    makerAddress,
    rate,
    marketId,
    true, // FIXME - TEMP
    splitTx
  );
  // FIXME - register UTXO and expiration date to order watcher

  return null;
}

function checkTX(
  inputs: AssetTransferInput[],
  order: Order,
  isSplit: boolean,
  isFeePayingOrder: boolean,
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

  // Check if a fee is properly paid
  if (isFeePayingOrder) {
    if (order.assetTypeFee.toJSON() !== FEE_ASSET_TYPE) {
      throw Error("assetTypeFee is incorrect");
    }
    if (
      !order.assetQuantityFee.isGreaterThanOrEqualTo(
        order.assetQuantityFrom.times(FEE_RATE)
      )
    ) {
      throw Error("assetQuantityFee is incorrect");
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
    console.log("Not impleented");
  }
  return true;
}

function checkOrderTx(inputs: AssetTransferInput[], order: Order): void {
  let amount: U64 = new U64(0);
  for (const input of inputs) {
    amount = amount.plus(input.prevOut.quantity);

    // check if UTXOs are the same asset type
    /* FIXME - TEMP
    if (!input.prevOut.assetType.isEqualTo(order.assetTypeFrom)) {
      throw Error("inputs of orderTx are not valid");
    }*/

    // check If UTXOs is the same with orgin output of the order
    if (order.originOutputs.indexOf(input.prevOut) === -1) {
      throw Error("inputs of orderTx are not valid");
    }
  }
  // Check if there is sufficient amount of asset
  /* FIXME -TEMP
  if (amount.isLessThan(order.assetQuantityFee.plus(order.assetQuantityFrom))) {
    throw Error(
      `inputs are not sufficient for paying order ${amount} ${order.assetQuantityFee.plus(
        order.assetQuantityFrom
      )}`
    );
  }*/
}

function checkMarket(order: Order): number {
  // If not production mode
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

function getRate(order: Order, marketId: number): number | null {
  const assetTypeFrom: H256 = order.assetTypeFrom;
  const assetTypeTo: H256 = order.assetTypeTo;
  const assetQuantityFrom: U64 = order.assetQuantityFrom;
  const assetQuantityTo: U64 = order.assetQuantityTo;

  // If not production mode. Always Calculate rate with wcc as denominator
  /* FIXME - TEMP
  if (marketId === 0) {
    if (assetTypeFrom.toJSON() === FEE_ASSET_TYPE) {
      return assetQuantityTo.value
        .dividedBy(assetQuantityFrom.value)
        .toNumber();
    } else {
      return assetQuantityFrom.value
        .dividedBy(assetQuantityTo.value)
        .toNumber();
    }
  }*/
  if (marketId === 0) {
    return 0;
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
  isFeePayingOrder: boolean,
  splitTx?: Transaction
): Promise<void | number> {
  while (true) {
    const matchedOrderAux = orders.pop();
    if (matchedOrderAux === null || matchedOrderAux === undefined) {
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
      throw Error("Order is broken - 0");
    }
    if (
      relayedOrder.assetTypeFrom.toJSON() !== matchedOrder.makerAsset ||
      relayedOrder.assetTypeTo.toJSON() !== matchedOrder.takerAsset
    ) {
      throw Error("Order is broken - 1");
    }
    const relayedAddress = matchedOrder.makerAddress;
    let relayedAmount: number = 0;
    for (const input of relayedInputs) {
      relayedAmount += input.prevOut.quantity.value.toNumber();
    }
    if (relayedAmount < relayedOrder.assetQuantityFrom.value.toNumber()) {
      throw Error("Order is broken - 2");
    }
    let incomingAmount: number = 0;
    for (const input of inputs) {
      incomingAmount += input.prevOut.quantity.value.toNumber();
    }
    if (incomingAmount < order.assetQuantityFrom.value.toNumber()) {
      throw Error("Order is broken - 3");
    }

    // In case that matched order is complete fill
    if (remained === order.assetQuantityTo.value.toNumber()) {
      await matchSame(
        relayedInputs,
        inputs,
        relayedAddress,
        relayedOrder,
        makerAddress,
        matchedOrder,
        order,
        isFeePayingOrder,
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
    // In case that matched order is fully filled and there is a remain amount in a incoming order
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

async function matchSame(
  relayedInputs: AssetTransferInput[],
  incomingInputs: AssetTransferInput[],
  relayedOrderAddress: string,
  relayedOrder: Order,
  incomingOrderAddress: string,
  matchedOrder: OrderAttriubutes,
  incomingOrder: Order,
  isFeePayingOrder: boolean,
  realyedSplitTx?: SignedTransaction,
  splitTx?: Transaction
): Promise<void> {
  // Add asset newely gain
  const transferTx = sdk.core
    .createTransferAssetTransaction()
    .addInputs(relayedInputs)
    .addInputs(incomingInputs)
    .addOutputs(
      {
        recipient: relayedOrderAddress,
        quantity: relayedOrder.assetQuantityTo,
        assetType: matchedOrder.takerAsset,
        shardId: relayedOrder.shardIdTo
      },
      {
        recipient: incomingOrderAddress,
        quantity: relayedOrder.assetQuantityFrom,
        assetType: matchedOrder.makerAsset,
        shardId: relayedOrder.shardIdFrom
      }
    );

  // Add remain asset
  let relayedAmount: number = 0;
  for (const input of relayedInputs) {
    relayedAmount += input.prevOut.quantity.value.toNumber();
  }
  const relayedRemainedAsset = isFeePayingOrder
    ? relayedAmount - relayedOrder.assetQuantityFrom.value.toNumber()
    : relayedAmount -
      relayedOrder.assetQuantityFrom.value.toNumber() -
      relayedOrder.assetQuantityFee.value.toNumber();
  if (relayedRemainedAsset > 0) {
    transferTx.addOutputs({
      recipient: relayedOrderAddress,
      quantity: relayedRemainedAsset,
      assetType: matchedOrder.makerAsset,
      shardId: relayedOrder.shardIdFrom
    });
  }

  // FIXME - TEMP
  const feeInput = incomingInputs.pop();

  let amount: number = 0;
  for (const input of incomingInputs) {
    amount += input.prevOut.quantity.value.toNumber();
  }
  const remainedAsset =
    amount - incomingOrder.assetQuantityFrom.value.toNumber();
  /* FIXME - TEMP
  const remainedAsset = isFeePayingOrder
    ? amount -
    incomingOrder.assetQuantityFrom.value.toNumber() -
    incomingOrder.assetQuantityFee.value.toNumber()
    : amount - incomingOrder.assetQuantityFrom.value.toNumber();*/
  if (remainedAsset > 0) {
    transferTx.addOutputs({
      recipient: incomingOrderAddress,
      quantity: remainedAsset,
      assetType: matchedOrder.takerAsset,
      shardId: relayedOrder.shardIdTo
    });
  }

  // Add fee payment Output
  if (isFeePayingOrder) {
    transferTx.addOutputs(
      {
        recipient: DEX_ASSET_ADDRESS,
        quantity: incomingOrder.assetQuantityFee,
        assetType: incomingOrder.assetTypeFee,
        shardId: incomingOrder.shardIdFee
      },
      {
        recipient: incomingOrderAddress,
        quantity: feeInput.prevOut.quantity.minus(
          incomingOrder.assetQuantityFee
        ),
        assetType: incomingOrder.assetTypeFee,
        shardId: incomingOrder.shardIdFee
      }
    );
  } else {
    transferTx.addOutputs({
      recipient: DEX_ASSET_ADDRESS,
      quantity: relayedOrder.assetQuantityFee,
      assetType: relayedOrder.assetTypeFee,
      shardId: relayedOrder.shardIdFee
    });
  }

  // FIXME - TEMP
  incomingInputs.push(feeInput);
  // Add order
  transferTx
    .addOrder({
      order: relayedOrder,
      spentQuantity: relayedOrder.assetQuantityFrom,
      inputIndices: _.range(relayedInputs.length),
      outputIndices: isFeePayingOrder ? [0, 2] : [0, 2, 4]
    })
    .addOrder({
      order: incomingOrder,
      spentQuantity: relayedOrder.assetQuantityTo,
      inputIndices: _.range(relayedInputs.length + incomingInputs.length).slice(
        relayedInputs.length
      ),
      outputIndices: isFeePayingOrder ? [1, 3, 4, 5] : [1, 3]
    });

  // FIXME - Confirm the splitTx if exists
  if (splitTx) {
    console.log("Not implemented");
  }
  if (realyedSplitTx) {
    console.log("Not implemented");
  }

  // Confirm the order transaction
  await sdk.rpc.chain.sendTransaction(transferTx, {
    account: DEX_PLATFORM_ADDRESS,
    passphrase: passpharase
  });
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
