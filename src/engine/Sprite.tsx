import { serialize } from "../Document";
import { BoomerProp, placeholder, sprite } from "./BoomerProp";
import { EngineObject } from "./EngineObject";
import { Tiles } from "./Tiles";

export type SpriteLocation = {
  kind: "SpriteLocation";
  tilesUrl: string;
  num: number;
};

export class Sprite extends EngineObject {
  readonly classname = "Sprite";

  override visibleProps: BoomerProp<Sprite>[] = this._props([
    sprite<Sprite>(this, "tile"),
  ]);

  private constructor(
    readonly tilemap: Tiles,
    // readonly image: ImageBitmap,
    readonly tile: SpriteLocation,
    x: number,
    y: number
  ) {
    super(x, y, tilemap.spriteSize, tilemap.spriteSize, null);
    // this.image = image; // TODO: image is a separate kind of engine object. We allow creating images from sprites (bake as image)
  }

  paintToContext(ctx: CanvasRenderingContext2D) {
    // pixel-perfect
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    // const { x, y } = this;0
    // ctx.drawImage(this.image, x, y);

    this.tilemap.drawSprite(this.tile.num, [x, y], ctx);
  }

  __getSerialRepresentation() {
    const result = this.__getEOSerializableRepresentation();
    const { tilesUrl, num } = this.tile;
    const imageUrl = tilesUrl + "@" + num;
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

  static async fromTile(tilemap: Tiles, num: number) {
    // const cols = tilemap.img.width / tilemap.spriteSize;
    const srcX = (num * tilemap.spriteSize) % tilemap.img.width;
    // const rows = tilemap.img.height / tilemap.spriteSize;
    const srcY =
      Math.floor((num * tilemap.spriteSize) / tilemap.img.width) *
      tilemap.spriteSize;

    const image = await createImageBitmap(
      tilemap.img,
      srcX,
      srcY,
      tilemap.spriteSize,
      tilemap.spriteSize
    );

    return new Sprite(
      tilemap,
      { kind: "SpriteLocation", tilesUrl: tilemap.url, num },
      0,
      0
    );
  }
}
