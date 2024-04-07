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
  const spanningRect: Rect = [mx0, my0, mx1 - mx0, my1 - my0];
  return spanningRect;
}

// is "inner" entirely inside "outer"
export function rectSubset(inner: Rect, outer: Rect): boolean {
  const [ix, iy, iw, ih] = normalize(inner);
  const [ox, oy, ow, oh] = normalize(outer);
  const xtest = ix > ox && ix + iw < ox + ow;
  const ytest = iy > oy && iy + ih < oy + oh;
  return xtest && ytest;
}

// do these two rects overlap?
export function rectOverlap(a: Rect, b: Rect): boolean {
  const [ax, ay, aw, ah] = normalize(a);
  const [bx, by, bw, bh] = normalize(b);
  const ax2 = ax + aw;
  const bx2 = bx + bw;
  const ay2 = ay + ah;
  const by2 = by + bh;
  const xtest = !(ax2 < bx || ax > bx2);
  const ytest = !(ay2 < by || ay > by2);
  return xtest && ytest;
}

// what's the center point of this rect?
export function rectCenter(a: Rect): [number, number] {
  const [ax, ay, aw, ah] = normalize(a);
  return [ax + aw / 2, ay + ah / 2];
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

// the x-axis is 0rad. What's the [angle, magnitue] from "a" to "b"?
export function radVectorFromAToB(a: [number, number], b: [number, number]) {
  const [ax, ay] = a;
  const [bx, by] = b;
  // invert y's length to account for the y coordinate being positive towards
  // the bottom of the screen
  let opp_ov_adj = -(by - ay) / (bx - ax);
  if (Number.isNaN(opp_ov_adj)) {
    // on perfect overlap, 0/0 is NaN
    // Make it 0 instead, so the angle is just 0;
    opp_ov_adj = 0;
  }

  const angleRad = Math.atan2(by - ay, bx - ax);
  const mag = Math.sqrt((by - ay) ** 2 + (bx - ax) ** 2);

  console.log("rad", angleRad.toFixed(2), "deg", radToDeg(angleRad).toFixed(2));
  return [mag, angleRad];
}

function radToDeg(rad: number): number {
  return rad * (180 / Math.PI);
}

// the x-axis is 0rad. What's the [angle, magnitue] from "a" to "b"?
export function degVectorFromAToB(a: [number, number], b: [number, number]) {
  const [mag, angleRad] = radVectorFromAToB(a, b);
  return [mag, radToDeg(angleRad)];
}
