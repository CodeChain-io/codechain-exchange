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
