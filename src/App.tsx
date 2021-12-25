import React, { useCallback, useEffect, useRef, useState } from "react";
import Editor, { OnChange, OnMount } from "@monaco-editor/react";

import "./App.css";
import {
  Tiles,
  EngineState,
  Sprite,
  Box,
  EngineObject,
  dispatchClickEvent,
} from "./Engine";
import { EngineComponent, EngineMouseEvent } from "./EngineComponent";
import { useAtom } from "jotai";
import {
  cursorState,
  modeState,
  selectionState,
  useAppMouseCursor,
} from "./AppState";
import { mapSet } from "./mapSet";
import { useAppKeyboardEvents } from "./useAppKeyboardEvents";

export default function App() {
  const [selection, setSelection] = useAtom(selectionState);
  const [tiles, setTiles] = useState<Tiles | null>(null);
  const [engineState] = useState(new EngineState());
  const [mode, setMode] = useAtom(modeState);
  const [cursorBox] = useState(() => {
    const box = new Box({ width: 10, height: 10 });
    engineState.addSprite(box);
    return box;
  });
  const [cursor, setCursor] = useAtom(cursorState);

  useAppMouseCursor();
  useAppKeyboardEvents(engineState);

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
      console.log("SET TILES");
      const sprite = await tiles.genSprite((Math.random() * 100) >> 0);
      sprite.x = (Math.random() * 100) >> 0;
      sprite.y = (Math.random() * 100) >> 0;
      engineState.addSprite(sprite);
    }
    loadTiles();
  }, [engineState]);

  const selectSprite = function (sprite: Sprite | null) {
    if (mode.state === "running") {
      sprite && dispatchClickEvent(engineState, sprite);
      return;
    }
    // addRandomTile();
    // console.log(sprite);
    if (sprite) {
      setSelection({ state: "engine-object", eo: sprite });
    } else {
      setSelection({ state: "idle" });
    }
  };

  const engineMouseDown = function ({
    sprite,
    nativeEvent: ne,
  }: EngineMouseEvent) {
    if (!tiles) {
      return;
    }

    selectSprite(sprite);

    if (sprite) {
      setCursor({
        state: "moving",
        eoStart: [sprite.x, sprite.y],
        clientStart: [ne.clientX, ne.clientY],
        engineObject: sprite,
      });
    }
  };

  return (
    <div className="App">
      <div style={{ display: "flex", flexDirection: "row" }}>
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
        <pre>{JSON.stringify(cursor)}</pre>
      </div>

      <div style={{ display: "flex", flexDirection: "row" }}>
        <div
          style={{
            position: "relative",
            border: mode.state === "running" ? "3px red solid" : undefined,
          }}
        >
          <EngineComponent
            state={engineState}
            // todo: rename sprite to object
            onMouseDown={engineMouseDown}
            onMouseMove={function ({ x, y }) {
              cursorBox.x = x;
              cursorBox.y = y;
            }}
            mode={mode.state}
          />
          {selection.state === "engine-object" && mode.state === "editing" && (
            <TransformBox engineObject={selection.eo} />
          )}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          LAYERS
          <hr style={{ width: "100%" }}></hr>
          {mapSet(engineState.objects, (eo, i) => {
            if (!(eo instanceof Sprite)) {
              return;
            }

            const isSelected =
              selection.state === "engine-object" && selection.eo === eo;

            return (
              <div
                key={i}
                style={{
                  background: isSelected ? "red" : undefined,
                  cursor: "pointer",
                }}
                onClick={() => {
                  selectSprite(isSelected ? null : eo);
                }}
              >
                Sprite {i}
              </div>
            );
          })}
        </div>
      </div>
      {selection.state === "engine-object" && (
        <PropsEditor engineObject={selection.eo} />
      )}
    </div>
  );
}

type TransformHandle = "tr" | "tl" | "br" | "bl";

function TransformBox({ engineObject: eo }: { engineObject: EngineObject }) {
  const [cursor, setCursor] = useAtom(cursorState);

  useEffect(function () {
    return function () {};
  }, []);

  const startResize = (handle: "tr" | "tl" | "br" | "bl") => {
    console.log("MOUSE DOWN");
    setCursor({ state: "transforming", engineObject: eo });
  };

  return (
    <div
      style={{
        position: "absolute",
        border: "3px dashed white",
        width: eo.width * devicePixelRatio,
        height: eo.height * devicePixelRatio,
        top: eo.y * devicePixelRatio,
        left: eo.x * devicePixelRatio,
        boxSizing: "border-box",
        background: "rgba(99, 99, 255, 0.5)",
        // grabbing is set on useAppMouseCursor
        cursor: cursor.state === "idle" ? "grab" : undefined,
      }}
      onMouseDown={(e: React.MouseEvent) =>
        setCursor({
          state: "moving",
          eoStart: [eo.x, eo.y],
          clientStart: [e.clientX, e.clientY],
          engineObject: eo,
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
        return (
          <div
            key={pos}
            style={style}
            onMouseDown={(e: React.MouseEvent) => {
              e.stopPropagation();
              startResize(pos);
            }}
          ></div>
        );
      })}
    </div>
  );
}

function PropsEditor({ engineObject: eo }: { engineObject: EngineObject }) {
  return (
    <div style={{ display: "flex", flexDirection: "row" }}>
      <CodeEditor engineObject={eo} />
      <pre>
        {eo.constructor.name} {JSON.stringify(eo, null, 2)}
      </pre>
    </div>
  );
}

function CodeEditor({ engineObject: eo }: { engineObject: EngineObject }) {
  const editorRef = useRef(null);

  const handleEditorDidMount: OnMount = function (editor, monaco) {
    // here is the editor instance
    // you can store it in `useRef` for further usage
    editorRef.current = editor;
  };

  const handleEditorChange: OnChange = (value, event) => {
    eo._script = value || "";
  };

  return (
    <Editor
      height="90vh"
      defaultLanguage="javascript"
      defaultValue={eo._script}
      onMount={handleEditorDidMount}
      onChange={handleEditorChange}
    />
  );
}

/**



this.addEventListener(function () {
  this.

})


 */
