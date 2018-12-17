import { U64 } from "codechain-primitives/lib";
import {
  AssetOutPoint,
  AssetTransferInput,
  AssetTransferTransaction,
  H256,
  OrderOnTransfer
} from "codechain-sdk/lib/core/classes";
import { Op } from "sequelize";
import * as Config from "../config/dex.json";
import db from "../models";
// import { DealInstance } from "../models/deal";
import { OrderInstance } from "../models/order";
import * as OrderController from "./order";

export async function create(
  makerAsset: string,
  takerAsset: string,
  amount: number,
  filled: number,
  rate: number,
  makerAddress: string,
  transaction: JSON,
  marketId: number
): Promise<OrderInstance> {
  return db.Order.create({
    makerAsset,
    takerAsset,
    amount,
    filled,
    rate,
    makerAddress,
    transaction,
    marketId
  });
}

export async function find(
  makerAsset?: string,
  takerAsset?: string,
  amount?: number,
  filled?: number,
  rate?: number,
  makerAddress?: string,
  transaction?: JSON,
  marketId?: number
): Promise<OrderInstance[]> {
  const where = {
    makerAsset,
    takerAsset,
    amount,
    filled,
    rate,
    makerAddress,
    transaction,
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
function executeScript(_tx: AssetTransferTransaction): boolean {
  console.log("Not implemented");
  return true;
}

interface IndexSig {
  [key: string]: { id: number; asset1: string; asset2: string };
}

export async function submit(
  transaction: AssetTransferTransaction,
  marketId: number,
  makerAddress: string
): Promise<void | number> {
  if (!checkTX(transaction)) {
    throw Error("Invalid transaction - 0");
  }
  const order: OrderOnTransfer = transaction.orders[0];
  const assetTypeFrom: H256 = order.order.assetTypeFrom;
  const assetTypeTo: H256 = order.order.assetTypeTo;
  const assetAmountFrom: U64 = order.order.assetAmountFrom;
  const rate = getRate(transaction, marketId);

  if (rate === null) {
    throw Error("Invalid transaction - 1");
  }

  const orders = await OrderController.find(
    assetTypeTo.toEncodeObject().slice(2),
    assetTypeFrom.toEncodeObject().slice(2),
    null,
    null,
    rate,
    null,
    null,
    marketId
  );

  // In case that there is no any matched orders
  if (orders.length === 0) {
    const ins = await OrderController.create(
      assetTypeFrom.toEncodeObject(),
      assetTypeTo.toEncodeObject(),
      assetAmountFrom.value.toNumber(),
      0,
      rate,
      makerAddress,
      JSON.parse(JSON.stringify(transaction.toJSON())),
      marketId
    );
    return ins.get("id");
  }
  return;
  // In case that there are matched orders
  matchOrder(transaction, orders);
}

function checkTX(transaction: AssetTransferTransaction): boolean {
  // Check if unlock scripts in input is valid
  if (!executeScript(transaction)) {
    throw { message: "tx is not valid" };
  }
  // Get UTXO list
  const inputs: AssetTransferInput[] = transaction.inputs;
  const utxo: AssetOutPoint[] = [];
  for (const input of inputs) {
    utxo.push(input.prevOut);
  }
  // Check if the only one order is included
  if (transaction.orders.length !== 1) {
    return false;
  }
  const order: OrderOnTransfer = transaction.orders[0];
  if (order === undefined || order === null) {
    return false;
  }

  // Check if the UTXO list got from above is the same with one in order
  const origins = order.order.originOutputs;
  if (origins.length === utxo.length) {
    for (const [i, orderValue] of origins.entries()) {
      const targetOrder = utxo[i];
      if (!targetOrder.transactionHash.isEqualTo(orderValue.transactionHash)) {
        return false;
      } else if (targetOrder.index !== orderValue.index) {
        return false;
      } else if (!targetOrder.assetType.isEqualTo(orderValue.assetType)) {
        return false;
      } else if (!targetOrder.amount.isEqualTo(orderValue.amount)) {
        return false;
      } else if (
        !(
          targetOrder.lockScriptHash === undefined &&
          orderValue.lockScriptHash === undefined
        )
      ) {
        if (!targetOrder.lockScriptHash.isEqualTo(orderValue.lockScriptHash)) {
          return false;
        }
      } else if (targetOrder.parameters !== orderValue.parameters) {
        return false;
      }
    }
  } else {
    return false;
  }

  // FIXME - check pubkey hash is standard script
  // FIXME - register UTXO and expiration date to order watcher
  // FIXME - check if a fee is properly paid
  return true;
}

function getRate(
  transaction: AssetTransferTransaction,
  marketId: number
): number | null {
  const order: OrderOnTransfer = transaction.orders[0];
  const assetTypeFrom: H256 = order.order.assetTypeFrom;
  const assetTypeTo: H256 = order.order.assetTypeTo;
  const assetAmountFrom: U64 = order.order.assetAmountFrom;
  const assetAmountTo: U64 = order.order.assetAmountTo;

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

function matchOrder(
  transaction: AssetTransferTransaction,
  orders: OrderInstance[]
): boolean {
  const order: OrderOnTransfer = transaction.orders[0];
  while (true) {
    const firstUtxo = orders.pop().get();
    // In case that matched order is fully filled
    if (firstUtxo.amount === order.order.assetAmountTo.value.toNumber()) {
      return true;
    }
    // In case that matched order is partially filled
    else if (firstUtxo.amount > order.order.assetAmountTo.value.toNumber()) {
      return true;
    }
    // In case that matched order is fully filled and there is a remain amount in a incoming order
    else {
      return true;
    }
  }
  return true;
}
