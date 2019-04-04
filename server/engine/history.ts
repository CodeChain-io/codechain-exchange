import db from "../models";
import { DealInstance } from "../models/deal";
import { OrderInstance } from "../models/Order";

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

export async function getUserOrder(
  assetAddresses: string[]
): Promise<OrderInstance[]> {
  let orders: OrderInstance[] = [];
  for (const address of assetAddresses) {
    const orderIns = await db.Order.findAll({
      where: { makerAddress: address }
    });
    orders = orders.concat(orderIns);
  }
  return orders;
}
