import { EngineObject } from "./Engine";
import { atom } from "jotai";

type CursorState =
  | { state: "idle" }
  | { state: "transforming"; engineObject: EngineObject }
  | {
      state: "moving";
      eoStart: [number, number];
      clientStart: [number, number];
      engineObject: EngineObject;
    }
  | {
      state: "selecting";
      canvasStart: [number, number];
      clientStart: [number, number];
      size: [number, number];
    };

export const cursorState = atom<CursorState>({
  state: "idle",
});

type SelectionState =
  | { state: "idle" }
  | { state: "engine-object"; eo: EngineObject }
  | { state: "engine-objects"; eos: Array<EngineObject> };

export const selectionState = atom<SelectionState>({
  state: "idle",
});

type ModeState = { state: "editing" } | { state: "running" };
export const modeState = atom<ModeState>({
  state: "editing",
});

export function exhaustiveSwitch(x: never): never {
  throw new Error("non-exhaustive: " + String(x));
}
