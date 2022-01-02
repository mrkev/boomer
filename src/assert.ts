export function assert(val: boolean, msg?: string) {
  if (!val) {
    throw new Error(msg || "Failed assertion");
  }
}
