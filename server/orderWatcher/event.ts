const EventEmitter = require("events");

class MyEmitter extends EventEmitter {}

export const myEmitter = new MyEmitter();
