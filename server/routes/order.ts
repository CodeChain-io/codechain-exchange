import { AssetTransferInput, Order } from "codechain-sdk/lib/core/classes";
import { AssetTransferInputJSON } from "codechain-sdk/lib/core/transaction/AssetTransferInput";
import * as express from "express";
import { controllers } from "../controllers";

export default function orderRoute(app: express.Express) {
  app.get("/api", (_req, res) =>
    res.status(200).send({
      message: "Welcome to the DEX API!"
    })
  );

  app.get("/api/order/find", (req, res) => {
    controllers.orderController
      .find(
        req.body.makerAsset,
        req.body.takerAsset,
        req.body.amount,
        req.body.rate,
        req.body.makerAddress,
        null,
        null,
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
}
