import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { EOProxyForScripting } from "./engine/Engine";
import { Camera } from "./engine/Camera";
import { EngineObject } from "./engine/EngineObject";
import { EngineState, Engine } from "./EngineState";
import { useGlobalPressedKeySet } from "./useAppKeyboardEvents";
import { Engine as MatterEngine } from "matter-js";

/** Pixel-perfect and scaled coordinates of mouse/pointer events */
function getEventCanvasCoordinates(
  canvas: HTMLCanvasElement,
  e: PointerEvent | MouseEvent | React.PointerEvent | React.MouseEvent
) {
  const rect = canvas.getBoundingClientRect();
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Lost context");
  }

  // a c e
  // b d f
  // 0 0 1
  const transform = ctx.getTransform();

  const x =
    Math.round((e.clientX - rect.left) / devicePixelRatio) - transform.e;
  const y = Math.round((e.clientY - rect.top) / devicePixelRatio) - transform.f;
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

export function EngineComponent({
  state: engineState,
  editorCamera,
  onClick,
  onDoubleClick,
  onMouseDown,
  onMouseUp,
  onMouseMove,
  mode,
  size,
}: {
  state: EngineState;
  editorCamera?: Camera;
  onClick?: (_evt: EngineMouseEvent) => void;
  onDoubleClick?: (_evt: EngineMouseEvent) => void;
  onMouseDown?: (_evt: EngineMouseEvent) => void;
  onMouseUp?: (_evt: EngineMouseEvent) => void;
  onMouseMove?: (_evt: { x: number; y: number }) => void;
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
      Engine.initializeRun(engineState, canvasRef.current, pressedKeySet);
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
        // Scripting
        Engine.dispatchFrameEventToAll(engineState);
        // Physics
        const deltaTime = lastTime > 0 ? time - lastTime : 1000 / 60;
        MatterEngine.update(engineState.physicsEngine, deltaTime);
        Engine.commitPhysics(engineState);
      }

      Engine.renderCamera(
        engineState,
        mode === "running"
          ? engineState.camera
          : editorCamera || engineState.camera,
        ctx
      );
      raf = requestAnimationFrame(gameLoop);
      lastTime = time;
    });
    return () => {
      cancelAnimationFrame(raf);
    };
  }, [editorCamera, engineState, mode]);

  const [canvasSize, setCanvasSize] = useState<[number, number]>(size);
  useLayoutEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) {
      return;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      setCanvasSize([entry.contentRect.width, entry.contentRect.height]);
    });

    resizeObserver.observe(canvasEl);

    return () => {
      resizeObserver.unobserve(canvasEl);
    };
  }, []);
  // console.log("SIZE", canvasSize);

  const onEngineClick = useCallback(
    (e: React.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      if (mode === "running") {
        const [x, y] = getEventCanvasCoordinates(canvas, e);
        const clickedSprite = getObjectAtCoords(engineState, [x, y]);
        clickedSprite && Engine.dispatchClickEvent(engineState, clickedSprite);
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

  const onEngineDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      if (mode === "running") {
        return;
      }

      if (!onDoubleClick) {
        return;
      }

      const [x, y] = getEventCanvasCoordinates(canvas, e);
      const clickedSprite = getObjectAtCoords(engineState, [x, y]);
      onDoubleClick({
        x,
        y,
        sprite: clickedSprite,
        nativeEvent: e.nativeEvent,
      });
    },
    [engineState, mode, onDoubleClick]
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
    [engineState, mode, onMouseDown]
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
    [engineState, mode, onMouseUp]
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !editorCamera) {
      return;
    }

    const onWheel = (e: WheelEvent) => {
      if (mode === "running") {
        return;
      }

      editorCamera.x -= Math.round(e.deltaX / 2);
      editorCamera.y -= Math.round(e.deltaY / 2);
    };
    canvas.addEventListener("wheel", onWheel);
    return () => {
      canvas.removeEventListener("wheel", onWheel);
    };
  });

  const [width, height] = canvasSize;

  return (
    <canvas
      width={width / 2}
      height={height / 2}
      style={{
        width: "100%",
        height: "100%",
      }}
      ref={canvasRef}
      onClick={onEngineClick}
      onDoubleClick={onEngineDoubleClick}
      onMouseDown={onEngineMouseDown}
      onMouseUp={onEngineMouseUp}
    ></canvas>
  );
}
