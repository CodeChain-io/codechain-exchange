import {
  AssetTransferInput,
  Order,
  TransferAsset
} from "codechain-sdk/lib/core/classes";
import { AssetTransferInputJSON } from "codechain-sdk/lib/core/transaction/AssetTransferInput";
import * as express from "express";
import { controllers } from "../controllers";
import { engine } from "../engine";

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

  app.post("/api/order/submit", (req, res) => {
    engine.matching
      .submit(
        (req.body.assetList as AssetTransferInputJSON[]).map(input =>
          AssetTransferInput.fromJSON(input)
        ),
        Order.fromJSON(req.body.order),
        req.body.makerAddress,
        // FIX ME - parse TransferAsset
        req.body.splitTx as TransferAsset
      )
      .then((_: any) => {
        res.status(201).send({ message: "success" });
      })
      .catch((err: any) => res.status(400).send(err.message));
  });
}
