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
    if (mode === "editing") {
      return;
    } else {
      console.log("todo: intialize objects");
      for (const eo of engineState.objects) {
        eo._proxyForScripting = new ProxyForScripting(eo);
        const script = new Function("console", eo._script);
        script.call(eo._proxyForScripting, console);
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
      raf = requestAnimationFrame(gameLoop);
    });
    return () => {
      cancelAnimationFrame(raf);
    };
  }, [engineState]);

  const onEngineClick = useCallback(
    (e: React.MouseEvent) => {
      if (!onClick) {
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      const [x, y] = getEventCanvasCoordinates(canvas, e);
      const clickedSprite = getSpriteAtCoords(engineState, [x, y]);
      onClick({ x, y, sprite: clickedSprite, nativeEvent: e.nativeEvent });
    },
    [engineState, onClick]
  );

  const onEngineMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!onMouseDown) {
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) {
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
      if (!onMouseUp) {
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) {
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
