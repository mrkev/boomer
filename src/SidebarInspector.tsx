import React, { useCallback, useMemo, useState } from "react";
import { Tiles, EngineState, Sprite } from "./Engine";
import {
  SelectionState,
  selectionState,
  useAppSelectionState,
} from "./AppState";
import { mapSet } from "./mapSet";
import { Tab, Tabs, TabId, useHotkeys } from "@blueprintjs/core";
import { useLinkedState } from "./lib/LinkedState";

function useSidebarInspectorHotkeys(engineState: EngineState) {
  // important: hotkeys array must be memoized to avoid infinitely re-binding hotkeys
  const hotkeys = useMemo(
    () => [
      {
        combo: "down",
        label: "Select next sprite",
        group: "layer-list",
        onKeyDown: () => {
          const selection = selectionState.__getLinkedValue();
          if (selection.state !== "engine-object") {
            return;
          }

          const lastSelectedItem = selection.eos[selection.eos.length - 1];
          const indexOfItem = engineState.objects.indexOf(lastSelectedItem);
          if (indexOfItem < 0 || indexOfItem + 1 >= engineState.objects.size) {
            return;
          }

          selectionState.__setLinkedValue({
            state: "engine-object",
            eos: [engineState.objects.get(indexOfItem + 1)],
          });
        },
      },
      {
        combo: "up",
        label: "Select previous sprite",
        group: "layer-list",
        onKeyDown: () => {
          const selection = selectionState.__getLinkedValue();
          if (selection.state !== "engine-object") {
            return;
          }

          const firstSelectedItem = selection.eos[0];
          const indexOfItem = engineState.objects.indexOf(firstSelectedItem);
          if (indexOfItem < 0 || indexOfItem <= 0) {
            return;
          }

          selectionState.__setLinkedValue({
            state: "engine-object",
            eos: [engineState.objects.get(indexOfItem - 1)],
          });
        },
      },
    ],
    [engineState]
  );

  return useHotkeys(hotkeys);
}

export function SidebarInspector({
  engineState,
  tiles,
}: {
  engineState: EngineState;
  tiles: Tiles | null;
}) {
  const [selectedTab, setSelectedTab] = useState<TabId>("layers");
  const [selection, setEOSelection] = useAppSelectionState();

  const { handleKeyDown, handleKeyUp } =
    useSidebarInspectorHotkeys(engineState);

  const addRandomTile = useCallback(async () => {
    if (!tiles) {
      return;
    }
    const sprite = await tiles.genSprite((Math.random() * 100) >> 0);
    sprite.x = (Math.random() * 100) >> 0;
    sprite.y = (Math.random() * 100) >> 0;
    engineState.addEngineObject(sprite);
    (window as any).es = engineState;
  }, [engineState, tiles]);

  return (
    <div style={{ flexGrow: 1, padding: "0px 8px" }}>
      <Tabs
        id="LayersAndTiles"
        selectedTabId={selectedTab}
        onChange={(id) => setSelectedTab(id)}
      >
        <Tab
          id="layers"
          title="Layers"
          panel={
            <div
              tabIndex={0}
              onKeyDown={handleKeyDown}
              onKeyUp={handleKeyUp}
              style={{
                display: "flex",
                flexDirection: "column",
                flexGrow: 1,
              }}
            >
              {mapSet(engineState.objects, (eo, i) => {
                if (!(eo instanceof Sprite)) {
                  return;
                }

                const isSelected =
                  selection.state === "engine-object" &&
                  selection.eos.includes(eo);

                return (
                  <div
                    key={i}
                    style={{
                      background: isSelected ? "red" : undefined,
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      setEOSelection(isSelected ? [] : [eo]);
                    }}
                  >
                    {eo.id ? eo.id : `<Sprite ${i}>`}
                  </div>
                );
              })}
              <button onClick={() => addRandomTile()}>Add random tile</button>
            </div>
          }
        />
        <Tab id="tiles" title="Tiles" panel={<div />} />
      </Tabs>
    </div>
  );
}
