import {
  AssetTransferInput,
  AssetTransferTransaction,
  H256,
  OrderOnTransfer,
  AssetOutPoint,
  Order
} from "codechain-sdk/lib/core/classes";
import * as Config from "../config/dex.json";
import db from "../models";
import { DealInstance } from "../models/deal";
import { U64 } from "codechain-primitives/lib";
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
    throw Error("Invalid transaction");
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
    assetTypeTo.toEncodeObject(),
    assetTypeFrom.toEncodeObject(),
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
  }

  // In case that there are matched orders
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
  if (origins !== utxo) {
    return false;
  }

  // FIXME - check pubkey hash is standard script
  // FIXME - register UTXO and expiration date to order watcher
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
    marketConfig.asset1 === assetTypeFrom.toEncodeObject() &&
    marketConfig.asset2 === assetTypeTo.toEncodeObject()
  ) {
    rate = assetAmountTo.value.dividedBy(assetAmountFrom.value).toNumber();
  }
  if (
    marketConfig.asset2 === assetTypeFrom.toEncodeObject() &&
    marketConfig.asset1 === assetTypeTo.toEncodeObject()
  ) {
    rate = assetAmountFrom.value.dividedBy(assetAmountTo.value).toNumber();
  } else {
    return null;
  }

  return rate;
}
