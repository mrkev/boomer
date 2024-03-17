import React from "react";
import { EngineObject } from "../engine/EngineObject";
import { SpriteLocation } from "../engine/Sprite";
import { EngineState } from "../EngineState";
import { nullthrows } from "../assert";

export function SpriteEditor({
  engineObject,
  editingKey,
  engineState,
}: {
  engineObject: EngineObject;
  editingKey: string;
  engineState: EngineState;
}) {
  const editing = (engineObject as any)[editingKey];
  if (editing.kind !== "SpriteLocation") {
    return <div>TODO NOT AVAILABLE NOT A SPRITE</div>;
  }

  const spriteLocation = editing as SpriteLocation;

  const tiles = engineState.tilemaps.get(spriteLocation.tilesUrl);
  if (tiles == null) {
    return <div>NON IDEAL STATE TILEMAP NOT FOUND</div>;
  }

  // const cols = this.img.width / this.spriteSize;
  const srcX = (spriteLocation.num * tiles.spriteSize) % tiles.img.width;
  // const rows = this.img.height / this.spriteSize;
  const srcY =
    Math.floor((spriteLocation.num * tiles.spriteSize) / tiles.img.width) *
    tiles.spriteSize;

  function onImageClick(e: React.MouseEvent<HTMLImageElement>) {
    const bounds = (
      e.nativeEvent.target as HTMLImageElement
    ).getBoundingClientRect();
    const x = e.nativeEvent.clientX - bounds.left;
    const y = e.nativeEvent.clientY - bounds.top;

    const totalCols = Math.floor(
      nullthrows(tiles).img.width / nullthrows(tiles).spriteSize
    );

    const col = Math.floor(x / nullthrows(tiles).spriteSize);
    const row = Math.floor(y / nullthrows(tiles).spriteSize);
    const num = row * totalCols + col;

    spriteLocation.num = num;
    // const srcY =
    //   Math.floor((spriteLocation.num * tiles.spriteSize) / tiles.img.width) *
    //   tiles.spriteSize;
  }

  return (
    <>
      {spriteLocation.tilesUrl} {spriteLocation.num}
      <div style={{ overflow: "scroll", position: "relative" }}>
        <img
          src={tiles.url}
          onClick={onImageClick}
          style={{
            filter: "brightness(50%)",
            // width: "100%"
          }}
        ></img>
        <div
          style={{
            pointerEvents: "none",
            userSelect: "none",
            position: "absolute",
            width: tiles.spriteSize,
            height: tiles.spriteSize,
            border: "3px solid red",
            top: srcY,
            left: srcX,
            backdropFilter: "brightness(200%)",
          }}
        ></div>
      </div>
    </>
  );
}
