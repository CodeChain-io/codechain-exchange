import db from "../models";
import { OrderInstance } from "../models/order";

export async function create(
  makerAsset: string,
  takerAsset: string,
  amount: number,
  rate: number,
  makerAddress: string,
  assetList: JSON,
  order: JSON,
  splitTx: JSON,
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
    splitTx,
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
  splitTx?: JSON,
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
    splitTx,
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
