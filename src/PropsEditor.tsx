import React, { RefObject, useEffect, useRef, useState } from "react";
import Editor, { BeforeMount, OnChange, OnMount } from "@monaco-editor/react";
import { EngineObject } from "./Engine";
import { editor } from "monaco-editor";
import {
  openObjectsState,
  selectionState,
  useAppSelectionState,
} from "./AppState";
import { NonIdealState, Tab, TabId, Tabs } from "@blueprintjs/core";
import { useLinkedState } from "./lib/LinkedState";

export const PropsEditor = React.memo(function PropsEditor() {
  const [selection, setEOSelection] = useAppSelectionState();
  const [openObjects] = useLinkedState(openObjectsState);
  const elRefs = useRef<Record<string, RefObject<HTMLInputElement>>>({});
  const [selectedTab, setSelectedTab] = useState<TabId>("layers");

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

  console.log("RETURNING HERe", selection);
  if (selection.state !== "engine-object") {
    return (
      <NonIdealState
        icon="select"
        title="Nothing selected"
        description="Select something to inspect"
      />
    );
  }

  if (selection.eos.length !== 1) {
    return (
      <NonIdealState icon="multi-select" title="Multiple objects selected" />
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
    // <SplitPane
    //   split="vertical"
    //   defaultSize="50%"
    //   resizerStyle={{
    //     background: "green",
    //     minWidth: "10px",
    //   }}
    // >
    <div
      style={{
        // background: "red",
        display: "flex",
        flexDirection: "row",
        width: "100%",
        height: "40vh",
      }}
    >
      <div style={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <Tabs
          id="LayersAndTiles"
          selectedTabId={selection.eos[0].id || ""}
          onChange={(id) => setSelectedTab(id)}
        >
          {[...openObjects].map(function (eo, i) {
            return <Tab id={eo.id || i} title={eo.id || "Object"}></Tab>;
          })}
          <Tab id="layers" title="Layers" />
          <Tab id="tiles" title="Tiles" />
        </Tabs>
        <div style={{ width: "100%", flexGrow: 1 }}>
          <CodeEditor engineObject={eo} />
        </div>
      </div>

      <table style={{ width: 200, alignSelf: "flex-start" }}>
        <tbody>{fields}</tbody>
      </table>
    </div>
    // </SplitPane>
  );
});

function CodeEditor({ engineObject: eo }: { engineObject: EngineObject }) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    if (!editorRef.current) {
      return;
    }

    editorRef.current.setValue(eo._script);
  }, [eo._script]);

  const handleEditorWillMount: BeforeMount = function (monaco) {
    monaco.languages.typescript.javascriptDefaults.addExtraLib(`
    declare const frame: {width: number, height: number};
    `);
  };

  const handleEditorDidMount: OnMount = function (editor) {
    // here is the editor instance
    // you can store it in `useRef` for further usage
    editorRef.current = editor;
  };

  const handleEditorChange: OnChange = (value) => {
    eo._script = value || "";
  };

  return (
    <Editor
      options={{ minimap: { enabled: false }, tabSize: 2, insertSpaces: true }}
      width="100%"
      theme="vs-dark"
      height="100%"
      defaultLanguage="javascript"
      defaultValue={eo._script}
      beforeMount={handleEditorWillMount}
      onMount={handleEditorDidMount}
      onChange={handleEditorChange}
    />
  );
}
