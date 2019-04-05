import db from "../models";
import { DealInstance } from "../models/deal";

export async function create(
  maker: string,
  taker: string,
  makerAsset: string,
  takerAsset: string,
  makerAmount: number,
  takerAmount: number
): Promise<DealInstance> {
  return db.Deal.create({
    maker,
    taker,
    makerAsset,
    takerAsset,
    makerAmount,
    takerAmount
  });
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

export async function destroy(id: number): Promise<void> {
  const deal = await db.Deal.findById(id);
  if (!deal) {
    throw { message: "Deal Not Found" };
  }
  return deal.destroy();
}

export async function update(id: number, body: any): Promise<DealInstance> {
  const deal = await db.Deal.findById(id);
  if (!deal) {
    throw { message: "Deal Not Found" };
  }
  return deal.update(body, { fields: Object.keys(body) });
}
