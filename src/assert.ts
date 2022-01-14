export function assert(val: boolean, msg?: string) {
  if (!val) {
    throw new Error(msg || "Failed assertion");
  }
}

export function nullthrows<T>(value: T | undefined | null, msg?: string): T {
  if (value == null) {
    throw new Error(msg || "nullthrows");
  }
  return value;
}
