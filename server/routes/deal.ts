import { AssetTransferTransaction } from "codechain-sdk/lib/core/classes";
import * as express from "express";
import { controllers } from "../controllers";

export default function dealRoute(app: express.Express) {
  app.get("/api/deal/find", (req, res) => {
    controllers.dealController
      .find(
        req.body.maker,
        req.body.taker,
        req.body.makerAsset,
        req.body.takerAsset,
        req.body.makerAmount,
        req.body.takerAmount
      )
      .then(deals => res.status(201).send(deals))
      .catch(err => res.status(400).send(err));
  });

  app.post("/api/deal/submit", (req, res) => {
    controllers.dealController
      .submit(
        AssetTransferTransaction.fromJSON(req.body.order),
        req.body.marketId,
        req.body.makerAddress
      )
      .then(_ => res.status(201).send({ message: "success" }))
      .catch(err => res.status(400).send(err.message));
  });
}
