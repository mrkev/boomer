import { Body as MatterBody } from "matter-js";
import { Rect } from "../Rect";
import { shortUUID } from "../lib/uuid";
import { EOProxyForScripting } from "./Engine";
import { BoomerProp, number, stringOpt, stringRO } from "./BoomerProp";

export abstract class EngineObject {
  abstract classname: string;
  _uuid: string;
  _physicsBox: MatterBody | null;
  id: null | string;
  x: number;
  y: number;
  width: number;
  height: number;

  abstract readonly visibleProps: BoomerProp<any>[];

  protected _props<T extends EngineObject>(
    v: BoomerProp<T>[]
  ): BoomerProp<T>[] {
    return [
      stringRO<EngineObject>(this, "classname") as BoomerProp<T>,
      stringOpt<EngineObject>(this, "id") as BoomerProp<T>,
      number<EngineObject>(this, "x") as BoomerProp<T>,
      number<EngineObject>(this, "y") as BoomerProp<T>,
      number<EngineObject>(this, "width") as BoomerProp<T>,
      number<EngineObject>(this, "height") as BoomerProp<T>,
    ].concat(v);
  }

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
