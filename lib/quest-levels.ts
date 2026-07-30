// Isometric geometry for the Birthday Quest puzzle game.
//
// The projection is deliberately tuned so that TILE_H is half TILE_W and the
// block depth equals TILE_W/2 * 2 — which makes (x+1, y+1, z+1) project to the
// EXACT same screen pixel as (x, y, z). That ambiguity is the whole Escher
// trick: a tile two storeys up can sit precisely where the ground path appears
// to continue, so the hero walks a connection that cannot exist in real space.
// Levels two and three each hang a puzzle on it.

export const TILE_W = 64; // full width of a tile's top face
export const TILE_H = 32; // full height (depth) of the top face rhombus
export const TILE_Z = 32; // one storey — must equal TILE_H for the illusion

export type Vec3 = { x: number; y: number; z: number };

export function project(v: Vec3) {
  return {
    sx: (v.x - v.y) * (TILE_W / 2),
    sy: (v.x + v.y) * (TILE_H / 2) - v.z * TILE_Z,
  };
}

// Painter's order. Higher sums sit nearer the viewer and draw last.
export function depthOf(v: Vec3) {
  return v.x + v.y + v.z;
}

export type Node = {
  id: string;
  pos: Vec3;
  /** Belongs to a mechanism; `states` then gives one position per state. */
  mech?: string;
  states?: Vec3[];
  goal?: boolean;
  /** Draws a crank on this tile. Clicking it drives the named mechanism. */
  crank?: string;
};

export type Edge = {
  a: string;
  b: string;
  /** Edge only walkable while the mechanism sits in this state. */
  when?: { mech: string; state: number };
  /** Marks the connection as an Escher link, for the flourish on arrival. */
  illusion?: boolean;
};

export type Mechanism = { id: string; states: number };

export type Prop = {
  pos: Vec3;
  /** Purely structural blocks — drawn, never walked on. */
  tone?: "stone" | "shadow";
};

export type Decor = {
  pos: Vec3;
  kind: "candle" | "lantern" | "fern" | "banner" | "cake";
};

export type Palette = {
  skyTop: string;
  skyMid: string;
  skyLow: string;
  glow: string;
  topA: string;
  topB: string;
  leftA: string;
  leftB: string;
  rightA: string;
  rightB: string;
  edge: string;
  accent: string;
  mote: string;
  stars: number;
};

export type Level = {
  id: string;
  name: string;
  line: string;
  hint: string;
  palette: Palette;
  nodes: Node[];
  edges: Edge[];
  mechanisms: Mechanism[];
  props: Prop[];
  decor: Decor[];
  start: string;
};

const valley: Palette = {
  skyTop: "#122b3d",
  skyMid: "#2f6d6a",
  skyLow: "#f0bd76",
  glow: "#ffd98a",
  topA: "#8fd3b4",
  topB: "#5fae90",
  leftA: "#2f7d6d",
  leftB: "#1f5a50",
  rightA: "#17453f",
  rightB: "#0e2f2c",
  edge: "rgba(255,255,255,.38)",
  accent: "#ffd98a",
  mote: "#ffe9b0",
  stars: 40,
};

const moon: Palette = {
  skyTop: "#070d29",
  skyMid: "#241a4f",
  skyLow: "#5b2f6b",
  glow: "#9ecbff",
  topA: "#c8d2f7",
  topB: "#98a6e0",
  leftA: "#4d57ad",
  leftB: "#39418c",
  rightA: "#272c66",
  rightB: "#191d4a",
  edge: "rgba(255,255,255,.42)",
  accent: "#ffd98a",
  mote: "#cfe2ff",
  stars: 190,
};

const house: Palette = {
  skyTop: "#25102e",
  skyMid: "#6b2440",
  skyLow: "#d1743f",
  glow: "#ffb457",
  topA: "#f6d69b",
  topB: "#dcae70",
  leftA: "#a85f45",
  leftB: "#834635",
  rightA: "#5e2f2c",
  rightB: "#41201f",
  edge: "rgba(255,255,255,.34)",
  accent: "#ffe1a0",
  mote: "#ffcf94",
  stars: 70,
};

