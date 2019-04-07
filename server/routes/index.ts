import * as express from "express";
import dealRout from "./deal";
import orderRoute from "./order";

export default function route(app: express.Express) {
  app.get("/api", (_, res) => {
    res.status(200).send({
      message: "Welcome to the DEX API!"
    });
  });
  orderRoute(app);
  dealRout(app);
}
