import { controllers } from "../controllers";
import * as express from "express";

export default function route(app: express.Express) {
  app.get("/api", (_req, res) =>
    res.status(200).send({
      message: "Welcome to the Todos API!"
    })
  );

  app.post("/api/order", async (req, res) => {
    controllers.orderController
      .create(
        req.body.makerAsset,
        req.body.takerAsset,
        req.body.amount,
        req.body.filled,
        req.body.rate,
        req.body.makerAddress,
        req.body.signature,
        req.body.transaction,
        req.body.marketId
      )
      .then(order => res.status(201).send(order))
      .catch(err => res.status(400).send(err));
  });

  app.get("/api/order", (req, res) => {
    controllers.orderController
      .find(
        req.body.makerAsset,
        req.body.takerAsset,
        req.body.amount,
        req.body.filled,
        req.body.rate,
        req.body.makerAddress,
        req.body.signature,
        req.body.transaction,
        req.body.marketId
      )
      .then(orders => res.status(201).send(orders))
      .catch(err => res.status(400).send(err));
  });

  app.get("/api/orderbook", (req, res) => {
    controllers.orderController
      .orderbook(req.body.range, req.body.marketPrice)
      .then(orders => res.status(201).send(orders))
      .catch(err => res.status(400).send(err));
  });

  app.delete("/api/order/:orderId", (req, res) => {
    controllers.orderController
      .destroy(req.params.orderId)
      .then(() => {
        return res.status(400).send({ message: "Order Deleted Successfully" });
      })
      .catch(err => {
        res.status(400).send(err);
      });
  });

  app.put("/api/order/:orderId", (req, res) => {
    controllers.orderController
      .update(req.params.orderId, req.body)
      .then(updatedOrder => {
        res.status(200).send(updatedOrder);
      })
      .catch(err => res.status(400).send(err));
  });
}
