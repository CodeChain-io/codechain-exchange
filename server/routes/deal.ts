import * as express from "express";
import { controllers } from "../controllers";
import { engine } from "../engine";

export default function dealRoute(app: express.Express) {
  app.get("/api/deal/find", (req, res) => {
    controllers.dealController
      .find(
        req.query.maker,
        req.query.taker,
        req.query.makerAsset,
        req.query.takerAsset,
        req.query.makerAmount,
        req.query.takerAmount
      )
      .then(deals => res.status(201).send(deals))
      .catch(err => res.status(400).send(err));
  });

  app.post("api/deal/userdeal", (req, res) => {
    engine.history
      .getUserDeal(req.body.addresses)
      .then(deals => {
        res.status(201).send(deals);
      })
      .catch(err => res.status(400).send(err.message));
  });
}
