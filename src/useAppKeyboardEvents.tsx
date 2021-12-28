import { useEffect } from "react";
import { EngineState, Sprite, Tiles } from "./Engine";
import { useAtom } from "jotai";
import { selectionState } from "./AppState";
import { hydrateFor } from "./Document";

export function useAppKeyboardEvents(
  engineState: EngineState,
  tiles: Tiles | null
) {
  const [selection, setSelection] = useAtom(selectionState);

  useEffect(() => {
    const onKeydown = async function (e: KeyboardEvent) {
      const cmd =
        (navigator as any).userAgentData.platform === "macOS"
          ? e.metaKey
          : e.ctrlKey;
      if (e.repeat) {
        return;
      }

      switch (e.key) {
        case "Backspace": {
          // console.log("BS", e.repeat);
          if (selection.state !== "engine-object") {
            return;
          }
          const eo = selection.eo;
          engineState.removeSprite(eo);
          setSelection({ state: "idle" });
          break;
        }

        case "c": {
          if (!cmd) {
            return;
          }
          if (
            selection.state === "engine-object" &&
            selection.eo instanceof Sprite
          ) {
            const dataToCopy = [selection.eo.toClipboardData()];
            navigator.clipboard.write(dataToCopy);
          }
          break;
        }

        case "v": {
          if (!cmd || !tiles) {
            return;
          }

          const data = await navigator.clipboard.read();
          for (let i = 0; i < data.length; i++) {
            const item: ClipboardItem = data[i];
            if (!item.types.includes("text/plain")) {
              break;
              // alert("Clipboard contains non-image data. Unable to access it.");
            } else {
              const blob = await item.getType("text/plain");
              try {
                const str = await blob.text();
                const json = JSON.parse(str);
                if (json.$type !== "Sprite") {
                  break;
                }
                const sprite = await hydrateFor.Sprite(json, tiles);
                engineState.addSprite(sprite);
                setSelection({ state: "engine-object", eo: sprite });
                // TODO: Select this sprite
              } catch (e) {
                break;
              }

              console.log("blobl;, ", blob);
            }
          }
          break;
        }
        default:
        // console.log("key", e.key);
      }
    };

    window.addEventListener("keydown", onKeydown);
    return () => {
      window.removeEventListener("keydown", onKeydown);
    };
  }, [engineState, selection, setSelection, tiles]);
}
