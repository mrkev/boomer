import { EngineObject } from "./Engine";
import { atom } from "jotai";
import { LinkedState } from "./lib/LinkedState";

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
      engineObjectTransforms: Array<DraftTransform>;
    }
  | {
      state: "selecting";
      canvasStart: [number, number];
      clientStart: [number, number];
      size: [number, number];
    }
  | {
      state: "placing-text";
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

type ModeState = { state: "editing" } | { state: "running" };
export const modeState = atom<ModeState>({
  state: "editing",
});

export function exhaustiveSwitch(x: never): never {
  throw new Error("non-exhaustive: " + String(x));
}
