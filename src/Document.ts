import { EngineObject, EngineState, Sprite, Tiles } from "./Engine";

class Doc_V1 {
  engineState: EngineState;
  tiles: Tiles;
  constructor({
    engineState,
    tiles,
  }: {
    engineState: EngineState;
    tiles: Tiles;
  }) {
    this.engineState = engineState;
    this.tiles = tiles;
  }
  __getSerialRepresentation() {
    return {
      tiles: this.tiles,
      engineState: this.engineState,
    };
  }
}

export function serialize({
  engineState,
  tiles,
  pretty = false,
}: {
  engineState: EngineState;
  tiles: Tiles;
  pretty?: boolean;
}) {
  const doc = new Doc_V1({ engineState, tiles });

  return JSON.stringify(
    doc,
    (_, value) => {
      if (Array.isArray(value)) {
        return value;
      }
      if (!(value instanceof Object)) {
        return value;
      }
      if (value.constructor === Object) {
        return value;
      }
      // Objects that are not plain objects
      let result = { $type: value.constructor.name };
      if (typeof value.__getSerialRepresentation === "function") {
        result = Object.assign(result, value.__getSerialRepresentation());
      } else {
        console.warn("Can't serialize", value.constructor.name);
        return undefined;
        // result = Object.assign(result, value);
      }
      return result;
    },
    pretty ? 2 : undefined
  );
}

export async function deserialize(str: string): Promise<Doc_V1 | Error> {
  try {
    const json: any = JSON.parse(str);

    if (json.$type !== "Doc_V1") {
      throw new Error("invalid data type");
    }

    const result = await hydrateFor.Doc_V1(json);
    return result;
  } catch (e) {
    if (e instanceof Error) {
      return e;
    }
    return new Error(String(e));
  }
}

const hydrateFor = {
  Doc_V1: async (value: any): Promise<Doc_V1> => {
    const tiles = await hydrateFor.Tiles(value.tiles);
    const engineState = await hydrateFor.EngineState(value.engineState, tiles);
    return new Doc_V1({ engineState, tiles });
  },

  Tiles: async (value: any): Promise<Tiles> => {
    const { url, spriteSize } = value;
    const tiles = Tiles.from({ url, spriteSize });
    return tiles;
  },

  EngineState: async (value: any, tiles: Tiles): Promise<EngineState> => {
    const engineState = new EngineState();
    // TODO: hydrate tile maps first
    for (const obj of value.objects) {
      if (obj == null) {
        continue;
      }

      if (obj.$type !== "Sprite") {
        throw new Error(`Can't hydrate ${obj.$type}`);
      }

      const eo = await hydrateFor.Sprite(obj, tiles);
      assert(
        eo instanceof EngineObject,
        "Hydrated non-EngineObject as EngineObject"
      );
      engineState.addSprite(eo);
    }
    return engineState;
  },

  Sprite: async (value: any, tiles: Tiles): Promise<Sprite> => {
    const { x, y, width, height, imageUrl, _script } = value;
    const [url, numStr] = imageUrl.split("@");
    const num = parseInt(numStr);

    if (!tiles) {
      throw new Error(`No tilemap to reference for sprite: ${url}`);
    }

    if (tiles.url !== url) {
      throw new Error(`Unknown tilemap for sprite: ${url}`);
    }

    const sprite = await tiles.genSprite(num);
    sprite.x = x;
    sprite.y = y;
    sprite.width = width;
    sprite.height = height;
    sprite._script = _script;
    return sprite;
  },
} as const;

function assert(val: boolean, msg?: string) {
  if (!val) {
    throw new Error(msg || "Failed assertion");
  }
}
