import { BoomerProp, string } from "./BoomerProp";
import { Serializable } from "./Engine";
import { EngineObject } from "./EngineObject";

export class Box extends EngineObject implements Serializable {
  readonly classname = "Box";
  color: string;

  readonly visibleProps: BoomerProp<Box>[] = this._props([
    string<Box>(this, "color"),
  ]);

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
