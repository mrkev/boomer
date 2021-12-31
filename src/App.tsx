import React, { useCallback, useEffect, useState } from "react";

import "./App.css";
import { Tiles, EngineState, Sprite, EngineObject } from "./Engine";
import { EngineComponent, EngineMouseEvent } from "./EngineComponent";
import { useAtom } from "jotai";
import { cursorState, modeState, selectionState } from "./AppState";
import { useAppMouseCursor } from "./useAppMouseCursor";
import { mapSet } from "./mapSet";
import { useAppKeyboardEvents } from "./useAppKeyboardEvents";
import { deserialize, Doc_V1, serializeDoc } from "./Document";
import { minSpanningRect, Rect } from "./Rect";
import { PropsEditor } from "./PropsEditor";

const CANVAS_SIZE: [number, number] = [300, 150];

export default function App() {
  const [selection, setSelection] = useAtom(selectionState);
  const [tiles, setTiles] = useState<Tiles | null>(null);
  const [engineState, setEngineState] = useState(new EngineState());
  const [mode, setMode] = useAtom(modeState);
  const [cursor, setCursor] = useAtom(cursorState);

  useAppMouseCursor(engineState, CANVAS_SIZE);
  useAppKeyboardEvents(engineState, tiles);

  const addRandomTile = useCallback(async () => {
    if (!tiles) {
      return;
    }
    const sprite = await tiles.genSprite((Math.random() * 100) >> 0);
    sprite.x = (Math.random() * 100) >> 0;
    sprite.y = (Math.random() * 100) >> 0;
    engineState.addSprite(sprite);
    (window as any).es = engineState;
  }, [engineState, tiles]);

  useEffect(() => {
    async function loadTiles() {
      const tiles = await Tiles.from({ url: "/sprites.png", spriteSize: 32 });
      setTiles(tiles);
      // const sprite = await tiles.genSprite((Math.random() * 100) >> 0);
      // sprite.x = (Math.random() * 100) >> 0;
      // sprite.y = (Math.random() * 100) >> 0;
      // engineState.addSprite(sprite);
      // console.log("HEREEE");
    }
    loadTiles();
  }, [engineState]);

  const selectSingleSprite = function (sprite: Sprite | null) {
    if (sprite) {
      setSelection({ state: "engine-object", eos: [sprite] });
    } else {
      setSelection({ state: "idle" });
    }
  };

  const engineMouseDown = function ({
    sprite,
    nativeEvent: ne,
    x,
    y,
  }: EngineMouseEvent) {
    selectSingleSprite(sprite);

    if (sprite) {
      setCursor({
        state: "moving",
        clientStart: [ne.clientX, ne.clientY],
        engineObjectTransforms: [{ eo: sprite, start: [sprite.x, sprite.y] }],
      });
    } else {
      setCursor({
        state: "selecting",
        canvasStart: [x, y],
        clientStart: [ne.clientX, ne.clientY],
        size: [0, 0],
      });
    }
  };

  const doSave = () => {
    if (!tiles) {
      return;
    }
    if (!confirm("This will override all data. Are you sure")) {
      console.log("NOT SAVING");
      return;
    }
    const doc = new Doc_V1({ engineState, tiles });
    const serialized = serializeDoc(doc);
    localStorage.setItem("boomer-doc", serialized);
    localStorage.setItem("boomer-doc-exists", "1");
  };

  const doLoad = () => {
    (async function run() {
      const str = localStorage.getItem("boomer-doc");
      if (!str) {
        return;
      }
      const doc = await deserialize(str);
      if (doc instanceof Error) {
        console.error(doc);
        return;
      }

      setTiles(doc.tiles);
      setEngineState(doc.engineState);
    })();
  };

  return (
    <div className="App">
      <div style={{ display: "flex", flexDirection: "row" }}>
        <button onClick={doSave}>Save</button>
        <button
          onClick={doLoad}
          disabled={localStorage.getItem("boomer-doc-exists") == null}
        >
          Load
        </button>
        <button
          onClick={() => {
            if (mode.state === "editing") {
              setMode({ state: "running" });
            } else {
              setMode({ state: "editing" });
            }
          }}
        >
          {mode.state === "running" ? "Running" : "Editing"}
        </button>
        <button onClick={() => addRandomTile()}>Add random tile</button>
      </div>
      <pre>{JSON.stringify(cursor)}</pre>

      <div style={{ display: "flex", flexDirection: "row" }}>
        <div
          style={{
            position: "relative",
            border:
              mode.state === "running" ? "3px red solid" : "1px solid grey",
            marginLeft: 10,
          }}
        >
          <EngineComponent
            size={CANVAS_SIZE}
            state={engineState}
            // todo: rename sprite to object
            onMouseDown={engineMouseDown}
            mode={mode.state}
          />
          {selection.state === "engine-object" && mode.state === "editing" && (
            <TransformBox engineObjects={selection.eos} />
          )}
          {cursor.state === "selecting" && <SelectionBox />}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
          }}
        >
          LAYERS
          <hr style={{ width: "100%" }}></hr>
          {mapSet(engineState.objects, (eo, i) => {
            if (!(eo instanceof Sprite)) {
              return;
            }

            const isSelected =
              selection.state === "engine-object" && selection.eos.includes(eo);

            return (
              <div
                key={i}
                style={{
                  background: isSelected ? "red" : undefined,
                  cursor: "pointer",
                }}
                onClick={() => {
                  selectSingleSprite(isSelected ? null : eo);
                }}
              >
                Sprite {i}
              </div>
            );
          })}
        </div>
      </div>
      {selection.state === "engine-object" && selection.eos.length === 1 && (
        <PropsEditor engineObject={selection.eos[0]} />
      )}
    </div>
  );
}

