import { Op } from "sequelize";
import db from "../models";
import { OrderInstance } from "../models/order";

export async function create(
  makerAsset: string,
  takerAsset: string,
  amount: number,
  filled: number,
  rate: number,
  makerAddress: string,
  signature: string,
  transaction: string,
  marketId: number
): Promise<OrderInstance> {
  return db.Order.create({
    makerAsset,
    takerAsset,
    amount,
    filled,
    rate,
    makerAddress,
    signature,
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
  signature?: string,
  transaction?: string,
  marketId?: number
): Promise<OrderInstance[]> {
  const where = {
    makerAsset,
    takerAsset,
    amount,
    filled,
    rate,
    makerAddress,
    signature,
    transaction,
    marketId
  };
  for (const o in where) {
    if ((where as any)[o] === null || (where as any)[o] === undefined) {
      delete (where as any)[o];
    }
  }
  return db.Order.findAll({
    where
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
