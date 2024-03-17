import { serialize } from "../Document";
import { Tiles } from "./Engine";
import { EngineObject } from "./EngineObject";

export class Sprite extends EngineObject {
  readonly classname = "Sprite";

  private constructor(
    private image: ImageBitmap,
    private imageUrl: string,
    x: number,
    y: number
  ) {
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

    const url = tilemap.url + "@" + num;

    return new Sprite(image, url, 0, 0);
  }
}
