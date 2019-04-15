import {
  AssetTransferInput,
  Order,
  SignedTransaction
} from "codechain-sdk/lib/core/classes";
import { AssetTransferInputJSON } from "codechain-sdk/lib/core/transaction/AssetTransferInput";
import { fromJSONToSignedTransaction } from "codechain-sdk/lib/core/transaction/json";
import * as express from "express";
import { controllers } from "../controllers";
import { engine } from "../engine";

export default function orderRoute(app: express.Express) {
  app.get("/api/order", (req, res) => {
    controllers.orderController
      .find(
        req.query.makerAsset,
        req.query.takerAsset,
        req.query.amount,
        req.query.rate,
        req.query.makerAddress,
        null,
        null,
        null,
        req.query.marketId
      )
      .then(orders => res.status(201).send(orders))
      .catch(err => res.status(400).send(err));
  });

  app.post("/api/order", (req, res) => {
    try {
      let assetList: AssetTransferInput[];
      let order: Order;
      let makerAddress: string;
      let splitTx: SignedTransaction;
      try {
        assetList = (req.body.assetList as AssetTransferInputJSON[]).map(
          input => AssetTransferInput.fromJSON(input)
        );
        order = Order.fromJSON(req.body.order);
        makerAddress = req.body.makerAddress;
        splitTx = req.body.splitTx
          ? fromJSONToSignedTransaction(req.body.splitTx)
          : null;
      } catch (error) {
        throw Error("Fail to parse arguments");
      }

      engine.matching
        .submit(assetList, order, makerAddress, splitTx)
        .then((_: any) => {
          res.status(201).send({ message: "success" });
        });
    } catch (error) {
      res.status(400).send(error.message);
    }
  });
}
