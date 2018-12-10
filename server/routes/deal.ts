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
}
