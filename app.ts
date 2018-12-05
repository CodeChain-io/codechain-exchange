import * as express from "express";
import * as logger from "morgan";
import * as bodyParser from "body-parser";
import route from "./server/routes";

// Set up the express app
const app = express();

// Log requests to the console.
app.use(logger("dev"));

// Parse incoming requests data (https://github.com/expressjs/body-parser)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Setup a default catch-all route that sends back a welcome message in JSON format.
route(app);
app.get("*", (_req, res) =>
  res.status(200).send({
    message: "Welcome to the beginning of nothingness."
  })
);

export default app;
