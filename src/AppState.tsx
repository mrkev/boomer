import type { EngineObject } from "./Engine";
import { atom, useAtom } from "jotai";
import { useEffect } from "react";
import { vdiv, vsub, vadd, vfloor } from "./Vector";

type CursorState =
  | { state: "idle" }
  | { state: "transforming"; engineObject: EngineObject }
  | {
      state: "moving";
      eoStart: [number, number];
      clientStart: [number, number];
      engineObject: EngineObject;
    };

export const cursorState = atom<CursorState>({
  state: "idle",
});

type SelectionState =
  | { state: "idle" }
  | { state: "engine-object"; eo: EngineObject };

export const selectionState = atom<SelectionState>({
  state: "idle",
});

type ModeState = { state: "editing" } | { state: "running" };
export const modeState = atom<ModeState>({
  state: "editing",
});

function exhaustiveSwitch(x: never): never {
  throw new Error("non-exhaustive: " + String(x));
}

export function useAppMouseCursor() {
  const [cursor, setCursor] = useAtom(cursorState);
  const [mode] = useAtom(modeState);

  useEffect(() => {
    switch (cursor.state) {
      case "idle":
      case "transforming":
        break;
      case "moving":
        window.document.body.style.cursor = "grabbing";

        break;
      default:
        exhaustiveSwitch(cursor);
    }

    return () => {
      window.document.body.style.cursor = "unset";
    };
  }, [cursor]);

  useEffect(() => {
    if (mode.state === "running") {
      return;
    }

    const mouseMoveHandler = function (e: MouseEvent) {
      switch (cursor.state) {
        case "idle":
          break;
        case "transforming":
          console.log("TRANSFORMING");
          break;
        case "moving": {
          const { eoStart, clientStart, engineObject } = cursor;

          const delta = vdiv(
            vsub([e.clientX, e.clientY], clientStart),
            devicePixelRatio
          );
          const [x, y] = vadd(eoStart, vfloor(delta));

          engineObject.x = x;
          engineObject.y = y;
          break;
        }
        default:
          exhaustiveSwitch(cursor);
      }
    };
    const mouseUpHandler = function () {
      console.log("mouse up");
      switch (cursor.state) {
        case "idle":
          break;
        case "transforming":
          console.log("FINISHED TRANSFORM");
          setCursor({ state: "idle" });
          break;
        case "moving":
          console.log("FINISHED MOVE");
          setCursor({ state: "idle" });
          break;
        default:
          exhaustiveSwitch(cursor);
      }
    };

    window.addEventListener("mousemove", mouseMoveHandler);
    window.addEventListener("mouseup", mouseUpHandler);
    return () => {
      window.removeEventListener("mousemove", mouseMoveHandler);
      window.removeEventListener("mouseup", mouseUpHandler);
    };
  }, [cursor, mode.state, setCursor]);
}
