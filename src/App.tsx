import { Button, ButtonGroup, Divider } from "@blueprintjs/core";
import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import {
  cursorState,
  exhaustiveSwitch,
  modeState,
  useAppSelectionState,
} from "./AppState";
import { deserialize, doSave } from "./Document";
import { Tiles } from "./engine/Tiles";
import { Text } from "./engine/Text";
import { Box } from "./engine/Box";
import { Camera } from "./engine/Camera";
import { EngineObject } from "./engine/EngineObject";
import { EngineComponent, EngineMouseEvent } from "./EngineComponent";
import { EngineState } from "./EngineState";
import { PropsEditor } from "./props/PropsEditor";
import { Rect, minSpanningRect } from "./Rect";
import { SidebarInspector } from "./SidebarInspector";
import { useLinkedState } from "./lib/LinkedState";
import { useAppKeyboardEvents } from "./useAppKeyboardEvents";
import { useAppMouseCursor } from "./useAppMouseCursor";

const CANVAS_SIZE: [number, number] = [300, 200];
const CAMERA_SIZE: [number, number] = [300, 200];

export default function App() {
  const [selection, setEOSelection] = useAppSelectionState();
  const [tiles, setTiles] = useState<Tiles | null>(null);
  const [engineState, setEngineState] = useState(
    new EngineState(new Camera(0, 0, CAMERA_SIZE[0], CAMERA_SIZE[1]))
  );
  const [editorCamera] = useState(
    new Camera(0, 0, CAMERA_SIZE[0], CAMERA_SIZE[1])
  );
  const [mode, setMode] = useLinkedState(modeState);
  const [cursor, setCursor] = useLinkedState(cursorState);

  useEffect(() => {
    (window as any).boomer = {
      engineState,
      editorCamera,
    };
  }, [engineState, editorCamera]);

  useAppMouseCursor(engineState, CANVAS_SIZE);
  useAppKeyboardEvents(engineState, tiles, editorCamera);

  useEffect(() => {
    async function loadTiles() {
      const URL = "/sprites.png";
      const tiles = await Tiles.from({ url: URL, spriteSize: 32 });
      engineState.tilemaps.set(URL, tiles);
      setTiles(tiles);
    }
    loadTiles();
  }, [engineState]);

  const engineMouseDown = function ({
    sprite,
    nativeEvent: ne,
    x,
    y,
  }: EngineMouseEvent) {
    const cursorState = cursor.state;

    switch (cursorState) {
      case "idle":
      case "moving":
      case "selecting":
      case "transforming":
        break;

      case "placing-text":
        const text = new Text(x, y, "hello world");
        engineState.addEngineObject(text);
        setCursor({ state: "idle" });
        return;
      case "placing-box":
        const box = new Box({
          x,
          y,
          width: 20,
          height: 20,
        });
        engineState.addEngineObject(box);
        engineState.enablePhysicsForObject(box);
        setCursor({ state: "idle" });
        return;
      case "will-pan":
        setCursor({
          state: "moving",
          clientStart: [ne.clientX, ne.clientY],
          transformedEngineObjects: [
            { eo: editorCamera, start: [editorCamera.x, editorCamera.y] },
          ],
        });
        return;

      default:
        exhaustiveSwitch(cursorState);
    }

    if (sprite) {
      setEOSelection(sprite === null ? [] : [sprite]);
      setCursor({
        state: "moving",
        clientStart: [ne.clientX, ne.clientY],
        transformedEngineObjects: [{ eo: sprite, start: [sprite.x, sprite.y] }],
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

  const engineDoubleClick = (e: EngineMouseEvent) => {
    if (!(e.sprite instanceof Text)) {
      return;
    }

    console.log("TODO: edit text");
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
            active={
              cursor.state === "idle" ||
              cursor.state === "selecting" ||
              cursor.state === "moving"
            }
            icon="arrow-top-left"
            onClick={() => {
              if (cursor.state !== "idle") {
                setCursor({ state: "idle" });
              }
            }}
          />
          <Divider />
          <Button
            small
            active={cursor.state === "will-pan"}
            icon="hand"
            onClick={() => {
              if (cursor.state !== "will-pan") {
                setCursor({ state: "will-pan" });
              }
            }}
          />
          <Button
            small
            active={cursor.state === "placing-text"}
            icon="new-text-box"
            onClick={() => {
              if (cursor.state !== "placing-text") {
                setCursor({ state: "placing-text" });
              } else {
                setCursor({ state: "idle" });
              }
            }}
          />
          <Button
            small
            active={cursor.state === "placing-box"}
            icon="square"
            onClick={() => {
              if (cursor.state !== "placing-box") {
                setCursor({ state: "placing-box" });
              } else {
                setCursor({ state: "idle" });
              }
            }}
          />
        </ButtonGroup>
      </div>
      <pre>
        Cursor:{" "}
        {JSON.stringify(cursor, function (key, val) {
          if (!(val instanceof Object)) {
            return val;
          } else if (val.__getSerialRepresentation) {
            return val.__getSerialRepresentation();
          } else {
            return val;
          }
        })}
      </pre>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flexGrow: 1,
          alignItems: "stretch",
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
              mode.state === "running" ? "3px red solid" : "0px solid grey",
            // marginLeft: 10,
            overflow: "hidden",
            flexGrow: 1,
          }}
        >
          <EngineComponent
            size={CANVAS_SIZE}
            state={engineState}
            editorCamera={editorCamera}
            // todo: rename sprite to object
            onMouseDown={engineMouseDown}
            onDoubleClick={engineDoubleClick}
            mode={mode.state}
          />
          {selection.state === "engine-object" && mode.state === "editing" && (
            <TransformBox
              engineObjects={selection.eos}
              editorCamera={editorCamera}
            />
          )}
          {cursor.state === "selecting" && (
            <SelectionBox editorCamera={editorCamera} />
          )}
        </div>

        <SidebarInspector engineState={engineState} tiles={tiles} />

        {/* </SplitPane> */}
      </div>
      <PropsEditor engineState={engineState} />
    </>
  );
}

function SelectionBox({ editorCamera }: { editorCamera: Camera }) {
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
        top: (top + editorCamera.y) * devicePixelRatio,
        left: (left + editorCamera.x) * devicePixelRatio,
        boxSizing: "border-box",
        background: "rgba(99, 99, 255, 0.5)",
      }}
    ></div>
  );
}

type TransformHandle = "tr" | "tl" | "br" | "bl";

function TransformBox({
  engineObjects: eos,
  editorCamera,
}: {
  engineObjects: Array<EngineObject>;
  editorCamera: Camera;
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

        const [xo, yo, width, height] = minRect;
        const x = xo + editorCamera.x;
        const y = yo + editorCamera.y;

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
          transformedEngineObjects: eos.map((eo) => ({
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
