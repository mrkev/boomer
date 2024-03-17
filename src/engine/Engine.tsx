import { degVectorFromAToB, rectCenter, rectOverlap } from "../Rect";
import Matter from "matter-js";
import { exhaustiveSwitch } from "../AppState";
import { EngineObject } from "./EngineObject";
import { Sprite } from "./Sprite";
import { Box } from "./Box";

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

export interface Serializable {
  __getSerialRepresentation(): Record<string, any>;
}
