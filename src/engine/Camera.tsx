import { EngineObject } from "./EngineObject";
import { Serializable } from "./Engine";

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
