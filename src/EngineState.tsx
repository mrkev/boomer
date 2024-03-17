import OrderedSet from "./lib/OrderedSet";
import {
  Engine as MatterEngine,
  Bodies as MatterBodies,
  Composite as MatterComposite,
} from "matter-js";
import { Serializable, EOProxyForScripting } from "./engine/Engine";
import { Camera } from "./engine/Camera";
import { Sprite } from "./engine/Sprite";
import { EngineObject } from "./engine/EngineObject";
import { degVectorFromAToB, rectCenter, rectOverlap } from "./Rect";
import { assert } from "./assert";

function getScriptingEnvironmentObjectsNamespace(engineState: EngineState) {
  return {
    find(id: string): null | EOProxyForScripting {
      // TODO: editor-side check for non-duplicate ids
      for (const obj of engineState.objects.values()) {
        if (obj.id === id) {
          return obj._proxyForScripting;
        }
      }
      return null;
    },

    // todo: split up to "isColliding" and "directionToObject"
    // todo: add this.isColliding(b) to ProxyForScripting
    areColliding(a: EOProxyForScripting, b: EOProxyForScripting): boolean {
      const ar = a.getRect();
      const br = b.getRect();
      return rectOverlap(ar, br);
    },

    // returns the angle at which two elements are colliding
    // or null if they're not
    findCollisionAngle(
      a: EOProxyForScripting,
      b: EOProxyForScripting
    ): number | null {
      const ar = a.getRect();
      const br = b.getRect();
      if (!rectOverlap(ar, br)) {
        return null;
      }

      const ac = rectCenter(ar);
      const bc = rectCenter(br);

      const [_, angle] = degVectorFromAToB(ac, bc);
      return angle;
    },
  };
}

export class Engine {
  // Triggers frame events on an engine state's objects' scripts
  static dispatchFrameEventToAll(engineState: EngineState) {
    for (const eo of engineState.objects) {
      eo._proxyForScripting.triggerFrame();
    }
  }

  static dispatchClickEvent(engineState: EngineState, eo: EngineObject) {
    assert(engineState.objects.has(eo), "Clicked object not in engine state");
    eo._proxyForScripting.triggerClick();
  }

  // sets all engine states' objects to their positions per their physics
  // boxes, if they have one.
  static commitPhysics(engineState: EngineState) {
    engineState.objects.forEach((eo) => {
      if (!eo._physicsBox) {
        // TODO: when not using physics, make sure there's no box, so dynamically
        // toggling this doesn't put our object soemwhere we don't expect afterwards
        return;
      }
      eo.x = eo._physicsBox.position.x;
      eo.y = eo._physicsBox.position.y;
    });
  }

  // renders an engine state to a context
  static renderCamera(
    engineState: EngineState,
    camera: Camera,
    ctx: CanvasRenderingContext2D
  ) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#292A2D";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // console.log(1, 0, 0, 1, camera.x, camera.y);
    ctx.setTransform(1, 0, 0, 1, camera.x, camera.y);

    engineState.objects.forEach((eo) => {
      if (engineState._debug_spriteBoxes && eo._physicsBox) {
        ctx.fillStyle = "blue";
        const { x, y } = eo._physicsBox.position;
        ctx.fillRect(x, y, eo.width, eo.height);
      }
      if (engineState._debug_spriteBoxes && eo instanceof Sprite) {
        ctx.fillStyle = "red";
        ctx.fillRect(eo.x, eo.y, eo.width, eo.height);
      }
      eo.paintToContext(ctx);
    });

    // Renders engine state's camera as a box. Visible only
    // if using a de-attatched camera.
    ctx.strokeStyle = "green";
    ctx.strokeRect(
      engineState.camera.x,
      engineState.camera.y,
      engineState.camera.width,
      engineState.camera.height
    );
  }

  // Initializes an engine state to be run
  static initializeRun(
    engineState: EngineState,
    canvas: HTMLCanvasElement,
    pressedKeySet: Set<string>
  ) {
    const frame = {
      width: canvas.width,
      height: canvas.height,
    };

    const keyboard = {
      isPressed(...keys: string[]): boolean {
        for (const key of keys) {
          if (!pressedKeySet.has(key)) {
            return false;
          }
        }
        return true;
      },
    };

    for (const eo of engineState.objects) {
      eo._proxyForScripting = new EOProxyForScripting(eo);
      const script = new Function(
        "console",
        "frame",
        "objects",
        "keyboard",
        eo._script
      );
      const objects = getScriptingEnvironmentObjectsNamespace(engineState);

      script.call(eo._proxyForScripting, console, frame, objects, keyboard);
      console.log("initialized", eo);
    }
  }
}

function sealed<T extends Serializable>(
  constructor: new (...args: any[]) => T
) {
  // Object.seal(constructor);
  // Object.seal(constructor.prototype);
  constructor.prototype.__serializableFields = {};
  return constructor;
}

// @sealed
export class EngineState implements Serializable {
  readonly physicsEngine = MatterEngine.create({
    gravity: { x: 0, y: 0 },
  });
  readonly objects = new OrderedSet<EngineObject>();
  readonly camera: Camera;

  readonly _index_UUID_eo = new Map<string, EngineObject>();
  readonly _debug_spriteBoxes = true;

  constructor(camera: Camera) {
    this.camera = camera;
    (window as any).es = this;
  }

  addEngineObject(eo: EngineObject) {
    this.objects.add(eo);
    this._index_UUID_eo.set(eo._uuid, eo);
  }

  removeEngineObject(eo: EngineObject) {
    this.objects.delete(eo);
    this._index_UUID_eo.delete(eo._uuid);
  }

  enablePhysicsForObject(eo: EngineObject) {
    if (!this.objects.has(eo)) {
      throw new Error("Attempted to enable physics for an unknown EO");
    }
    eo._physicsBox = MatterBodies.rectangle(eo.x, eo.y, eo.width, eo.height);
    // Prevent rotation: https://github.com/liabru/matter-js/issues/104
    // eo.physicsBox.inertia = Infinity;
    // eo.physicsBox.frictionAir = 0.5;
    MatterComposite.add(this.physicsEngine.world, eo._physicsBox);
  }

  __getSerialRepresentation() {
    return {
      objects: [...this.objects],
      camera: this.camera,
    };
  }
}
