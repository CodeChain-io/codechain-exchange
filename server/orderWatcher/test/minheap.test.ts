import { Minheap } from "./minheap";

import * as chai from "chai";

const expect = chai.expect;

describe("minheap basic test", () => {
  it("Extract min value", () => {
    const minheap = new Minheap();
    for (let i = 0; i < 100; i++) {
      minheap.insert([i, i]);
    }
    const [, expiration] = minheap.extractMin();
    expect(expiration).to.equal(0);
  });

  it("Extract tenth min value", () => {
    const minheap = new Minheap();
    for (let i = 0; i < 100; i++) {
      minheap.insert([i, i]);
    }
    minheap.extractMin();
    minheap.extractMin();
    minheap.extractMin();
    minheap.extractMin();
    minheap.extractMin();
    minheap.extractMin();
    minheap.extractMin();
    minheap.extractMin();
    minheap.extractMin();
    const [, expiration] = minheap.extractMin();
    expect(expiration).to.equal(9);
  });

  it("Extract fifth min value", () => {
    const minheap = new Minheap();

    minheap.insert([0, 0]);
    minheap.insert([6, 6]);
    minheap.insert([1, 1]);
    minheap.insert([5, 5]);
    minheap.insert([2, 2]);
    minheap.insert([4, 4]);
    minheap.insert([3, 3]);
    const [, expiration] = minheap.extractMin();
    expect(expiration).to.equal(0);
  });
});
