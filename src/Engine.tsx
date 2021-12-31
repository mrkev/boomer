import { serialize } from "./Document";
import { degVectorFromAToB, Rect, rectCenter, rectOverlap } from "./Rect";

export class Tiles {
  readonly url: string;
  readonly img: HTMLImageElement;
  readonly spriteSize: number;
  readonly length: number;

  constructor(url: string, img: HTMLImageElement, spriteSize: number) {
    this.url = url;
    this.img = img;
    this.spriteSize = spriteSize;
    this.length = (img.width / spriteSize) * (img.height / spriteSize);
  }

  static async from({
    url,
    spriteSize,
  }: {
    url: string;
    spriteSize: number;
  }): Promise<Tiles> {
    return new Promise((res) => {
      const img = document.createElement("img");
      img.onload = function () {
        res(new Tiles(url, img, spriteSize));
      };
      // triggers onload event (after it loads of course)
      // img.src = "//via.placeholder.com/350x150";
      img.src = url;
    });
  }

  __getSerialRepresentation() {
    return {
      url: this.url,
      spriteSize: this.spriteSize,
    };
  }

  drawSprite(
    num: number,
    [x, y]: [number, number],
    ctx: CanvasRenderingContext2D
  ) {
    // const cols = this.img.width / this.spriteSize;
    const srcX = (num * this.spriteSize) % this.img.width;
    // const rows = this.img.height / this.spriteSize;
    const srcY =
      Math.floor((num * this.spriteSize) / this.img.width) * this.spriteSize;

    ctx.drawImage(
      this.img,
      srcX,
      srcY,
      this.spriteSize,
      this.spriteSize,
      x,
      y,
      this.spriteSize,
      this.spriteSize
    );
  }

  async genSprite(num: number) {
    // const cols = this.img.width / this.spriteSize;
    const srcX = (num * this.spriteSize) % this.img.width;
    // const rows = this.img.height / this.spriteSize;
    const srcY =
      Math.floor((num * this.spriteSize) / this.img.width) * this.spriteSize;

    const image = await createImageBitmap(
      this.img,
      srcX,
      srcY,
      this.spriteSize,
      this.spriteSize
    );

    const url = this.url + "@" + num;

    return new Sprite(image, url);
  }
}

// TODO: rename __getSerialRepresentation() to __getSerializableRepresentation

export abstract class EngineObject {
  x: number = 0;
  y: number = 0;
  width: number = 0;
  height: number = 0;
  abstract paintToContext(ctx: CanvasRenderingContext2D): void;

  getRect(): Rect {
    return [this.x, this.y, this.width, this.height];
  }

  // For scripting
  id: null | string = null;
  _proxyForScripting = new EOProxyForScripting(this);
  _script: string = "this.onClick(() => { this.x = 0; });";

  __getEOSerializableRepresentation(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const key in this) {
      console.log("key", key, this[key]);
      if (
        typeof this[key] === "string" ||
        typeof this[key] === "number" ||
        typeof this[key] === "boolean"
      )
        result[key] = this[key];
    }

    console.log("result", result);
    return result;
  }

  // __getSerialRepresentation() {
  //   const result: Record<string, unknown> = {};
  //   for (const key in this) {
  //     // by default don't serialize properties that start with "_"
  //     if (key[0] === "_") {
  //       continue;
  //     }

  //     const val: any = this[key];

  //     if (
  //       typeof val === "object" &&
  //       typeof val.__getSerialRepresentation === "function"
  //     ) {
  //       result[key] = val.__getSerialRepresentation();
  //     } else {
  //       result[key] = val;
  //     }
  //   }

  //   return result;
  // }
}

type ScriptingKeyEvent = { key: string };

/**
 * Proxy scripting so we decide what's scriptable, so the scripting api remains
 * different from the internal api, and so user-generated references
 * (say, event listeners) are separate from internal ones.
 */
export class EOProxyForScripting {
  #eo: EngineObject;
  #clickHandlers: Array<() => void> = [];
  #frameHandlers: Array<() => void> = [];
  #keypressHandlers: Array<(evt: ScriptingKeyEvent) => void> = [];

  constructor(eo: EngineObject) {
    this.#eo = eo;
  }

  onClick(cb: () => void) {
    this.#clickHandlers.push(cb);
  }

  onFrame(cb: () => void) {
    this.#frameHandlers.push(cb);
  }

  onKeypress(cb: () => void) {
    this.#keypressHandlers.push(cb);
  }

