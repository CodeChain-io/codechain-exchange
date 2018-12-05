// This will be our application entry. We'll setup our server here.
import * as http from "http";
import app from "../app";

const port = parseInt(process.env.PORT, 10) || 8000;
app.set("port", port);

const server = http.createServer(app);
server.listen(port);
