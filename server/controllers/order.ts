import { U64 } from "codechain-primitives/lib";
import { SDK } from "codechain-sdk";
import {
  AssetOutPoint,
  AssetTransferInput,
  H256,
  Order
} from "codechain-sdk/lib/core/classes";
import { AssetTransferInputJSON } from "codechain-sdk/lib/core/transaction/AssetTransferInput";
import { Op } from "sequelize";
import { Server } from "../../app";
import * as Config from "../config/dex.json";
import db from "../models";
import { OrderAttriubutes, OrderInstance } from "../models/order";

export async function create(
  makerAsset: string,
  takerAsset: string,
  amount: number,
  rate: number,
  makerAddress: string,
  assetList: JSON,
  order: JSON,
  marketId: number
): Promise<OrderInstance> {
  return db.Order.create({
    makerAsset,
    takerAsset,
    amount,
    rate,
    makerAddress,
    assetList,
    order,
    marketId
  });
}

export async function find(
  makerAsset?: string,
  takerAsset?: string,
  amount?: number,
  rate?: number,
  makerAddress?: string,
  assetList?: JSON,
  order?: JSON,
  marketId?: number
): Promise<OrderInstance[]> {
  const where = {
    makerAsset,
    takerAsset,
    amount,
    rate,
    makerAddress,
    assetList,
    order,
    marketId
  };
  for (const o in where) {
    if ((where as any)[o] === null || (where as any)[o] === undefined) {
      delete (where as any)[o];
    }
  }
  return await db.Order.findAll({
    where,
    order: [["updatedAt", "DESC"]]
  });
}

// Get orders in given range
export async function orderbook(
  range: number,
  marketPrice: number
): Promise<OrderInstance[]> {
  let upOrders: OrderInstance[] = [];
  let downOrders: OrderInstance[] = [];
  let pivot: number = 0;

  for (let i = 0; i < range; i++) {
    await db.Order.min("rate", {
      where: {
        rate: { [Op.and]: [{ [Op.gt]: marketPrice }, { [Op.gt]: pivot }] }
      }
    }).then(async min => {
      pivot = min;
      const orders = await db.Order.findAll({
        where: {
          rate: min
        }
      });
      upOrders = upOrders.concat(orders);
    });
  }

  pivot = Number.MAX_VALUE;
  for (let i = 0; i < range; i++) {
    await db.Order.max("rate", {
      where: {
        rate: { [Op.and]: [{ [Op.lt]: marketPrice }, { [Op.lt]: pivot }] }
      }
    }).then(async max => {
      pivot = max;
      const orders = await db.Order.findAll({
        where: {
          rate: max
        }
      });
      downOrders = downOrders.concat(orders);
    });
  }

  return downOrders.reverse().concat(upOrders);
}

export async function destroy(id: number): Promise<void> {
  const order = await db.Order.findById(id);
  if (!order) {
    throw { message: "Order Not Found" };
  }
  return order.destroy();
}

export async function update(id: number, body: any): Promise<OrderInstance> {
  const order = await db.Order.findById(id);
  if (!order) {
    throw { message: "Order Not Found" };
  }
  return order.update(body, { fields: Object.keys(body) });
}

