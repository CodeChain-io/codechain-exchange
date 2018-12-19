import { H256 } from "codechain-primitives/lib";
import { SDK } from "codechain-sdk";
// import * as Config from "../config/dex.json";
import * as OrderControlller from "../controllers/order";
import { Minheap } from "./minheap";
const EventEmitter = require("events");

class MyEmitter extends EventEmitter {}

const myEmitter = new MyEmitter();

export class OrderWatcher {
  private validityCheckList: [number, [H256, number][]][];
  private expirationCheckList: Minheap;
  private validityListener: any;
  private expirationListenr: any;

  constructor() {
    this.validityCheckList = [];
    this.expirationCheckList = new Minheap();

    myEmitter.on("expire", async (id: number) => {
      console.log("expire");
      await OrderControlller.destroy(id);
    });

    myEmitter.on("invalid", async (id: number) => {
      console.log("invalid");
      await OrderControlller.destroy(id);
    });
  }

  public async run(): Promise<void> {
    this.validityListener = setInterval(
      await this.checkValidity.bind(this),
      5000
    );
    this.expirationListenr = setInterval(
      await this.checkExpiration.bind(this),
      1000
    );
  }

  public stop(): void {
    clearInterval(this.validityListener);
    clearInterval(this.expirationListenr);
  }

  public async checkValidity(): Promise<void> {
    const sdk = new SDK({ server: "http://127.0.0.1:8080" });
    for (let i = 0; i < this.validityCheckList.length; i++) {
      const order = this.validityCheckList[i];
      for (const [txHash, index] of order[1]) {
        const utxo = await sdk.rpc.chain.getAsset(txHash, index);
        if (utxo === undefined || utxo === null) {
          myEmitter.emit("invalid", order[0]);
          this.validityCheckList.splice(i, 1);
          break;
        }
      }
    }
    return;
  }

  public checkExpiration(): void {
    const min = this.expirationCheckList.min;
    if (min === null) {
      return;
    }

    if (min[1] - Math.round(Date.now() / 1000) <= 0) {
      this.expirationCheckList.extractMin();
      myEmitter.emit("expire", min[0]);
    }

    return;
  }

  public addOrderForValidity(order: [number, [H256, number][]]): void {
    this.validityCheckList.push(order);
  }

  public addOrderForExpiration(order: [number, number]): void {
    this.expirationCheckList.insert(order);
  }
}
