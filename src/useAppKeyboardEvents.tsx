import { useEffect } from "react";
import { Camera, Sprite, Tiles } from "./Engine";
import { EngineState } from "./EngineState";
import { useAtom } from "jotai";
import { modeState, selectionState } from "./AppState";
import { doSave, hydrateFor } from "./Document";
import { useLinkedState } from "./lib/LinkedState";

export const pressedKeySet: Set<string> = new Set();

function getModifierKeyStrings(e: KeyboardEvent): string[] {
  const result = [];
  if (e.metaKey) {
    result.push("meta");
    if (e.location === KeyboardEvent.DOM_KEY_LOCATION_LEFT) {
      result.push("meta-left");
    }
    if (e.location === KeyboardEvent.DOM_KEY_LOCATION_LEFT) {
      result.push("meta-right");
    }
  }
  if (e.ctrlKey) {
    result.push("ctrl");
    if (e.location === KeyboardEvent.DOM_KEY_LOCATION_LEFT) {
      result.push("ctrl-left");
    }
    if (e.location === KeyboardEvent.DOM_KEY_LOCATION_LEFT) {
      result.push("ctrl-right");
    }
  }
  if (e.shiftKey) {
    result.push("shfit");
    if (e.location === KeyboardEvent.DOM_KEY_LOCATION_LEFT) {
      result.push("shift-left");
    }
    if (e.location === KeyboardEvent.DOM_KEY_LOCATION_LEFT) {
      result.push("shift-right");
    }
  }
  if (e.altKey) {
    result.push("alt");
    if (e.location === KeyboardEvent.DOM_KEY_LOCATION_LEFT) {
      result.push("alt-left");
    }
    if (e.location === KeyboardEvent.DOM_KEY_LOCATION_LEFT) {
      result.push("alt-right");
    }
  }
  return result;
}

export function useGlobalPressedKeySet() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      pressedKeySet.add(e.key);
      const modifiers = getModifierKeyStrings(e);
      for (const modifier of modifiers) {
        pressedKeySet.add(modifier);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      pressedKeySet.delete(e.key);
      const modifiers = getModifierKeyStrings(e);
      for (const modifier of modifiers) {
        pressedKeySet.delete(modifier);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return function () {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);
  return pressedKeySet;
}

export function useAppKeyboardEvents(
  engineState: EngineState,
  tiles: Tiles | null,
  editorCamera: Camera
) {
  const [selection, setSelection] = useLinkedState(selectionState);
  const [mode, setMode] = useLinkedState(modeState);

  useEffect(() => {
    const onKeydown = async function (e: KeyboardEvent) {
      const cmd =
        (navigator as any).userAgentData.platform === "macOS"
          ? e.metaKey
          : e.ctrlKey;

      // running
      if (mode.state === "running") {
        // TODO: keyboard global so onFrame one can check for pressed keys
        // instead of just running funcitons on keyboard events. Two different
        // apis to handle keyboard interactions. good idea? tbd.
        for (const eo of engineState.objects) {
          console.log("key", e.key);
          eo._proxyForScripting.triggerKeypress({ key: e.key });
        }
        e.preventDefault();
        return;
      }

      // skip when focusing text fields, etc
      if (document.activeElement !== document.body) {
        return;
      }

      // editing
      switch (e.key) {
        case "Backspace": {
          // console.log("BS", e.repeat);
          if (selection.state !== "engine-object") {
            break;
          }
          for (const eo of selection.eos) {
            engineState.removeEngineObject(eo);
            setSelection({ state: "idle" });
          }
          break;
        }
        case "Enter": {
          if (!cmd) {
            return;
          }

          setMode((prev) => {
            if (prev.state === "editing") {
              return { state: "running" };
            } else {
              // we don't even hit this big switch if
              // we're in 'running' mode actually
              return prev;
            }
          });
          break;
        }

        case "ArrowDown": {
          if (selection.state === "idle") {
            // move camera
            editorCamera.y -= 1;
            break;
          }

          if (selection.state !== "engine-object") {
            break;
          }

          for (const eo of selection.eos) {
            eo.y += 1;
          }

          break;
        }

        case "ArrowUp": {
          if (selection.state === "idle") {
            // move camera
            editorCamera.y += 1;
            break;
          }

          if (selection.state !== "engine-object") {
            break;
          }
          for (const eo of selection.eos) {
            eo.y -= 1;
          }
          break;
        }

        case "ArrowLeft": {
          if (selection.state === "idle") {
            // move camera
            editorCamera.x += 1;
            break;
          }

          if (selection.state !== "engine-object") {
            break;
          }

          for (const eo of selection.eos) {
            eo.x -= 1;
          }

          break;
        }

        case "ArrowRight": {
          if (selection.state === "idle") {
            // move camera
            editorCamera.x -= 1;
            break;
          }

          if (selection.state !== "engine-object") {
            break;
          }
          for (const eo of selection.eos) {
            eo.x += 1;
          }
          break;
        }

        case " ": {
          if (selection.state === "idle") {
            // move camera
            editorCamera.x = 0;
            editorCamera.y = 0;
            console.log(editorCamera);
            break;
          }

          break;
        }

        case "Escape": {
          if (selection.state !== "idle") {
            setSelection({ state: "idle" });
          }
          break;
        }

        case "s": {
          if (!cmd) {
            break;
          }

          if (!tiles) {
            break;
          }

          doSave(engineState, tiles);
          e.preventDefault();
          break;
        }

        case "c": {
          if (!cmd) {
            return;
          }
          if (
            selection.state === "engine-object" &&
            // TODO: Copy multiple items
            selection.eos[0] instanceof Sprite
          ) {
            const dataToCopy = [selection.eos[0].toClipboardData()];
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
                engineState.addEngineObject(sprite);
                setSelection({ state: "engine-object", eos: [sprite] });
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

    const onKeypress = function (e: KeyboardEvent) {};

    window.addEventListener("keydown", onKeydown);
    window.addEventListener("keypress", onKeypress);
    return () => {
      window.removeEventListener("keydown", onKeydown);
      window.removeEventListener("keypress", onKeypress);
    };
  }, [engineState, mode, selection, setSelection, tiles]);
}
