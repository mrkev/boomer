import { serialize } from "./Document";
import { degVectorFromAToB, Rect, rectCenter, rectOverlap } from "./Rect";
import { Body as MatterBody } from "matter-js";
import Matter from "matter-js";
import { shortUUID } from "./lib/uuid";
import { exhaustiveSwitch } from "./AppState";

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

    return new Sprite(image, url, 0, 0);
  }
}

// TODO: rename __getSerialRepresentation() to __getSerializableRepresentation

type PropType = "number" | "string" | "boolean";
class Prop {
  type: PropType;
  constructor(type: PropType) {
    this.type = type;
  }
}

type Paintable = Sprite | Box;
function paint(p: Paintable) {
  const cn = p.classname;
  switch (cn) {
    case "Box":
      console.log("A");
      break;

    case "Sprite":
      console.log("A");
      break;

    default:
      exhaustiveSwitch(cn);
  }

  const foo = p.constructor;
  switch (cn) {
    case "Box":
      console.log("A");
      break;

    case "Sprite":
      console.log("A");
      break;

    default:
      exhaustiveSwitch(cn);
  }
}

export abstract class EngineObject {
  abstract classname: string;
  _uuid: string;
  _physicsBox: MatterBody | null;
  id: null | string;
  x: number;
  y: number;
  width: number;
  height: number;

  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    id: null | string
  ) {
    this._uuid = shortUUID();
    this._physicsBox = null;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.id = id;
  }

  abstract paintToContext(ctx: CanvasRenderingContext2D): void;

  getRect(): Rect {
    return [this.x, this.y, this.width, this.height];
  }

  // For scripting
  _proxyForScripting = new EOProxyForScripting(this);
  _script: string = "this.onClick(() => { this.x = 0; });";

  __getEOSerializableRepresentation(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const key in this) {
      if (
        typeof this[key] === "string" ||
        typeof this[key] === "number" ||
        typeof this[key] === "boolean"
      )
        result[key] = this[key];
    }

    console.log("serial rep", result);
    return result;
  }
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
  #accessor: this;
  #reigsteredProps: Set<keyof EngineObject> = new Set();

  registerProp(key: keyof EngineObject) {
    this.#reigsteredProps.add(key);
  }

  constructor(eo: EngineObject) {
    this.#eo = eo;

    this.#accessor = new Proxy(this, {
      get: function (target, key) {
        if (target.#reigsteredProps.has(key as keyof EngineObject)) {
          return (target.#eo as any)[key];
        } else {
          return (target as any)[key];
        }
      },
    });
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
    if (this.#eo._physicsBox) {
      Matter.Body.setPosition(this.#eo._physicsBox, {
        x: n,
        y: this.#eo.y,
      });
    }
  }

  get y() {
    return this.#eo.y;
  }
  set y(n: number) {
    this.#eo.y = n;
    if (this.#eo._physicsBox) {
      Matter.Body.setPosition(this.#eo._physicsBox, {
        y: n,
        x: this.#eo.x,
      });
    }
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

export class Box extends EngineObject implements Serializable {
  readonly classname = "Box";
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
    super(x, y, width, height, null);
    this.color = color;
  }

  paintToContext(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  __getSerialRepresentation() {
    return this.__getEOSerializableRepresentation();
  }
}

export interface Serializable {
  __getSerialRepresentation(): Record<string, any>;
}

export class Text extends EngineObject implements Serializable {
  classname = "Text";
  text: string = "";
  color: string = "";

  constructor(x: number, y: number, text: string) {
    super(x, y, 0, 0, null);
    this.text = text;
  }

  paintToContext(ctx: CanvasRenderingContext2D): void {
    const dims = ctx.measureText(this.text);
    this.width = dims.width;
    this.height = dims.fontBoundingBoxAscent + dims.fontBoundingBoxDescent;
    ctx.fillText(this.text, this.x, this.y + this.height);
  }

  __getSerialRepresentation() {
    const result = this.__getEOSerializableRepresentation();
    const { text } = this;

    return Object.assign(result, { text });
  }
}

export class Sprite extends EngineObject {
  readonly classname = "Sprite";
  private image: ImageBitmap;
  private imageUrl: string;

  constructor(image: ImageBitmap, imageUrl: string, x: number, y: number) {
    super(x, y, image.width, image.height, null);
    this.image = image;
    this.imageUrl = imageUrl;
  }

  paintToContext(ctx: CanvasRenderingContext2D) {
    // pixel-perfect
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    // const { x, y } = this;0
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

export class Camera extends EngineObject implements Serializable {
  classname = "Camera";
  constructor(x: number, y: number, w: number, h: number) {
    super(x, y, w, h, null);
  }

  paintToContext(_ctx: CanvasRenderingContext2D): void {
    // noop, though maybe change outline painting here if I
    // can make it not paint on editing mode
  }

  __getSerialRepresentation(): Record<string, any> {
    const { x, y, width, height } = this;
    return { x, y, w: width, h: height };
  }
}
