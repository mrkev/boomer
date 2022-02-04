// TODO: FINISH
export class OrderedMap<K, V> extends Map<K, V> {
  readonly #order: Array<K> = [];

  constructor(entries?: readonly (readonly [K, V])[]) {
    super();
    if (entries != null) {
      for (const [key, value] of entries) {
        this.set(key, value);
        this.#order.push(key);
      }
    }
  }

  override set(key: K, value: V): this {
    if (!this.has(key)) {
      this.#order.push(key);
    }
    super.set(key, value);
    return this;
  }

  override clear(): void {
    super.clear();
    // we keep the current array, just in case
    this.#order.splice(0, this.#order.length);
  }

  // forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any): void;
  // get(key: K): V | undefined;
}
