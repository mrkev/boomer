import { BoomerProp, string } from "./BoomerProp";
import { Serializable } from "./Engine";
import { EngineObject } from "./EngineObject";

export class Text extends EngineObject implements Serializable {
  classname = "Text";
  color: string = "red";

  readonly visibleProps: BoomerProp<Text>[] = this._eovps<Text>().concat([
    string<Text>(this, "text"),
    string<Text>(this, "color"),
  ]);

  constructor(x: number, y: number, public text: string) {
    super(x, y, 0, 0, null);
  }

  paintToContext(ctx: CanvasRenderingContext2D): void {
    const dims = ctx.measureText(this.text);
    this.width = dims.width;
    this.height = dims.fontBoundingBoxAscent + dims.fontBoundingBoxDescent;
    ctx.fillStyle = this.color;
    ctx.fillText(this.text, this.x, this.y + this.height);
  }

  __getSerialRepresentation() {
    const result = this.__getEOSerializableRepresentation();
    const { text } = this;

    return Object.assign(result, { text });
  }
}
