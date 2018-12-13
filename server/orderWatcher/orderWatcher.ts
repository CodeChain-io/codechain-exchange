import { H256 } from "codechain-primitives/lib";
import {Minheap} from "./minheap";
const EventEmitter = require('events');

class MyEmitter extends EventEmitter {}

const myEmitter = new MyEmitter();

export class OrderWatcher {
  private validityCheckList: [number, [H256, number][]];
  private expirationCheckList: Minheap;

  constructor(): any{
    this.validityCheckList = [];
    this.expirationCheckList = new Minheap();

    myEmitter.on('expire',() => {})
    myEmitter.on('invalid',() => {})
  }

  public function addOrderForValidity():void {}
  public function addOrderForExpiration(): void {}
}