// ---------------------------------------------------------------- level one
// Teaches the two verbs: tap a tile to walk, tap a crank to turn the world.
// No illusion yet — the player needs to trust the geometry before we break it.
const levelOne: Level = {
  id: "valley",
  name: "The Waking Valley",
  line: "The first candle is waiting past the broken path.",
  hint: "Tap the golden crank to swing the bridge around.",
  palette: valley,
  start: "n0",
  mechanisms: [{ id: "bridge", states: 2 }],
  nodes: [
    { id: "n0", pos: { x: 0, y: 0, z: 0 } },
    { id: "n1", pos: { x: 1, y: 0, z: 0 } },
    { id: "n2", pos: { x: 2, y: 0, z: 0 } },
    { id: "piv", pos: { x: 3, y: 0, z: 0 }, crank: "bridge" },
    {
      id: "br0",
      pos: { x: 3, y: 1, z: 0 },
      mech: "bridge",
      states: [
        { x: 3, y: 1, z: 0 },
        { x: 4, y: 0, z: 0 },
      ],
    },
    {
      id: "br1",
      pos: { x: 3, y: 2, z: 0 },
      mech: "bridge",
      states: [
        { x: 3, y: 2, z: 0 },
        { x: 5, y: 0, z: 0 },
      ],
    },
    { id: "n3", pos: { x: 6, y: 0, z: 0 } },
    { id: "goal", pos: { x: 7, y: 0, z: 1 }, goal: true },
  ],
  edges: [
    { a: "n0", b: "n1" },
    { a: "n1", b: "n2" },
    { a: "n2", b: "piv" },
    { a: "piv", b: "br0", when: { mech: "bridge", state: 1 } },
    { a: "br0", b: "br1" },
    { a: "br1", b: "n3", when: { mech: "bridge", state: 1 } },
    { a: "n3", b: "goal" },
  ],
  props: [
    { pos: { x: 7, y: 0, z: 0 } },
    { pos: { x: 0, y: 1, z: -1 }, tone: "shadow" },
    { pos: { x: 1, y: 1, z: -1 }, tone: "shadow" },
    { pos: { x: 6, y: 1, z: -1 }, tone: "shadow" },
    { pos: { x: 7, y: 1, z: -1 }, tone: "shadow" },
  ],
  decor: [
    { pos: { x: 7, y: 0, z: 1 }, kind: "candle" },
    { pos: { x: 0, y: 0, z: 0 }, kind: "fern" },
    { pos: { x: 6, y: 0, z: 0 }, kind: "fern" },
    { pos: { x: 2, y: 0, z: 0 }, kind: "lantern" },
  ],
};

// ---------------------------------------------------------------- level two
// The reveal, and it has to be EARNED rather than given. The ground path dies
// at a cliff. Swinging the arch puts its far tile at (4,0,0) — and (7,2,2),
// which is two storeys up on a tower that plunges into the void, projects to
// exactly one screen-step beyond it. Their top faces share an edge pixel for
// pixel, so the walk reads as a step forward and is really a climb into the sky.
// Gating this behind the crank is the whole point: an illusion nobody notices
// happening is not an illusion.
const levelTwo: Level = {
  id: "moon",
  name: "The Birthday Moon",
  line: "Nothing up here connects the way it looks. Trust your eyes anyway.",
  hint: "Swing the arch around — then walk straight off the edge.",
  palette: moon,
  start: "g0",
  mechanisms: [{ id: "arch", states: 2 }],
  nodes: [
    { id: "g0", pos: { x: 0, y: 0, z: 0 } },
    { id: "g1", pos: { x: 1, y: 0, z: 0 } },
    { id: "gpiv", pos: { x: 2, y: 0, z: 0 }, crank: "arch" },
    {
      id: "am0",
      pos: { x: 2, y: 1, z: 0 },
      mech: "arch",
      states: [
        { x: 2, y: 1, z: 0 },
        { x: 3, y: 0, z: 0 },
      ],
    },
    {
      id: "am1",
      pos: { x: 2, y: 2, z: 0 },
      mech: "arch",
      states: [
        { x: 2, y: 2, z: 0 },
        { x: 4, y: 0, z: 0 },
      ],
    },
    { id: "h0", pos: { x: 7, y: 2, z: 2 } },
    { id: "h1", pos: { x: 8, y: 2, z: 2 } },
    { id: "goal", pos: { x: 9, y: 2, z: 2 }, goal: true },
  ],
  edges: [
    { a: "g0", b: "g1" },
    { a: "g1", b: "gpiv" },
    { a: "gpiv", b: "am0", when: { mech: "arch", state: 1 } },
    { a: "am0", b: "am1" },
    { a: "am1", b: "h0", when: { mech: "arch", state: 1 }, illusion: true },
    { a: "h0", b: "h1" },
    { a: "h1", b: "goal" },
  ],
  props: [
    // A tower that visibly falls away into nothing — the cue that the tile the
    // hero steps onto is nowhere near the ground they left.
    { pos: { x: 7, y: 2, z: 1 } },
    { pos: { x: 7, y: 2, z: 0 } },
    { pos: { x: 7, y: 2, z: -1 }, tone: "shadow" },
    { pos: { x: 7, y: 2, z: -2 }, tone: "shadow" },
    { pos: { x: 9, y: 2, z: 1 } },
    { pos: { x: 9, y: 2, z: 0 }, tone: "shadow" },
    { pos: { x: 0, y: 0, z: -1 }, tone: "shadow" },
    { pos: { x: 1, y: 0, z: -1 }, tone: "shadow" },
  ],
  decor: [
    { pos: { x: 9, y: 2, z: 2 }, kind: "candle" },
    { pos: { x: 0, y: 0, z: 0 }, kind: "lantern" },
    { pos: { x: 8, y: 2, z: 2 }, kind: "banner" },
  ],
};

