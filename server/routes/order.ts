import {
  AssetTransferInput,
  Order,
  Transaction
} from "codechain-sdk/lib/core/classes";
import { AssetTransferInputJSON } from "codechain-sdk/lib/core/transaction/AssetTransferInput";
import { fromJSONToTransaction } from "codechain-sdk/lib/core/transaction/json";
import * as express from "express";
import { controllers } from "../controllers";
import { engine } from "../engine";

/**
 * @swagger
 * definition:
 *   orders:
 *     properties:
 *       makerAsset:
 *         type: string
 *       takerAsset:
 *         type: string
 *       amount:
 *         type: integer
 *       rate:
 *          type: double
 *       makerAddress:
 *          type: string
 *       assetList:
 *          type: JSON
 *       order:
 *          type: JSON
 *       splitTx:
 *          type: JSON
 */
export default function orderRoute(app: express.Express) {
  /**
   * @swagger
   * /api/orders:
   *   get:
   *     tags:
   *       - orders
   *     description: Returns orders
   *     responses:
   *       201:
   *         description: An array of orders
   *         schema:
   *           $ref: '#/definitions/orders'
   */
  app.get("/api/orders", (req, res) => {
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

  /**
   * @swagger
   * /api/orders:
   *   post:
   *     tags:
   *       - orders
   *     description: Creates a new order
   *     parameters:
   *       - name: assetList
   *         description: list of assets
   *         in: body
   *         required: true
   *         schema:
   *           $ref: '#/definitions/orders'
   *     responses:
   *       201:
   *         description: Successfully created
   */
  app.post("/api/orders", (req, res) => {
    try {
      let assetList: AssetTransferInput[];
      let order: Order;
      let makerAddress: string;
      let splitTx: Transaction;
      try {
        assetList = (req.body.assetList as AssetTransferInputJSON[]).map(
          input => AssetTransferInput.fromJSON(input)
        );
        order = Order.fromJSON(req.body.order);
        makerAddress = req.body.makerAddress;
        splitTx = req.body.splitTx
          ? fromJSONToTransaction(req.body.splitTx)
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
