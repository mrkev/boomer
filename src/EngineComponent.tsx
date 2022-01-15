import React, { useCallback, useEffect, useRef } from "react";
import { EngineState, EOProxyForScripting, EngineObject } from "./Engine";
import { degVectorFromAToB, rectCenter, rectOverlap } from "./Rect";
import { useGlobalPressedKeySet } from "./useAppKeyboardEvents";
import { Engine as MatterEngine } from "matter-js";

/** Pixel-perfect and scaled coordinates of mouse/pointer events */
function getEventCanvasCoordinates(
  canvas: HTMLCanvasElement,
  e: PointerEvent | MouseEvent | React.PointerEvent | React.MouseEvent
) {
  const rect = canvas.getBoundingClientRect();
  const x = Math.round((e.clientX - rect.left) / devicePixelRatio);
  const y = Math.round((e.clientY - rect.top) / devicePixelRatio);
  return [x, y];
}

function getObjectAtCoords(
  engineState: EngineState,
  [x, y]: [number, number]
): EngineObject | null {
  let clickedSprite = null;
  // set order is insertion order, but we want to find the top-most sprite
  // at a coordinate, not the bottom-most
  for (let i = engineState.objects.size - 1; i >= 0; i--) {
    const obj = engineState.objects.get(i);

    if (
      obj.x <= x &&
      x <= obj.x + obj.width &&
      obj.y <= y &&
      y <= obj.y + obj.height
    ) {
      console.log("clicked", obj);
      clickedSprite = obj;
      break;
    }
  }
  return clickedSprite;
}

export type EngineMouseEvent = {
  x: number;
  y: number;
  sprite: EngineObject | null;
  nativeEvent: MouseEvent;
};

function initializeRun(
  engineState: EngineState,
  canvas: HTMLCanvasElement,
  pressedKeySet: Set<string>
) {
  const frame = {
    width: canvas.width,
    height: canvas.height,
  };

  const objects = {
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
    script.call(eo._proxyForScripting, console, frame, objects, keyboard);
    console.log("initialized", eo);
  }
}

export function EngineComponent({
  state: engineState,
  onClick,
  onMouseDown,
  onMouseUp,
  onMouseMove,
  mode,
  size,
}: {
  state: EngineState;
  onClick?: (evt: EngineMouseEvent) => void;
  onMouseDown?: (evt: EngineMouseEvent) => void;
  onMouseUp?: (evt: EngineMouseEvent) => void;
  onMouseMove?: (evt: { x: number; y: number }) => void;
  mode: "editing" | "running";
  size: [number, number];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pressedKeySet = useGlobalPressedKeySet();

  useEffect(() => {
    if (mode === "editing" || canvasRef.current == null) {
      return;
    }
    // On RUN
    else {
      engineState.resetPhysics();
      initializeRun(engineState, canvasRef.current, pressedKeySet);
    }
  }, [engineState, mode, pressedKeySet]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    let lastTime = -1;
    let raf = requestAnimationFrame(function gameLoop(time) {
      if (mode === "running") {
        dispatchFrameEventToAll(engineState);
      }

      if (mode === "running") {
        const deltaTime = lastTime > 0 ? time - lastTime : 1000 / 60;
        MatterEngine.update(engineState.physicsEngine, deltaTime);
        engineState.commitPhysics();
      }

      engineState.render(ctx, canvas.width, canvas.height);
      raf = requestAnimationFrame(gameLoop);
      lastTime = time;
    });
    return () => {
      cancelAnimationFrame(raf);
    };
  }, [engineState, mode]);

  const onEngineClick = useCallback(
    (e: React.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      if (mode === "running") {
        const [x, y] = getEventCanvasCoordinates(canvas, e);
        const clickedSprite = getObjectAtCoords(engineState, [x, y]);
        clickedSprite && dispatchClickEvent(engineState, clickedSprite);
        return;
      }

      if (!onClick) {
        return;
      }

      const [x, y] = getEventCanvasCoordinates(canvas, e);
      const clickedSprite = getObjectAtCoords(engineState, [x, y]);
      onClick({ x, y, sprite: clickedSprite, nativeEvent: e.nativeEvent });
    },
    [engineState, mode, onClick]
  );

  const onEngineMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      if (mode === "running") {
        return;
      }

      if (!onMouseDown) {
        return;
      }

      const [x, y] = getEventCanvasCoordinates(canvas, e);
      const clickedSprite = getObjectAtCoords(engineState, [x, y]);
      onMouseDown({ x, y, sprite: clickedSprite, nativeEvent: e.nativeEvent });
    },
    [engineState, onMouseDown]
  );

  const onEngineMouseUp = useCallback(
    (e: React.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      if (mode === "running") {
        return;
      }

      if (!onMouseUp) {
        return;
      }

      const [x, y] = getEventCanvasCoordinates(canvas, e);
      const clickedSprite = getObjectAtCoords(engineState, [x, y]);
      onMouseUp({ x, y, sprite: clickedSprite, nativeEvent: e.nativeEvent });
    },
    [engineState, onMouseUp]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const onEnginePointerMove = function (e: PointerEvent) {
      // TODO: world coordinates instead of canvas coordinates
      const [x, y] = getEventCanvasCoordinates(canvas, e);
      onMouseMove?.({ x, y });
    };

    canvas.addEventListener("pointermove", onEnginePointerMove);
    return () => {
      canvas.removeEventListener("pointermove", onEnginePointerMove);
    };
  }, [onMouseMove]);

  return (
    <canvas
      width={size[0]}
      height={size[1]}
      style={{
        width: "600px",
        height: "300px",
      }}
      ref={canvasRef}
      onClick={onEngineClick}
      onMouseDown={onEngineMouseDown}
      onMouseUp={onEngineMouseUp}
    ></canvas>
  );
}

export function dispatchClickEvent(engineState: EngineState, eo: EngineObject) {
  console.log("TODO: run click events");
  eo._proxyForScripting.triggerClick();
}

function dispatchFrameEventToAll(engineState: EngineState) {
  for (const eo of engineState.objects) {
    eo._proxyForScripting.triggerFrame();
  }
}
