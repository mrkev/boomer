import React, { useCallback, useEffect, useRef } from "react";
import { EngineState, Sprite, ProxyForScripting, EngineObject } from "./Engine";

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

function getSpriteAtCoords(
  engineState: EngineState,
  [x, y]: [number, number]
): Sprite | null {
  let clickedSprite = null;
  // set order is insertion order, but we want to find the top-most sprite
  // at a coordinate, not the bottom-most
  for (const art of Array.from(engineState.objects).reverse()) {
    if (!(art instanceof Sprite)) {
      continue;
    }
    const sprite = art;

    if (
      sprite.x <= x &&
      x <= sprite.x + sprite.width &&
      sprite.y <= y &&
      y <= sprite.y + sprite.height
    ) {
      console.log("clicked", sprite);
      clickedSprite = sprite;
      break;
    }
  }
  return clickedSprite;
}

export type EngineMouseEvent = {
  x: number;
  y: number;
  sprite: Sprite | null;
  nativeEvent: MouseEvent;
};

export function EngineComponent({
  state: engineState,
  onClick,
  onMouseDown,
  onMouseUp,
  onMouseMove,
  mode,
}: {
  state: EngineState;
  onClick?: (evt: EngineMouseEvent) => void;
  onMouseDown?: (evt: EngineMouseEvent) => void;
  onMouseUp?: (evt: EngineMouseEvent) => void;
  onMouseMove?: (evt: { x: number; y: number }) => void;
  mode: "editing" | "running";
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (mode === "editing" || canvasRef.current == null) {
      return;
    }
    // On RUN
    else {
      console.log("todo: intialize objects");
      for (const eo of engineState.objects) {
        eo._proxyForScripting = new ProxyForScripting(eo);
        const script = new Function("console", "frame", eo._script);
        script.call(eo._proxyForScripting, console, {
          width: canvasRef.current.width,
          height: canvasRef.current.height,
        });
        console.log("initialized", eo);
      }
    }
  }, [engineState, mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    // const pixelRatio = window.devicePixelRatio;
    // const thickness = 5;
    // ctx.lineWidth = thickness * pixelRatio;
    let raf = requestAnimationFrame(function gameLoop() {
      engineState.render(ctx, canvas.width, canvas.height);
      if (mode === "running") {
        dispatchFrameEventToAll(engineState);
      }
      raf = requestAnimationFrame(gameLoop);
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
        const clickedSprite = getSpriteAtCoords(engineState, [x, y]);
        clickedSprite && dispatchClickEvent(engineState, clickedSprite);
        return;
      }

      if (!onClick) {
        return;
      }

      const [x, y] = getEventCanvasCoordinates(canvas, e);
      const clickedSprite = getSpriteAtCoords(engineState, [x, y]);
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
      const clickedSprite = getSpriteAtCoords(engineState, [x, y]);
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
      const clickedSprite = getSpriteAtCoords(engineState, [x, y]);
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
      width={300}
      height={150}
      style={{
        width: "600px",
        height: "300px",
      }}
      ref={canvasRef}
      onClick={onEngineClick}
      onMouseDown={onEngineMouseDown}
      onMouseUp={onEngineMouseUp}
      onContextMenu={function () {}}
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
