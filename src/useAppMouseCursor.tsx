import { EngineState } from "./Engine";
import { useAtom } from "jotai";
import { useEffect } from "react";
import { vdiv, vsub, vadd, vfloor } from "./Vector";
import { cursorState, modeState, exhaustiveSwitch } from "./AppState";

export function useAppMouseCursor(
  engineState: EngineState,
  canvasSize: [number, number]
) {
  const [cursor, setCursor] = useAtom(cursorState);
  const [mode] = useAtom(modeState);

  useEffect(() => {
    switch (cursor.state) {
      case "idle":
      case "transforming":
      case "selecting":
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
        default:
          exhaustiveSwitch(cursor);
      }
    };
    const mouseUpHandler = function () {
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
              console.log("isInsideSelection", eo);
            }
          }

          // setSelection({state: 'engine-objects', eos: []})
          console.log("SET IDLE");
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
  }, [canvasSize, cursor, engineState, mode.state, setCursor]);
}

function rectSubset(
  inner: [number, number, number, number],
  outer: [number, number, number, number]
) {
  const [ix, iy, iw, ih] = inner;
  const [ox, oy, ow, oh] = outer;
  const xtest = ix > ox && ix + iw < ox + ow;
  const ytest = iy > oy && iy + ih < oy + oh;
  console.log(
    "i",
    [ix, iy, iw, ih],
    xtest && ytest ? "inside" : "outside",
    "o",
    [ox, oy, ow, oh],
    xtest,
    ytest
  );
  return ix > ox && ix + iw < ox + ow && iy > oy && iy + ih < oy + oh;
}
