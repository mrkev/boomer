import { EngineObject } from "./Engine";
import { atom } from "jotai";
import { LinkedState, useLinkedState } from "./lib/LinkedState";
import { useCallback } from "react";
import OrderedSet from "./lib/OrderedSet";

type DraftTransform = {
  eo: EngineObject;
  start: [number, number];
};

type CursorState =
  | { state: "idle" }
  | { state: "transforming"; engineObject: EngineObject }
  | {
      state: "moving";
      clientStart: [number, number];
      transformedEngineObjects: Array<DraftTransform>;
    }
  | {
      state: "selecting";
      canvasStart: [number, number];
      clientStart: [number, number];
      size: [number, number];
    }
  | {
      state: "placing-text";
    }
  | {
      state: "placing-box";
    }
  | {
      state: "will-pan";
    };

export const cursorState = LinkedState.of<CursorState>({
  state: "idle",
});

export type SelectionState =
  | { state: "idle" }
  | { state: "engine-object"; eos: Array<EngineObject> };

export const selectionState = LinkedState.of<SelectionState>({
  state: "idle",
});

// TODO: only scriptable objects?
export const openObjectsState = LinkedState.of<OrderedSet<EngineObject>>(
  new OrderedSet<EngineObject>()
);

export function useAppSelectionState(): [
  SelectionState,
  (value: Array<EngineObject>) => void
] {
  const [selection, _setSelection] = useLinkedState(selectionState);
  const setEOSelection = useCallback(
    function (newSelection: Array<EngineObject>) {
      switch (newSelection.length) {
        case 0:
          _setSelection({ state: "idle" });
          break;
        case 1:
          openObjectsState.__getLinkedValue().add(newSelection[0]);
          _setSelection({ state: "engine-object", eos: newSelection });
          break;
        default:
          _setSelection({ state: "engine-object", eos: newSelection });
          break;
      }
    },
    [_setSelection]
  );

  return [selection, setEOSelection];
}

type ModeState = { state: "editing" } | { state: "running" };
export const modeState = LinkedState.of<ModeState>({
  state: "editing",
});

export function exhaustiveSwitch(x: never): never {
  throw new Error("non-exhaustive: " + String(x));
}
