import { U64 } from "codechain-primitives/lib";
import {
  AssetOutPoint,
  AssetTransferInput,
  AssetTransferTransaction,
  H256,
  OrderOnTransfer
} from "codechain-sdk/lib/core/classes";
import * as Config from "../config/dex.json";
import db from "../models";
import { DealInstance } from "../models/deal";
import { OrderInstance } from "../models/order.js";
import * as OrderController from "./order";

interface IndexSig {
  [key: string]: { id: number; asset1: string; asset2: string };
}

export async function find(
  maker?: string,
  taker?: string,
  makerAsset?: string,
  takerAsset?: string,
  makerAmount?: number,
  takerAmount?: number
): Promise<DealInstance[]> {
  const where = {
    maker,
    taker,
    makerAsset,
    takerAsset,
    makerAmount,
    takerAmount
  };
  for (const o in where) {
    if ((where as any)[o] === null || (where as any)[o] === undefined) {
      delete (where as any)[o];
    }
  }
  return db.Deal.findAll({
    where
  });
}

// FIXME - use codechain RPC
function executeScript(_tx: AssetTransferTransaction): boolean {
  console.log("Not implemented");
  return true;
}

export async function submit(
  transaction: AssetTransferTransaction,
  marketId: number,
  makerAddress: string
): Promise<void> {
  if (!checkTX(transaction)) {
    throw Error("Invalida transaction");
  }
  const order: OrderOnTransfer = transaction.orders[0];
  const assetTypeFrom: H256 = order.order.assetTypeFrom;
  const assetTypeTo: H256 = order.order.assetTypeTo;
  const assetAmountFrom: U64 = order.order.assetAmountFrom;
  const rate = getRate(transaction, marketId);

  if (rate === null) {
    throw Error("Invalid transaction");
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
  if (orders === []) {
    OrderController.create(
      assetTypeFrom.toEncodeObject(),
      assetTypeTo.toEncodeObject(),
      assetAmountFrom.value.toNumber(),
      0,
      rate,
      makerAddress,
      JSON.parse(JSON.stringify(transaction.toJSON())),
      marketId
    );
    return;
  }

  // In case that there are matched orders
  matchOrder(orders);
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
  // Check if the UTXO list got from above is the same with one in order
  const order: OrderOnTransfer = transaction.orders[0];
  if (order === undefined || order === null) {
    return false;
  }
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
        if (targetOrder.lockScriptHash.isEqualTo(orderValue.lockScriptHash)) {
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

function matchOrder(orders: OrderInstance[]): boolean {
  console.log(orders);
  return true;
}
