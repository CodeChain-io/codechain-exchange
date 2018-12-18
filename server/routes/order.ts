import * as express from "express";
import { controllers } from "../controllers";
import { AssetTransferTransaction } from "codechain-sdk/lib/core/classes";

export default function orderRoute(app: express.Express) {
  app.get("/api", (_req, res) =>
    res.status(200).send({
      message: "Welcome to the DEX API!"
    })
  );

  app.post("/api/order/create", async (req, res) => {
    controllers.orderController
      .create(
        req.body.makerAsset,
        req.body.takerAsset,
        req.body.amount,
        req.body.filled,
        req.body.rate,
        req.body.makerAddress,
        req.body.transaction,
        req.body.marketId
      )
      .then(order => res.status(201).send(order))
      .catch(err => res.status(400).send(err));
  });

  app.get("/api/order/find", (req, res) => {
    controllers.orderController
      .find(
        req.body.makerAsset,
        req.body.takerAsset,
        req.body.amount,
        req.body.filled,
        req.body.rate,
        req.body.makerAddress,
        req.body.transaction,
        req.body.marketId
      )
      .then(orders => res.status(201).send(orders))
      .catch(err => res.status(400).send(err));
  });

  app.get("/api/orderbook", (req, res) => {
    if (req.body.range === undefined || req.body.marketPrice === undefined) {
      res.status(400).send("range | marketPrice is undefined");
      return;
    }
    controllers.orderController
      .orderbook(req.body.range, req.body.marketPrice)
      .then(orders => res.status(201).send(orders))
      .catch(err => res.status(400).send(err.message));
  });

  app.delete("/api/order/delete/:orderId", (req, res) => {
    controllers.orderController
      .destroy(req.params.orderId)
      .then(() => {
        return res.status(400).send({ message: "Order Deleted Successfully" });
      })
      .catch(err => {
        res.status(400).send(err);
      });
  });

  app.put("/api/order/update/:orderId", (req, res) => {
    controllers.orderController
      .update(req.params.orderId, req.body)
      .then(updatedOrder => {
        res.status(200).send(updatedOrder);
      })
      .catch(err => res.status(400).send(err));
  });

  app.post("/api/order/submit", (req, res) => {
    controllers.orderController
      .submit(
        AssetTransferTransaction.fromJSON(req.body.order),
        req.body.marketId,
        req.body.makerAddress
      )
      .then(_ => {
        res.status(201).send({ message: "success" });
      })
      .catch(err => res.status(400).send(err.message));
  });
}
