import { H256, U64 } from "codechain-primitives";
import { SDK } from "codechain-sdk";
import { AssetOutPoint } from "codechain-sdk/lib/core/transaction/AssetOutPoint";
import { AssetTransferInput } from "codechain-sdk/lib/core/transaction/AssetTransferInput";
import { AssetTransferInputJSON } from "codechain-sdk/lib/core/transaction/AssetTransferInput";
import { Order } from "codechain-sdk/lib/core/transaction/Order";
import { TransferAsset } from "codechain-sdk/lib/core/transaction/TransferAsset";
import { Server } from "../../app";
import * as Config from "../config/dex.json";
import { controllers } from "../controllers";
import { OrderAttriubutes, OrderInstance } from "../models/order";

// FIXME - use codechain RPC
function executeScript(_: AssetTransferInput[]): boolean {
  console.log("Not implemented");
  return true;
}

interface IndexSig {
  [key: string]: { id: number; asset1: string; asset2: string };
}

export async function submit(
  assetList: AssetTransferInput[],
  order: Order,
  marketId: number,
  makerAddress: string,
  splitTx?: TransferAsset
): Promise<void | number> {
  let isSplit: boolean = null;
  if (splitTx === null) {
    isSplit = false;
    console.log("splitTx is along with orderTx" + isSplit);
  }

  if (!checkTX(assetList)) {
    throw Error("Invalid transaction - 0");
  }

  const assetTypeFrom: H256 = order.assetTypeFrom;
  const assetTypeTo: H256 = order.assetTypeTo;
  const assetQuantityFrom: number = order.assetQuantityFrom.value.toNumber();
  const rate = getRate(order, marketId);

  if (rate === null) {
    throw Error("Invalid transaction - 1");
  }

  const orders = await controllers.orderController.find(
    assetTypeTo.toEncodeObject().slice(2),
    assetTypeFrom.toEncodeObject().slice(2),
    null,
    rate,
    null,
    null,
    null,
    marketId
  );
  // In case that there is no any matched orders
  if (orders.length === 0) {
    const ins = await controllers.orderController.create(
      assetTypeFrom.toEncodeObject().slice(2),
      assetTypeTo.toEncodeObject().slice(2),
      assetQuantityFrom,
      rate,
      makerAddress,
      JSON.parse(JSON.stringify(assetList.map(input => input.toJSON()))),
      JSON.parse(JSON.stringify(order.toJSON())),
      marketId
    );
    return parseInt(ins.get().id, 10);
  }

  // In case that there are matched orders
  return await matchOrder(
    assetList,
    order,
    orders,
    makerAddress,
    rate,
    marketId
  );
}

function checkTX(inputs: AssetTransferInput[]): boolean {
  // Check if unlock scripts in input is valid
  if (!executeScript(inputs)) {
    throw { message: "tx is not valid" };
  }
  // Get UTXO list
  const utxo: AssetOutPoint[] = [];
  for (const input of inputs) {
    utxo.push(input.prevOut);
  }

  // FIXME - check if UTXOs are the same asset type
  // FIXME - check if UTXOs really exist
  // FIXME - check If UTXOs is the same with orgin output of the order
  // FIXME - check if UTXOs have enought amount to pay order
  // FIXME - check pubkey hash is standard script
  // FIXME - register UTXO and expiration date to order watcher
  // FIXME - check if a fee is properly paid
  return true;
}

function getRate(order: Order, marketId: number): number | null {
  const assetTypeFrom: H256 = order.assetTypeFrom;
  const assetTypeTo: H256 = order.assetTypeTo;
  const assetQuantityFrom: U64 = order.assetQuantityFrom;
  const assetQuantityTo: U64 = order.assetQuantityTo;

  // Check if the market ID is valid
  let marketConfig: { id: number; asset1: string; asset2: string };
  Object.keys(Config.market).forEach(key => {
    if ((Config.market as IndexSig)[key].id === marketId) {
      marketConfig = (Config.market as IndexSig)[key];
    }
  });
  if (marketConfig === undefined) {
    return null;
  }

  // Check if the targeted asset types is valid and get a rate between them
  let rate;
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
    return null;
  }

  return rate;
}

async function matchOrder(
  incomingInputs: AssetTransferInput[],
  incomingOrder: Order,
  orders: OrderInstance[],
  makerAddress: string,
  rate: number,
  marketId: number
): Promise<void | number> {
  const sdk = new SDK({ server: Server.chain });
  let inputs: AssetTransferInput[] = incomingInputs;
  let order: Order = incomingOrder;

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
        marketId
      );

      return parseInt(ins.get().id, 10);
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

    // Check a validity of orders
    if (remained !== relayedOrder.assetQuantityFrom.value.toNumber()) {
      throw Error("Order is broken - 0");
    }
    if (
      relayedOrder.assetTypeFrom.toEncodeObject().slice(2) !==
        matchedOrder.makerAsset ||
      relayedOrder.assetTypeTo.toEncodeObject().slice(2) !==
        matchedOrder.takerAsset
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

    // In case that matched order is fully filled
    if (remained === order.assetQuantityTo.value.toNumber()) {
      await matchSame(
        sdk,
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
    // In case that matched order is partially filled
    else if (remained > order.assetQuantityTo.value.toNumber()) {
      await matchAbove(
        sdk,
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
        sdk,
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
  sdk: SDK,
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
  let relayedAmount: number = 0;
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
  let amount: number = 0;
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
      spentQuantity: relayedOrder.assetQuantityFrom,
      inputIndices: Array.from(Array(relayedInputs.length).keys()),
      outputIndices: [0, 2]
    })
    .addOrder({
      order,
      spentQuantity: relayedOrder.assetQuantityTo,
      inputIndices: Array.from(
        Array(relayedInputs.length + inputs.length).keys()
      ).slice(relayedInputs.length),
      outputIndices: [1, 3]
    });
  // FIXME - Add fee payment Output
  // FIXME - Confirm the transaction

  await controllers.orderController.destroy(parseInt(matchedOrder.id, 10));
}

async function matchAbove(
  sdk: SDK,
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
  sdk: SDK,
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
