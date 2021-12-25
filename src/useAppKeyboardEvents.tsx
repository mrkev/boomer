import { useEffect } from "react";
import { EngineState } from "./Engine";
import { useAtom } from "jotai";
import { selectionState } from "./AppState";

export function useAppKeyboardEvents(engineState: EngineState) {
  const [selection, setSelection] = useAtom(selectionState);
  useEffect(() => {
    const onKeydown = function (e: KeyboardEvent) {
      if (e.repeat) {
        return;
      }

      switch (e.key) {
        case "Backspace": {
          console.log("BS", e.repeat);
          if (selection.state !== "engine-object") {
            return;
          }
          const eo = selection.eo;
          engineState.removeSprite(eo);
          setSelection({ state: "idle" });
          break;
        }
        default:
          console.log("key", e.key);
      }
    };

    window.addEventListener("keydown", onKeydown);
    return () => {
      window.removeEventListener("keydown", onKeydown);
    };
  }, [engineState, selection, setSelection]);
}
