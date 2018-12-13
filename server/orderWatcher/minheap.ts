export class Minheap {
  public elements: [number, number][];
  private capacity: number;

  constructor(capacity?: number) {
    this.capacity = capacity || Number.MAX_VALUE;
    this.elements = [];
  }

  public insert(order: [number, number]): boolean {
    if (this.elements.length === this.capacity) {
      return false;
    }

    let index = this.elements.length;
    this.elements.push(order);

    while (index !== 0) {
      if (this.elements[this.parent(index)][1] <= this.elements[index][1]) {
        break;
      }
      const tmp = this.elements[this.parent(index)];
      this.elements[this.parent(index)] = this.elements[index];
      this.elements[index] = tmp;

      index = this.parent(index);
    }
  }

  public extractMin(): [number, number] | null {
    if (this.elements.length === 0) {
      return null;
    }
    if (this.elements.length === 1) {
      return this.elements.pop();
    }

    const root = this.elements[0];
    this.elements[0] = this.elements[this.elements.length - 1];
    this.elements.pop();
    this.minHeapify(0);

    return root;
  }

  get min(): [number, number] | null {
    if (this.elements.length === 0) {
      return null;
    }
    return this.elements[0];
  }

  private minHeapify(index: number): void {
    const l = this.left(index);
    const r = this.right(index);
    let smallest = index;
    if (
      l < this.elements.length &&
      this.elements[l][1] < this.elements[index][1]
    ) {
      smallest = l;
    }
    if (
      r < this.elements.length &&
      this.elements[r][1] < this.elements[smallest][1]
    ) {
      smallest = r;
    }
    if (smallest !== index) {
      const tmp = this.elements[index];
      this.elements[index] = this.elements[smallest];
      this.elements[smallest] = tmp;
      this.minHeapify(smallest);
    }
  }

  private parent(index: number): number {
    return Math.floor((index - 1) / 2);
  }

  private left(index: number): number {
    return Math.floor(index * 2 + 1);
  }

  private right(index: number): number {
    return Math.floor(index * 2 + 2);
  }
}