function SelectionBox() {
  const [cursor] = useAtom(cursorState);

  if (cursor.state !== "selecting") {
    return null;
  }

  let [width, height] = cursor.size;
  let [left, top] = cursor.canvasStart;
  if (width < 0) {
    [left, width] = [left + width, Math.abs(width)];
  }
  if (height < 0) {
    [top, height] = [top + height, Math.abs(height)];
  }

  return (
    <div
      style={{
        position: "absolute",
        border: "1px solid white",
        width: width * devicePixelRatio,
        height: height * devicePixelRatio,
        top: top * devicePixelRatio,
        left: left * devicePixelRatio,
        boxSizing: "border-box",
        background: "rgba(99, 99, 255, 0.5)",
      }}
    ></div>
  );
}

type TransformHandle = "tr" | "tl" | "br" | "bl";

function TransformBox({
  engineObjects: eos,
}: {
  engineObjects: Array<EngineObject>;
}) {
  const [cursor, setCursor] = useAtom(cursorState);
  const eosRects = eos.map((eo) => [eo.x, eo.y, eo.width, eo.height] as Rect);
  const minRect = minSpanningRect(eosRects);

  if (minRect === null) {
    return null;
  }

  const [x, y, width, height] = minRect;

  return (
    <div
      style={{
        position: "absolute",
        border: "3px dashed white",
        width: width * devicePixelRatio,
        height: height * devicePixelRatio,
        top: y * devicePixelRatio,
        left: x * devicePixelRatio,
        boxSizing: "border-box",
        background: "rgba(99, 99, 255, 0.5)",
        // grabbing is set on useAppMouseCursor
        cursor: cursor.state === "idle" ? "grab" : undefined,
      }}
      onMouseDown={(e: React.MouseEvent) =>
        setCursor({
          state: "moving",
          clientStart: [e.clientX, e.clientY],
          engineObjectTransforms: eos.map((eo) => ({
            eo,
            start: [eo.x, eo.y],
          })),
        })
      }
    >
      {(["tr", "tl", "br", "bl"] as TransformHandle[]).map((pos) => {
        const style: React.CSSProperties = {
          position: "absolute",
          background: "white",
          width: 10,
          height: 10,
          // pointerEvents: "none",
        };
        switch (pos) {
          case "tr":
            style.top = -3;
            style.right = -3;
            break;
          case "tl":
            style.top = -3;
            style.left = -3;
            break;
          case "br":
            style.bottom = -3;
            style.right = -3;
            break;
          case "bl":
            style.bottom = -3;
            style.left = -3;
            break;
          default:
            break;
        }
        return <div key={pos} style={style}></div>;
      })}
    </div>
  );
}
