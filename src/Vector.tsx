type Vector = [number, number];

export const vsub = (
  a: [number, number],
  b: [number, number]
): [number, number] => [a[0] - b[0], a[1] - b[1]];

export const vadd = (
  a: [number, number],
  b: [number, number]
): [number, number] => [a[0] + b[0], a[1] + b[1]];

export const vdiv = (a: [number, number], f: number): [number, number] => [
  a[0] / f,
  a[1] / f,
];

export const vfloor = (a: [number, number]): [number, number] => [
  Math.floor(a[0]),
  Math.floor(a[1]),
];