  triggerClick() {
    for (const handler of this.#clickHandlers) {
      handler.call(this);
    }
  }

  triggerFrame() {
    for (const handler of this.#frameHandlers) {
      handler.call(this);
    }
  }

  triggerKeypress(evt: ScriptingKeyEvent) {
    for (const handler of this.#keypressHandlers) {
      handler.call(this, evt);
    }
  }

  getRect() {
    return this.#eo.getRect();
  }

  isColliding(b: EOProxyForScripting): boolean {
    const ar = this.getRect();
    const br = b.getRect();
    return rectOverlap(ar, br);
  }

  angleToObject(b: EOProxyForScripting): number {
    const ar = this.getRect();
    const br = b.getRect();
    const ac = rectCenter(ar);
    const bc = rectCenter(br);

    const [_, angle] = degVectorFromAToB(ac, bc);
    return angle;
  }
  // Instead calculating this from the angles between centers, I want to find the
  // closest edge, I think, or build the collision direction into the collision
  // function maybe?
  cardinalDirectionToObject(b: EOProxyForScripting): "N" | "S" | "E" | "W" {
    const angle = this.angleToObject(b);
    switch (true) {
      case Math.abs(angle) < 45:
        return "E";
      case Math.abs(angle) > 135:
        return "W";
      case angle < 0:
        return "N";
      default:
        return "S";
    }
  }

  get x() {
    return this.#eo.x;
  }
  set x(n: number) {
    this.#eo.x = n;
  }

  get y() {
    return this.#eo.y;
  }
  set y(n: number) {
    this.#eo.y = n;
  }

  get width() {
    return this.#eo.width;
  }
  set width(n: number) {
    this.#eo.width = n;
  }

  get height() {
    return this.#eo.height;
  }
  set height(n: number) {
    this.#eo.height = n;
  }

  get id() {
    return this.#eo.id;
  }
  set id(n: string | null) {
    this.#eo.id = n;
  }

  // These will show up in the editor
  static {
    const keys: Array<keyof EOProxyForScripting> = ["x", "id", "y"];
    for (const key of keys) {
      Object.defineProperty(EOProxyForScripting.prototype, key, {
        enumerable: true,
      });
    }
  }
}

export class Box extends EngineObject {
  override x: number = 0;
  override y: number = 0;
  override width: number;
  override height: number;
  color: string;

  constructor({
    x = 0,
    y = 0,
    width,
    height,
    color = "green",
  }: {
    x?: number;
    y?: number;
    width: number;
    height: number;
    color?: string;
  }) {
    super();
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
  }

  paintToContext(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

export class Sprite extends EngineObject {
  override x: number = 0;
  override y: number = 0;
  override width: number;
  override height: number;
  private image: ImageBitmap;
  private imageUrl: string;

  constructor(image: ImageBitmap, imageUrl: string) {
    super();
    this.image = image;
    this.width = image.width;
    this.height = image.height;
    this.imageUrl = imageUrl;
  }

  paintToContext(ctx: CanvasRenderingContext2D) {
    // pixel-perfect
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    // const { x, y } = this;
    ctx.drawImage(this.image, x, y);
  }

  __getSerialRepresentation() {
    const result = this.__getEOSerializableRepresentation();
    const { imageUrl } = this;
    result.imageUrl = imageUrl;

    return result;
  }

  toClipboardData(): ClipboardItem {
    const str = serialize(this);
    const bytes = new TextEncoder().encode(str);
    const type = "text/plain";
    const blob = new Blob([bytes], { type });
    return new ClipboardItem({ [type]: blob });
  }
}

export class EngineState {
  readonly objects: Set<EngineObject> = new Set();
  private _debug_spriteBoxes = false;
  _globalScript = "";

  addSprite(eo: EngineObject) {
    this.objects.add(eo);
  }

  removeSprite(eo: EngineObject) {
    this.objects.delete(eo);
  }

  render(
    ctx: CanvasRenderingContext2D,
    renderWidth: number,
    renderHeight: number
  ) {
    ctx.clearRect(0, 0, renderWidth, renderHeight);
    this.objects.forEach((art) => {
      if (this._debug_spriteBoxes && art instanceof Sprite) {
        ctx.fillStyle = "red";
        ctx.fillRect(art.x, art.y, art.width, art.height);
      }
      art.paintToContext(ctx);
    });
  }

  __getSerialRepresentation() {
    return {
      objects: [...this.objects],
    };
  }
}
