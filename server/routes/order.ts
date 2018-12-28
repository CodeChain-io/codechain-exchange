import { AssetTransferInput, Order } from "codechain-sdk/lib/core/classes";
import { AssetTransferInputJSON } from "codechain-sdk/lib/core/transaction/AssetTransferInput";
import * as express from "express";
import { controllers } from "../controllers";

export default function orderRoute(app: express.Express) {
  app.get("/api/order/find", (req, res) => {
    controllers.orderController
      .find(
        req.query.makerAsset,
        req.query.takerAsset,
        req.query.amount,
        req.query.rate,
        req.query.makerAddress,
        null,
        null,
        req.query.marketId
      )
      .then(orders => res.status(201).send(orders))
      .catch(err => res.status(400).send(err));
  });

  app.get("/api/orderbook", (req, res) => {
    if (req.query.range === undefined) {
      res.status(400).send("ranage is undefined");
      return;
    }
    controllers.orderController
      .orderbook(req.query.range)
      .then(orders => res.status(201).send(orders))
      .catch(err => res.status(400).send(err.message));
  });

  app.post("/api/order/submit", (req, res) => {
    controllers.orderController
      .submit(
        (req.body.assetList as AssetTransferInputJSON[]).map(input =>
          AssetTransferInput.fromJSON(input)
        ),
        Order.fromJSON(req.body.order),
        req.body.marketId,
        req.body.makerAddress
      )
      .then(_ => {
        res.status(201).send({ message: "success" });
      })
      .catch(err => res.status(400).send(err.message));
  });

  app.post("/api/order/userorder", (req, res) => {
    console.log(req.body.addresses);
    controllers.orderController
      .getUserOrder(req.body.addresses)
      .then(orders => {
        res.status(201).send(orders);
      })
      .catch(err => res.status(400).send(err.message));
  });
}
