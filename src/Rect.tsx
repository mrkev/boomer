export type Rect = readonly [x: number, y: number, w: number, h: number];

export function minSpanningRect(rects: Rect[]): Rect | null {
  if (rects.length < 1) {
    return null;
  }

  let [mx0, my0, mx1, my1] = rects[0];
  for (const rect of rects) {
    const [x, y, w, h] = rect;
    mx0 = x < mx0 ? x : mx0;
    my0 = y < my0 ? y : my0;
    mx1 = x + w > mx1 ? x + w : mx1;
    my1 = y + h > my1 ? y + h : my1;
  }
  const spanningRect = [mx0, my0, mx1 - mx0, my1 - my0] as const;
  return spanningRect;
}

export function rectSubset(inner: Rect, outer: Rect): boolean {
  // normalize to just positive integers

  const [ix, iy, iw, ih] = normalize(inner);
  const [ox, oy, ow, oh] = normalize(outer);
  const xtest = ix > ox && ix + iw < ox + ow;
  const ytest = iy > oy && iy + ih < oy + oh;
  // console.log(
  //   "i",
  //   [ix, iy, iw, ih],
  //   xtest && ytest ? "inside" : "outside",
  //   "o",
  //   [ox, oy, ow, oh],
  //   xtest,
  //   ytest
  // );
  return ix > ox && ix + iw < ox + ow && iy > oy && iy + ih < oy + oh;
}

// normalizes a rect to have a positive width and height
function normalize(r: Rect): Rect {
  let [x, y, w, h] = r;
  if (w < 0) {
    [x, w] = [x + w, Math.abs(w)];
  }
  if (h < 0) {
    [y, h] = [y + h, Math.abs(h)];
  }
  return [x, y, w, h];
}
