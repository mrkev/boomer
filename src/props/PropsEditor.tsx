import { Button, NonIdealState, Tab, TabId, Tabs } from "@blueprintjs/core";
import React, { useState } from "react";
import {
  exhaustiveSwitch,
  openObjectsState,
  useAppSelectionState,
} from "../AppState";
import { EngineObject } from "../engine/EngineObject";
import { useLinkedState } from "../lib/LinkedState";
import { CodeEditor } from "./CodeEditor";
import { EngineState } from "../EngineState";
import { SpriteEditor } from "./SpriteEditor";

type Subeditor = { kind: "code" } | { kind: "sprite"; editingKey: string };

export const PropsEditor = React.memo(function PropsEditor({
  engineState,
}: {
  engineState: EngineState;
}) {
  const [selection] = useAppSelectionState();
  const [openObjects] = useLinkedState(openObjectsState);
  const [_selectedTab, setSelectedTab] = useState<TabId>("layers");
  const [selectedSubeditor, setSelectedSubeditor] = useState<Subeditor>({
    kind: "code",
  });

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

  const fields = getFieldEditors(
    eo,
    update,
    selectedSubeditor,
    setSelectedSubeditor
  );

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
              <Button
                small
                icon="code"
                text="Edit"
                active={selectedSubeditor.kind === "code"}
                onClick={() => setSelectedSubeditor({ kind: "code" })}
              />
            </td>
          </tr>
        </tbody>
      </table>

      {/* <Tabs
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
        </Tabs> */}
      {/* <div style={{ width: "100%", flexGrow: 1 }}> */}
      {selectedSubeditor.kind === "code" && <CodeEditor engineObject={eo} />}
      {selectedSubeditor.kind === "sprite" && (
        <SpriteEditor
          engineObject={eo}
          editingKey={selectedSubeditor.editingKey}
          engineState={engineState}
        />
      )}
      {/* </div> */}
    </div>
  );
});

function getFieldEditors(
  eo: EngineObject,
  update: (v: any) => void,
  activeSubeditor: Subeditor,
  selectSubeditor: (subeditor: Subeditor) => void
) {
  return eo.visibleProps.map((prop) => {
    switch (prop.kind) {
      case "number": {
        const display = (
          <input
            type="number"
            value={prop.get()}
            onChange={(e) => {
              const num = parseFloat(e.target.value);
              prop.set(num);
              update({});
            }}
          />
        );
        return (
          <tr key={prop.key}>
            <td>{prop.key}</td>
            <td>{display}</td>
          </tr>
        );
      }
      case "string-option": {
        const display = (
          <input
            type="text"
            placeholder="unidentified"
            value={prop.get() ?? ""}
            onChange={(e) => {
              prop.set(e.target.value);
              update({});
            }}
          />
        );
        return (
          <tr key={prop.key}>
            <td>{prop.key}</td>
            <td>{display}</td>
          </tr>
        );
      }
      case "string": {
        const display = (
          <input
            type="text"
            value={prop.get()}
            onChange={(e) => {
              prop.set(e.target.value);
              update({});
            }}
          />
        );
        return (
          <tr key={prop.key}>
            <td>{prop.key}</td>
            <td>{display}</td>
          </tr>
        );
      }
      case "string-readonly": {
        const display = <input type="text" value={prop.get()} disabled />;
        return (
          <tr key={prop.key}>
            <td>{prop.key}</td>
            <td>{display}</td>
          </tr>
        );
      }
      case "sprite": {
        const display = (
          <Button
            small
            icon="clip"
            text="Sprite..."
            onClick={() =>
              selectSubeditor({ kind: "sprite", editingKey: prop.key })
            }
            active={
              activeSubeditor.kind === "sprite" &&
              activeSubeditor.editingKey === prop.key
            }
          />
        );
        return (
          <tr key={prop.key}>
            <td>{prop.key}</td>
            <td>{display}</td>
          </tr>
        );
      }
      case "placeholder": {
        const display = <input type="text" value={prop.get()} disabled />;
        return (
          <tr key={prop.key}>
            <td>{prop.key}</td>
            <td>{display}</td>
          </tr>
        );
      }
      default:
        exhaustiveSwitch(prop);
    }
  });
}
