import { EngineState } from "./EngineState";
import { useAtom } from "jotai";
import { useEffect } from "react";
import { vdiv, vsub, vadd, vfloor } from "./Vector";
import {
  cursorState,
  modeState,
  exhaustiveSwitch,
  selectionState,
} from "./AppState";
import { rectSubset } from "./Rect";
import { useLinkedState } from "./lib/LinkedState";
import { Camera } from "./engine/Camera";

export function useAppMouseCursor(
  engineState: EngineState,
  canvasSize: [number, number]
) {
  const [cursor, setCursor] = useLinkedState(cursorState);
  const [_, setSelection] = useLinkedState(selectionState);
  const [mode] = useLinkedState(modeState);

  useEffect(() => {
    switch (cursor.state) {
      case "idle":
      case "transforming":
      case "selecting":
        break;
      case "placing-text":
        window.document.body.style.cursor = "text";
        break;
      case "moving":
        window.document.body.style.cursor = "grabbing";
        break;
      case "placing-box":
        window.document.body.style.cursor = "crosshair";
        break;
      case "will-pan":
        window.document.body.style.cursor = "grab";
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
          const { clientStart, transformedEngineObjects: engineObjects } =
            cursor;
          const delta = vdiv(
            vsub([e.clientX, e.clientY], clientStart),
            devicePixelRatio
          );

          for (const { eo, start } of engineObjects) {
            const [x, y] = vadd(start, vfloor(delta));
            eo._proxyForScripting.x = x;
            eo._proxyForScripting.y = y;
          }

          break;
        }
        case "selecting": {
          const { clientStart, canvasStart } = cursor;
          const delta = vdiv(
            vsub([e.clientX, e.clientY], clientStart),
            devicePixelRatio
          );
          setCursor({
            state: "selecting",
            canvasStart,
            clientStart,
            size: delta,
          });

          break;
        }
        case "placing-text":
          break;

        case "placing-box":
          // TODO: box size
          break;

        case "will-pan":
          // TODO: pan
          break;
        default:
          exhaustiveSwitch(cursor);
      }
    };

    const mouseUpHandler = function (e: MouseEvent) {
      console.log("mouseUpHandler", cursor.state);
      // console.log("mouse up");
      switch (cursor.state) {
        case "idle":
          break;
        case "transforming":
          // console.log("FINISHED TRANSFORM");
          setCursor({ state: "idle" });
          break;
        case "moving":
          // console.log("FINISHED MOVE");
          if (
            cursor.transformedEngineObjects.length === 1 &&
            cursor.transformedEngineObjects[0].eo instanceof Camera
          ) {
            setCursor({ state: "will-pan" });
            return;
          }
          setCursor({ state: "idle" });
          break;
        case "selecting":
          // TODO: set selection
          const { canvasStart, size } = cursor;

          const selectedObjects = [];
          for (const eo of engineState.objects) {
            const isInsideSelection = rectSubset(
              [eo.x, eo.y, eo.width, eo.height],
              [canvasStart[0], canvasStart[1], size[0], size[1]]
            );
            if (isInsideSelection) {
              selectedObjects.push(eo);
            }
          }

          if (selectedObjects.length > 0) {
            setSelection({ state: "engine-object", eos: selectedObjects });
          } else {
            setSelection({ state: "idle" });
          }

          setCursor({ state: "idle" });
          break;

        case "placing-text":
        case "placing-box":
          // handled on canvas mouseUp listener
          break;
        case "will-pan":
          // todo pan
          break;
        default:
          exhaustiveSwitch(cursor);
      }
    };

    const contextMenuHandler = function () {
      switch (cursor.state) {
        case "idle":
          break;
        case "transforming":
        case "moving":
        case "selecting":
        case "placing-text":
        case "placing-box":
        case "will-pan":
          setCursor({ state: "idle" });
          break;
        default:
          exhaustiveSwitch(cursor);
      }
    };

    window.addEventListener("mousemove", mouseMoveHandler);
    window.addEventListener("mouseup", mouseUpHandler);
    window.addEventListener("contextmenu", contextMenuHandler);
    return () => {
      window.removeEventListener("mousemove", mouseMoveHandler);
      window.removeEventListener("mouseup", mouseUpHandler);
      window.removeEventListener("contextmenu", contextMenuHandler);
    };
  }, [canvasSize, cursor, engineState, mode.state, setCursor, setSelection]);
}
