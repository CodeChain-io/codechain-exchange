import db from "../models";
import { DealInstance } from "../models/deal";

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

export async function getUserDeal(
  assetAddresses: string[]
): Promise<DealInstance[]> {
  let deals: DealInstance[] = [];
  for (const address of assetAddresses) {
    const dealIns = await db.Deal.findAll({
      where: { makerAsset: address }
    });
    deals = deals.concat(dealIns);
  }
  return deals;
}