// -------------------------------------------------------------- level three
// Everything at once: a swing bridge to cross, a staircase to climb, a second
// arm to align, and a final illusion from (11,0,2) to (13,1,3).
const levelThree: Level = {
  id: "house",
  name: "The Candlelit House",
  line: "One cake. One last impossible step.",
  hint: "Two cranks, and a path that only exists from here.",
  palette: house,
  start: "a0",
  mechanisms: [
    { id: "gate", states: 2 },
    { id: "spire", states: 2 },
  ],
  nodes: [
    { id: "a0", pos: { x: 0, y: 0, z: 0 } },
    { id: "a1", pos: { x: 1, y: 0, z: 0 } },
    { id: "bpiv", pos: { x: 2, y: 0, z: 0 }, crank: "gate" },
    {
      id: "bg0",
      pos: { x: 2, y: 1, z: 0 },
      mech: "gate",
      states: [
        { x: 2, y: 1, z: 0 },
        { x: 3, y: 0, z: 0 },
      ],
    },
    {
      id: "bg1",
      pos: { x: 2, y: 2, z: 0 },
      mech: "gate",
      states: [
        { x: 2, y: 2, z: 0 },
        { x: 4, y: 0, z: 0 },
      ],
    },
    { id: "a2", pos: { x: 5, y: 0, z: 0 } },
    { id: "st0", pos: { x: 6, y: 0, z: 1 } },
    { id: "st1", pos: { x: 7, y: 0, z: 2 } },
    { id: "c0", pos: { x: 8, y: 0, z: 2 } },
    { id: "cpiv", pos: { x: 9, y: 0, z: 2 }, crank: "spire" },
    {
      id: "sp0",
      pos: { x: 9, y: 1, z: 2 },
      mech: "spire",
      states: [
        { x: 9, y: 1, z: 2 },
        { x: 10, y: 0, z: 2 },
      ],
    },
    {
      id: "sp1",
      pos: { x: 9, y: 2, z: 2 },
      mech: "spire",
      states: [
        { x: 9, y: 2, z: 2 },
        { x: 11, y: 0, z: 2 },
      ],
    },
    { id: "d0", pos: { x: 13, y: 1, z: 3 } },
    { id: "d1", pos: { x: 14, y: 1, z: 3 } },
    { id: "goal", pos: { x: 15, y: 1, z: 3 }, goal: true },
  ],
  edges: [
    { a: "a0", b: "a1" },
    { a: "a1", b: "bpiv" },
    { a: "bpiv", b: "bg0", when: { mech: "gate", state: 1 } },
    { a: "bg0", b: "bg1" },
    { a: "bg1", b: "a2", when: { mech: "gate", state: 1 } },
    { a: "a2", b: "st0" },
    { a: "st0", b: "st1" },
    { a: "st1", b: "c0" },
    { a: "c0", b: "cpiv" },
    { a: "cpiv", b: "sp0", when: { mech: "spire", state: 1 } },
    { a: "sp0", b: "sp1" },
    { a: "sp1", b: "d0", when: { mech: "spire", state: 1 }, illusion: true },
    { a: "d0", b: "d1" },
    { a: "d1", b: "goal" },
  ],
  props: [
    { pos: { x: 7, y: 0, z: 1 } },
    { pos: { x: 7, y: 0, z: 0 }, tone: "shadow" },
    { pos: { x: 8, y: 0, z: 1 } },
    { pos: { x: 9, y: 0, z: 1 } },
    { pos: { x: 9, y: 0, z: 0 }, tone: "shadow" },
    { pos: { x: 13, y: 1, z: 2 } },
    { pos: { x: 13, y: 1, z: 1 } },
    { pos: { x: 13, y: 1, z: 0 }, tone: "shadow" },
    { pos: { x: 15, y: 1, z: 2 } },
    { pos: { x: 15, y: 1, z: 1 }, tone: "shadow" },
    { pos: { x: 0, y: 0, z: -1 }, tone: "shadow" },
    { pos: { x: 1, y: 0, z: -1 }, tone: "shadow" },
  ],
  decor: [
    { pos: { x: 15, y: 1, z: 3 }, kind: "cake" },
    { pos: { x: 0, y: 0, z: 0 }, kind: "lantern" },
    { pos: { x: 8, y: 0, z: 2 }, kind: "lantern" },
    { pos: { x: 14, y: 1, z: 3 }, kind: "banner" },
  ],
};

export const levels: Level[] = [levelOne, levelTwo, levelThree];
