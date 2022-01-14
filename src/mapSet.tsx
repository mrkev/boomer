// Maps over a set
export function mapSet<T, U>(
  set: Set<T>,
  cb: (value: T, index: number) => U
): Array<U> {
  const result = [];
  let i = 0;
  for (const item of set) {
    result.push(cb(item, i++));
  }
  return result;
}
