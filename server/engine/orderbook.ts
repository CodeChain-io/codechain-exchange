import { Op } from "sequelize";
import db from "../models";
import { OrderInstance } from "../models/order";

// Get orders in given range
export async function orderbook(range: number): Promise<OrderInstance[]> {
  let upOrders: OrderInstance[] = [];
  let downOrders: OrderInstance[] = [];
  let pivot: number = 0;

  const wholeOrders: OrderInstance[] = await db.Order.all();
  wholeOrders.sort((a, b) => {
    const x = a.get().rate;
    const y = b.get().rate;
    return x < y ? -1 : x > y ? 1 : 0;
  });

  // Get a market price
  let marketPrice: number = 0;
  if (wholeOrders.length !== 0) {
    const asset1 = wholeOrders[0].get().makerAsset;
    for (const order of wholeOrders) {
      if (order.get().makerAsset !== asset1) {
        marketPrice = order.get().rate;
        break;
      }
    }
  }
  for (let i = 0; i < range; i++) {
    await db.Order.min("rate", {
      where: {
        // Now, an upper bound is set market price
        rate: { [Op.and]: [{ [Op.gte]: marketPrice }, { [Op.gte]: pivot }] }
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
