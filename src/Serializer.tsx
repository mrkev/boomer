export class Serializer<T extends Record<string, unknown>> {
  #deserialize: (str: string) => T;
  constructor(cb: (str: string) => T) {
    this.#deserialize = cb;
  }
  deserialize(str: string): T {
    return this.#deserialize(str);
  }
  serialize(obj: T): string {
    let str = "{";
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      str += `"${key}":`;
      str += (() => {
        switch (true) {
          case typeof val === "number":
          case typeof val === "boolean":
          case typeof val === "string":
            return JSON.stringify(val);
          case Array.isArray(val):
          case val instanceof Object:
            break;
        }
      })();
    }
    return "";
  }
}
class Dog {
  x: number = 0;
  y: number = 0;
  static serializer: Serializer<Dog> = new Serializer<Dog>(() => {});
}
