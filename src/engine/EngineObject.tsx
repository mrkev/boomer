import { Body as MatterBody } from "matter-js";
import { Rect } from "../Rect";
import { shortUUID } from "../lib/uuid";
import { EOProxyForScripting } from "./Engine";

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