// FIXME - use codechain RPC
function executeScript(_inputs: AssetTransferInput[]): boolean {
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
  makerAddress: string
): Promise<void | number> {
  if (!checkTX(assetList)) {
    throw Error("Invalid transaction - 0");
  }

  const assetTypeFrom: H256 = order.assetTypeFrom;
  const assetTypeTo: H256 = order.assetTypeTo;
  const assetAmountFrom: number = order.assetAmountFrom.value.toNumber();
  const rate = getRate(order, marketId);

  if (rate === null) {
    throw Error("Invalid transaction - 1");
  }

  const orders = await find(
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
    const ins = await create(
      assetTypeFrom.toEncodeObject().slice(2),
      assetTypeTo.toEncodeObject().slice(2),
      assetAmountFrom,
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
  const assetAmountFrom: U64 = order.assetAmountFrom;
  const assetAmountTo: U64 = order.assetAmountTo;

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
    rate = assetAmountTo.value.dividedBy(assetAmountFrom.value).toNumber();
  } else if (
    marketConfig.asset2 === assetTypeFrom.toEncodeObject().slice(2) &&
    marketConfig.asset1 === assetTypeTo.toEncodeObject().slice(2)
  ) {
    rate = assetAmountFrom.value.dividedBy(assetAmountTo.value).toNumber();
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
      const ins = await create(
        order.assetTypeFrom.toEncodeObject().slice(2),
        order.assetTypeTo.toEncodeObject().slice(2),
        order.assetAmountFrom.value.toNumber(),
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
    if (remained !== relayedOrder.assetAmountFrom.value.toNumber()) {
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
      relayedAmount += input.prevOut.amount.value.toNumber();
    }
    if (relayedAmount < relayedOrder.assetAmountFrom.value.toNumber()) {
      throw Error("Order is broken - 2");
    }
    let incomingAmount: number = 0;
    for (const input of inputs) {
      incomingAmount += input.prevOut.amount.value.toNumber();
    }
    if (incomingAmount < order.assetAmountFrom.value.toNumber()) {
      throw Error("Order is broken - 3");
    }

    // In case that matched order is fully filled
    if (remained === order.assetAmountTo.value.toNumber()) {
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
    else if (remained > order.assetAmountTo.value.toNumber()) {
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
    .createAssetTransferTransaction()
    .addInputs(relayedInputs)
    .addInputs(inputs)
    .addOutputs(
      {
        recipient: relayedAddress,
        amount: relayedOrder.assetAmountTo,
        assetType: matchedOrder.takerAsset
      },
      {
        recipient: makerAddress,
        amount: relayedOrder.assetAmountFrom,
        assetType: matchedOrder.makerAsset
      }
    );

  // Add remain asset
  let relayedAmount: number = 0;
  for (const input of relayedInputs) {
    relayedAmount += input.prevOut.amount.value.toNumber();
  }
  const relayedRemainedAsset =
    relayedAmount - relayedOrder.assetAmountFrom.value.toNumber();
  if (relayedRemainedAsset > 0) {
    transferTx.addOutputs({
      recipient: relayedAddress,
      amount: relayedRemainedAsset,
      assetType: matchedOrder.makerAsset
    });
  }
  let amount: number = 0;
  for (const input of inputs) {
    amount += input.prevOut.amount.value.toNumber();
  }
  const remainedAsset = amount - relayedOrder.assetAmountTo.value.toNumber();
  if (remainedAsset > 0) {
    transferTx.addOutputs({
      recipient: makerAddress,
      amount: remainedAsset,
      assetType: matchedOrder.takerAsset
    });
  }

  // Add order
  transferTx
    .addOrder({
      order: relayedOrder,
      spentAmount: relayedOrder.assetAmountFrom,
      inputIndices: Array.from(Array(relayedInputs.length).keys()),
      outputIndices: [0, 2]
    })
    .addOrder({
      order,
      spentAmount: relayedOrder.assetAmountTo,
      inputIndices: Array.from(
        Array(relayedInputs.length + inputs.length).keys()
      ).slice(relayedInputs.length),
      outputIndices: [1, 3]
    });
  // FIXME - Add fee payment Output
  console.log(JSON.stringify(transferTx.toJSON()));
  const fillParcel = sdk.core.createAssetTransactionParcel({
    transaction: transferTx
  });
  await sdk.rpc.chain.sendParcel(fillParcel, {
    account: Config["dex-platform-address"],
    passphrase: Config["dex-passphrase"]
  });

  await destroy(parseInt(matchedOrder.id, 10));
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
    .createAssetTransferTransaction()
    .addInputs(relayedInputs)
    .addInputs(inputs)
    .addOutputs(
      {
        recipient: relayedAddress,
        amount: order.assetAmountFrom,
        assetType: matchedOrder.takerAsset
      },
      {
        recipient: makerAddress,
        amount: order.assetAmountTo,
        assetType: matchedOrder.makerAsset
      }
    );

  // Add remain asset
  let relayedAmount: number;
  for (const input of relayedInputs) {
    relayedAmount += input.prevOut.amount.value.toNumber();
  }
  const relayedRemainedAsset =
    relayedAmount - order.assetAmountTo.value.toNumber();
  if (relayedRemainedAsset > 0) {
    transferTx.addOutputs({
      recipient: relayedAddress,
      amount: relayedRemainedAsset,
      assetType: matchedOrder.makerAsset
    });
  }
  let amount: number;
  for (const input of inputs) {
    amount += input.prevOut.amount.value.toNumber();
  }
  const remainedAsset = amount - order.assetAmountFrom.value.toNumber();
  if (remainedAsset > 0) {
    transferTx.addOutputs({
      recipient: makerAddress,
      amount: remainedAsset,
      assetType: matchedOrder.takerAsset
    });
  }

  // Add order
  transferTx
    .addOrder({
      order: relayedOrder,
      spentAmount: order.assetAmountTo,
      inputIndices: Array.from(Array(relayedInputs.length).keys()),
      outputIndices: [2]
    })
    .addOrder({
      order,
      spentAmount: order.assetAmountFrom,
      inputIndices: Array.from(
        Array(relayedInputs.length + inputs.length).keys()
      ).slice(relayedInputs.length),
      outputIndices: []
    });
  // FIXME - Add fee payment Output
  const fillParcel = sdk.core.createAssetTransactionParcel({
    transaction: transferTx
  });
  await sdk.rpc.chain.sendParcel(fillParcel, {
    account: Config["dex-platform-address"],
    passphrase: Config["dex-passphrase"]
  });

  const updatedOrder = Order.fromJSON(
    JSON.parse(JSON.stringify(matchedOrder.order))
  ).consume(order.assetAmountTo);
  update(parseInt(matchedOrder.id, 10), {
    amount: updatedOrder.assetAmountFrom,
    assetList: [transferTx.getTransferredAsset(2).createTransferInput().toJSON],
    order: updatedOrder
  });
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
    .createAssetTransferTransaction()
    .addInputs(relayedInputs)
    .addInputs(inputs)
    .addOutputs(
      {
        recipient: relayedAddress,
        amount: relayedOrder.assetAmountTo,
        assetType: matchedOrder.takerAsset
      },
      {
        recipient: makerAddress,
        amount: relayedOrder.assetAmountFrom,
        assetType: matchedOrder.makerAsset
      }
    );

  // Add remain asset
  let relayedAmount: number;
  for (const input of relayedInputs) {
    relayedAmount += input.prevOut.amount.value.toNumber();
  }
  const relayedRemainedAsset =
    relayedAmount - relayedOrder.assetAmountFrom.value.toNumber();
  if (relayedRemainedAsset > 0) {
    transferTx.addOutputs({
      recipient: relayedAddress,
      amount: relayedRemainedAsset,
      assetType: matchedOrder.makerAsset
    });
  }
  let amount: number;
  for (const input of inputs) {
    amount += input.prevOut.amount.value.toNumber();
  }
  const remainedAsset = amount - relayedOrder.assetAmountTo.value.toNumber();
  if (remainedAsset > 0) {
    transferTx.addOutputs({
      recipient: makerAddress,
      amount: remainedAsset,
      assetType: matchedOrder.takerAsset
    });
  }

  // Add order
  transferTx
    .addOrder({
      order: relayedOrder,
      spentAmount: order.assetAmountTo,
      inputIndices: Array.from(Array(relayedInputs.length).keys()),
      outputIndices: []
    })
    .addOrder({
      order,
      spentAmount: order.assetAmountFrom,
      inputIndices: Array.from(
        Array(relayedInputs.length + inputs.length).keys()
      ).slice(relayedInputs.length),
      outputIndices: [3]
    });

  // FIXME - Add fee payment Output
  const fillParcel = sdk.core.createAssetTransactionParcel({
    transaction: transferTx
  });
  await sdk.rpc.chain.sendParcel(fillParcel, {
    account: Config["dex-platform-address"],
    passphrase: Config["dex-passphrase"]
  });

  await destroy(parseInt(matchedOrder.id, 10));

  const updatedOrder = order.consume(relayedOrder.assetAmountTo);

  return {
    inputs: transferTx.getTransferredAsset(3).createTransferInput(),
    order: updatedOrder
  };
}
