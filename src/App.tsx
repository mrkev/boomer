import React, { useEffect, useRef, useState } from "react";

import "./App.css";
import { Tiles, EngineState, EngineObject, Text } from "./Engine";
import { EngineComponent, EngineMouseEvent } from "./EngineComponent";
import { useAtom } from "jotai";
import {
  cursorState,
  exhaustiveSwitch,
  modeState,
  selectionState,
} from "./AppState";
import { useAppMouseCursor } from "./useAppMouseCursor";
import { useAppKeyboardEvents } from "./useAppKeyboardEvents";
import { deserialize, doSave } from "./Document";
import { minSpanningRect, Rect } from "./Rect";
import { PropsEditor } from "./PropsEditor";
import { Button, ButtonGroup, Divider } from "@blueprintjs/core";
import { useLinkedState } from "./lib/LinkedState";
import { SidebarInspector } from "./SidebarInspector";

const CANVAS_SIZE: [number, number] = [300, 150];

export default function App() {
  const [selection, setSelection] = useLinkedState(selectionState);
  const [tiles, setTiles] = useState<Tiles | null>(null);
  const [engineState, setEngineState] = useState(new EngineState());
  const [mode, setMode] = useAtom(modeState);
  const [cursor, setCursor] = useLinkedState(cursorState);

  useAppMouseCursor(engineState, CANVAS_SIZE);
  useAppKeyboardEvents(engineState, tiles);

  useEffect(() => {
    async function loadTiles() {
      const tiles = await Tiles.from({ url: "/sprites.png", spriteSize: 32 });
      setTiles(tiles);
    }
    loadTiles();
  }, [engineState]);

  const selectSingleSprite = function (sprite: EngineObject | null) {
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
    const cursorState = cursor.state;

    switch (cursorState) {
      case "idle":
      case "moving":
      case "selecting":
      case "transforming":
        break;

      case "placing-text":
        // TODO: place text
        const text = new Text(x, y, "hello world");
        engineState.addEngineObject(text);
        setCursor({ state: "idle" });
        return;

      default:
        exhaustiveSwitch(cursorState);
    }

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

  useEffect(() => {
    if (localStorage.getItem("boomer-doc-exists")) {
      doLoad();
    }
  }, []);

  return (
    <>
      <div style={{ display: "flex", flexDirection: "row" }}>
        <ButtonGroup minimal>
          <Button small text="Boomer 0.0.1" disabled />
          <Button
            small
            icon="floppy-disk"
            text="Save"
            onClick={() => tiles && doSave(engineState, tiles)}
          />
          <Button
            small
            icon="document-open"
            text="Load"
            disabled={localStorage.getItem("boomer-doc-exists") == null}
            onClick={doLoad}
          />
          <Divider />
          <Button
            small
            intent={mode.state === "editing" ? "primary" : "danger"}
            icon={mode.state === "editing" ? "play" : "stop"}
            // text={mode.state === "running" ? "Running" : "Editing"}
            onClick={() => {
              if (mode.state === "editing") {
                setMode({ state: "running" });
              } else {
                setMode({ state: "editing" });
              }
            }}
          />
          <Divider />
          <Button
            small
            icon="new-text-box"
            // text={mode.state === "running" ? "Running" : "Editing"}
            onClick={() => {
              if (cursor.state !== "placing-text") {
                setCursor({ state: "placing-text" });
              } else {
                setCursor({ state: "idle" });
              }
            }}
          />
        </ButtonGroup>
      </div>
      <pre>Cursor: {JSON.stringify(cursor)}</pre>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flexGrow: 1,
          alignItems: "flex-start",
        }}
      >
        {/* <SplitPane
          resizerStyle={{
            minWidth: 3,
            background: "red",
            cursor: "ew-resize",
          }}
          split="vertical"
          step={50}
          minSize={200}
          maxSize={1000}
        > */}
        <div
          style={{
            position: "relative",
            border:
              mode.state === "running" ? "3px red solid" : "1px solid grey",
            marginLeft: 10,
            overflow: "hidden",
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

        <SidebarInspector
          engineState={engineState}
          selectSingleSprite={selectSingleSprite}
          tiles={tiles}
        />

        {/* </SplitPane> */}
      </div>
      <PropsEditor />
    </>
  );
}

function SelectionBox() {
  const [cursor] = useLinkedState(cursorState);

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
  const [cursor, setCursor] = useLinkedState(cursorState);
  // const eosRects = eos.map((eo) => [eo.x, eo.y, eo.width, eo.height] as Rect);
  // const minRect = minSpanningRect(eosRects);
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(
    function () {
      let raf = requestAnimationFrame(function transformBoxUpdate() {
        // const cursor = cursorState.__getLinkedValue();
        const eosRects = eos.map(
          (eo) => [eo.x, eo.y, eo.width, eo.height] as Rect
        );
        const minRect = minSpanningRect(eosRects);
        if (minRect === null) {
          return null;
        }

        const [x, y, width, height] = minRect;

        const div = divRef.current;
        if (div) {
          div.style.width = `${width * devicePixelRatio}px`;
          div.style.height = `${height * devicePixelRatio}px`;
          div.style.top = `${y * devicePixelRatio}px`;
          div.style.left = `${x * devicePixelRatio}px`;
        }

        raf = requestAnimationFrame(transformBoxUpdate);
      });

      return () => cancelAnimationFrame(raf);
    },
    [eos]
  );

  // if (minRect === null) {
  //   return null;
  // }

  // const [x, y, width, height] = minRect;

  return (
    <div
      ref={divRef}
      style={{
        position: "absolute",
        border: "3px dashed white",
        // width: width * devicePixelRatio,
        // height: height * devicePixelRatio,
        // top: y * devicePixelRatio,
        // left: x * devicePixelRatio,
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
