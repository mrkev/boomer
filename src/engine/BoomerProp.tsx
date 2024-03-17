import { EngineObject } from "./EngineObject";
import { SpriteLocation } from "./Sprite";

export type BoomerPropSprite = Extract<BoomerProp<any>, { kind: "sprite" }>;

export type BoomerProp<EO extends EngineObject> =
  | Readonly<{
      kind: "string";
      key: keyof EO & string;
      set: (value: string) => string;
      get: () => string;
    }>
  | Readonly<{
      kind: "number";
      key: keyof EO & string;
      set: (value: number) => number;
      get: () => number;
    }>
  | Readonly<{
      kind: "string-option";
      key: keyof EO & string;
      set: (value: string | null) => string | null;
      get: () => string | null;
    }>
  | Readonly<{
      kind: "string-readonly";
      key: keyof EO & string;
      get: () => string;
    }>
  | Readonly<{
      kind: "sprite";
      key: keyof EO & string;
      get: () => SpriteLocation;
    }>
  | Readonly<{
      kind: "placeholder";
      key: keyof EO & string;
      get: () => string;
    }>;

export function stringRO<EO extends EngineObject>(
  eo: EO,
  key: keyof EO & string
): Extract<BoomerProp<EO>, { kind: "string-readonly" }> {
  return {
    kind: "string-readonly",
    key: key,
    get: () => eo[key] as any,
  };
}

export function stringOpt<EO extends EngineObject>(
  eo: EO,
  key: keyof EO & string
): Extract<BoomerProp<EO>, { kind: "string-option" }> {
  return {
    kind: "string-option",
    key: key,
    set: (value: string | null) => (eo[key] = value as any),
    get: () => eo[key] as any,
  };
}

export function string<EO extends EngineObject>(
  eo: EO,
  key: keyof EO & string
): BoomerProp<EO> {
  return {
    kind: "string",
    key: key,
    set: (value: string) => (eo[key] = value as any),
    get: () => eo[key] as any,
  };
}

export function number<EO extends EngineObject>(
  eo: EO,
  key: keyof EO & string
): BoomerProp<EO> {
  return {
    kind: "number",
    key: key,
    set: (value: number) => (eo[key] = value as any),
    get: () => eo[key] as any,
  };
}

export function sprite<EO extends EngineObject>(
  eo: EO,
  key: keyof EO & string
): BoomerProp<EO> {
  return {
    kind: "sprite",
    key: key,
    get: (): SpriteLocation => {
      return eo[key] as any;
    },
  };
}

export function placeholder<EO extends EngineObject>(
  eo: EO,
  key: keyof EO & string,
  value: string
): BoomerProp<EO> {
  return {
    kind: "placeholder",
    key: key,
    get: (): string => value,
  };
}
