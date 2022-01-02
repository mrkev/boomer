import { assert } from "./assert";

export class OrderedSet<T> extends Set<T> {
  #order: Array<T> = [];

  constructor(values?: readonly T[] | null) {
    super();
    if (values != null) {
      for (const value of values) {
        this.add(value);
        this.#order.push(value);
      }
    }
  }

  override add(value: T): this {
    super.add.call(this, value);
    // console.log("")
    this.#order.push(value);
    return this;
  }

  override clear(): void {
    super.clear();
    // we keep the current array, just in case
    this.#order.splice(0, this.#order.length);
  }

  override delete(value: T): boolean {
    const result = super.delete(value);
    if (result) {
      const index = this.#order.indexOf(value);
      assert(
        index > -1,
        "Invariant violation: element in set but not in order"
      );
      this.#order.splice(index, 1);
    }
    return result;
  }

  override entries(): IterableIterator<[T, T]> {
    let index = -1;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return {
      next: (): IteratorResult<[T, T], [T, T]> => {
        const val = this.#order[++index];
        return {
          value: [val, val],
          done: !(index in this.#order),
        };
      },
      [Symbol.iterator](): IterableIterator<[T, T]> {
        return self.entries();
      },
    };
  }

  override forEach(
    callbackfn: (value: T, value2: T, set: Set<T>) => void,
    thisArg?: any
  ): void {
    this.#order.forEach((value) => callbackfn(value, value, this), thisArg);
  }

  override has(value: T): boolean {
    return super.has(value);
  }

  override values(): IterableIterator<T> {
    return this[Symbol.iterator]();
  }

  override keys(): IterableIterator<T> {
    return this[Symbol.iterator]();
  }

  override [Symbol.iterator](): IterableIterator<T> {
    let index = -1;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return {
      next: (): IteratorResult<T, T> => {
        return {
          value: this.#order[++index],
          done: !(index in this.#order),
        };
      },
      [Symbol.iterator](): IterableIterator<T> {
        return self[Symbol.iterator]();
      },
    };
  }

  // OrderedSet methods
  moveToIndex(pos: number, value: T): boolean {
    const has = this.has(value);
    if (has) {
      const index = this.#order.indexOf(value);
      assert(
        index > -1,
        "Invariant violation: element in set but not in order"
      );
      this.#order.splice(index, 1);
      this.#order.splice(pos, 0, value);
    }
    return has;
  }
}

export default OrderedSet;

const test = true;
if (test) {
  const set = new OrderedSet<number>();
  const set2 = new OrderedSet<number>([4, 5, 3]);

  set.add(1);
  assert(set.size === 1);
  assert(set2.size === 3);
  set2.delete(3);
  assert(set2.size === 2);
  set2.clear();
  assert(set2.size === 0);

  set.add(2);
  let n = 0;
  for (const item of set) {
    n += item;
  }
  assert(n === 3);
  console.log("ORDERED SET: ALL TESTES PASSED");
  console.log(set, set2);
}
