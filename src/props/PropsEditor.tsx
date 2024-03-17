import React, { RefObject, useRef, useState } from "react";
import { EngineObject } from "../engine/EngineObject";
import { openObjectsState, useAppSelectionState } from "../AppState";
import { Button, NonIdealState, Tab, TabId, Tabs } from "@blueprintjs/core";
import { useLinkedState } from "../lib/LinkedState";
import { CodeEditor } from "./CodeEditor";

export const PropsEditor = React.memo(function PropsEditor() {
  const [selection] = useAppSelectionState();
  const [openObjects] = useLinkedState(openObjectsState);
  const elRefs = useRef<Record<string, RefObject<HTMLInputElement>>>({});
  const [_selectedTab, setSelectedTab] = useState<TabId>("layers");

  // const t2Ref = useRef<HTMLTableSectionElement | null>(null);
  const [_, update] = useState({});

  // const arrLength = Object.keys(eo).length;
  // if (Object.keys(elRefs.current).length !== arrLength) {
  //   // add or remove refs
  //   for (const key in eo) {
  //     // fields starting with "_" are not shown by default
  //     if (key[0] === "_") {
  //       continue;
  //     }
  //     elRefs.current[key] = createRef();
  //   }
  // }

  if (selection.state !== "engine-object") {
    return (
      <div style={{ height: 300, flexGrow: 0 }}>
        <NonIdealState
          icon="select"
          title="Nothing selected"
          description="Select something to inspect"
        />
      </div>
    );
  }

  if (selection.eos.length !== 1) {
    return (
      <div style={{ height: 300, flexGrow: 0 }}>
        <NonIdealState icon="multi-select" title="Multiple objects selected" />
      </div>
    );
  }

  const eo = selection.eos[0];

  const fields = [];
  // Using the proxy establishes that if it's editable it's scriptable,
  // but might want to special case id? Or are ids scriptable? could it
  // be useful if dynamically adding objects?
  // const proxy = eo._proxyForScripting;
  const src = eo;
  for (const key in src) {
    // fields starting with "_" are hidden by default
    if (key[0] === "_") {
      continue;
    }

    const value = src[key as keyof EngineObject];

    let display = null;

    if (typeof value === "number") {
      display = (
        <input
          ref={elRefs.current[key]}
          type="number"
          value={value}
          onChange={(e) => {
            const num = parseFloat(e.target.value);
            (src as any)[key] = num;
            update({});
          }}
        />
      );
    } else if (key === "id") {
      display = (
        <input
          ref={elRefs.current[key]}
          type="text"
          placeholder="unidentified"
          value={src.id || ""}
          onChange={(e) => {
            src.id = e.target.value;
            update({});
          }}
        />
      );
    } else {
      display = (
        <input
          ref={elRefs.current[key]}
          type={"text"}
          value={value instanceof Object ? "<Object>" : JSON.stringify(value)}
          disabled
        ></input>
      );
    }

    fields.push(
      <tr key={key}>
        <td>{key}</td>
        <td>{display}</td>
      </tr>
    );
  }

  // useEffect(
  //   function () {
  //     const table = t2Ref.current;
  //     if (table == null) {
  //       return;
  //     }
  //     const input = document.createElement("input");
  //     input.setAttribute("type", "text");
  //     input.setAttribute("value", "asdf");
  //     input.addEventListener("input", function (e: any) {
  //       console.log(e.target.value);
  //     });
  //     table.appendChild(input);
  //   },
  //   [eo]
  // );

  return (
    <div
      style={{
        // background: "red",
        display: "flex",
        flexDirection: "row",
        height: 300,
        flexGrow: 0,
      }}
    >
      <table style={{ width: 200, alignSelf: "flex-start" }}>
        <tbody>
          {fields}
          <tr key={"actions"}>
            <td>behaviour</td>
            <td>
              <Button small icon="code" text="Edit" active />
            </td>
          </tr>
        </tbody>
      </table>
      <div style={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <Tabs
          id="LayersAndTiles"
          selectedTabId={selection.eos[0].id || ""}
          onChange={(id) => setSelectedTab(id)}
        >
          {[...openObjects].map(function (eo, i) {
            return (
              <Tab
                key={eo.id || i}
                id={eo.id || i}
                title={eo.id || "Object"}
              ></Tab>
            );
          })}
          <Tab key="layers" id="layers" title="Layers" />
          <Tab key="tiles" id="tiles" title="Tiles" />
        </Tabs>
        <div style={{ width: "100%", flexGrow: 1 }}>
          <CodeEditor engineObject={eo} />
        </div>
      </div>
    </div>
  );
});