export class Tiles {
  readonly img: HTMLImageElement;
  readonly spriteSize: number;
  readonly length: number;

  constructor(img: HTMLImageElement, spriteSize: number) {
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
        res(new Tiles(img, spriteSize));
      };
      // triggers onload event (after it loads of course)
      // img.src = "//via.placeholder.com/350x150";
      img.src = url;
    });
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

    return new Sprite(image);
  }
}

export abstract class EngineObject {
  x: number = 0;
  y: number = 0;
  width: number = 0;
  height: number = 0;
  abstract paintToContext(ctx: CanvasRenderingContext2D): void;
  _proxyForScripting = new ProxyForScripting(this);
  _script: string = "this.onClick(() => { this.x = 0; });";
}

/**
 * Proxy scripting so we decide what's scriptable, so the scripting api remains
 * different from the internal api, and so user-generated references
 * (say, event listeners) are separate from internal ones.
 */
export class ProxyForScripting {
  #eo: EngineObject;
  #clickHandlers: Array<() => void> = [];
  #frameHandlers: Array<() => void> = [];

  constructor(eo: EngineObject) {
    this.#eo = eo;
  }

  onClick(cb: () => void) {
    this.#clickHandlers.push(cb);
  }

  triggerClick() {
    for (const handler of this.#clickHandlers) {
      handler();
    }
  }

  onFrame(cb: () => void) {
    this.#frameHandlers.push(cb);
  }

  get x() {
    return this.#eo.x;
  }

  set x(n: number) {
    this.#eo.x = n;
  }
}

export class Box extends EngineObject {
  x: number = 0;
  y: number = 0;
  width: number;
  height: number;
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

type Transform = [number, number, number, number, number, number];

const ENTITY_TRANSFORM = (): Transform => [1, 0, 0, 1, 0, 0];

export class Sprite extends EngineObject {
  x: number = 0;
  y: number = 0;
  width: number;
  height: number;
  image: ImageBitmap;

  transform: Transform = ENTITY_TRANSFORM();

  private engineState: EngineState | null = null;

  constructor(image: ImageBitmap) {
    super();
    this.image = image;
    this.width = image.width;
    this.height = image.height;
  }

  attatchToState(engine: EngineState) {
    this.engineState = engine;
  }

  paintToContext(ctx: CanvasRenderingContext2D) {
    ctx.transform(...this.transform);
    ctx.drawImage(this.image, this.x, this.y);
    ctx.transform(...ENTITY_TRANSFORM());
  }
}

export class EngineState {
  readonly objects: Set<EngineObject> = new Set();
  private _debug_spriteBoxes = false;

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
}

export function dispatchClickEvent(engineState: EngineState, eo: EngineObject) {
  console.log("TODO: run click events");
  eo._proxyForScripting.triggerClick();
}