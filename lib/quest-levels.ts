// Isometric geometry and level data for the Birthday Quest puzzle game.
//
// The projection is deliberately tuned so that TILE_H is half TILE_W and the
// block depth equals one storey, which makes (x+1, y+1, z+1) project to the
// EXACT same screen pixel as (x, y, z). That ambiguity is the whole Escher
// trick: a tile two storeys up can sit precisely where a ground path appears to
// continue, and their top faces share an edge pixel for pixel.

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
export const depthOf = (v: Vec3) => v.x + v.y + v.z;

/** Exact world-cell identity. */
export const cellKey = (v: Vec3) => `${v.x},${v.y},${v.z}`;

/**
 * SCREEN identity — sx/32 and sy/16. Two cells with equal screenKey occupy the
 * identical pixels, which is exactly the (k,k,k) ambiguity the illusion runs on.
 * Rim light and railings must be culled against THIS, not against world
 * occupancy: an edge needs empty sky behind it, not empty space. Culling on
 * world occupancy leaves a bright 1px line drawn straight down an Escher seam,
 * which is the single most effective way to destroy the illusion.
 */
export const screenKey = (v: Vec3) => `${v.x - v.y},${v.x + v.y - 2 * v.z}`;

// ---------------------------------------------------------------- face space
// u,v in [0,1] over a face, returning raw screen points. Used for ornament that
// has to sit exactly on a face without transforms or non-scaling-stroke tricks.
const HW = TILE_W / 2; // 32
const HH = TILE_H / 2; // 16

/** Top face. u runs T->R (+x), v runs T->L (+y). */
export const fTop = (sx: number, sy: number, u: number, v: number) =>
  [sx + HW * (u - v), sy - HH + HH * (u + v)] as const;
/** +X face (the "right" wall). u runs B->R, v runs downward. */
export const fX = (sx: number, sy: number, u: number, v: number) =>
  [sx + HW * u, sy + HH - HH * u + TILE_Z * v] as const;
/** +Y face (the "left" wall). u runs B->L, v runs downward. */
export const fY = (sx: number, sy: number, u: number, v: number) =>
  [sx - HW * u, sy + HH - HH * u + TILE_Z * v] as const;

// ---------------------------------------------------------------- data model
export type MechState = {
  /** Quarter turns about the pivot's vertical axis. */
  rot?: number;
  /** Extra translation applied after rotation. */
  offset?: Vec3;
};

export type Mechanism = {
  id: string;
  /** Vertical axis the body turns about. */
  pivot: Vec3;
  states: MechState[];
  /** Node the hero must be standing on to work it. */
  control: string;
};

export type Node = {
  id: string;
  /** Rest position, i.e. the position in mechanism state 0. */
  pos: Vec3;
  mech?: string;
  goal?: boolean;
  /** Draws a crank here, driving the named mechanism. */
  crank?: string;
};

export type Edge = {
  a: string;
  b: string;
  when?: { mech: string; state: number };
  /** Flags an Escher join, so rim light and railings stay off the seam. */
  illusion?: boolean;
};

export type Prop = {
  pos: Vec3;
  tone?: "stone" | "shadow";
  /** Renders repeating masonry courses on the side faces. */
  stair?: boolean;
  /** Structural mass can ride a mechanism too, so a rotor is a body not a stick. */
  mech?: string;
};

export type Decor = {
  pos: Vec3;
  kind: "candle" | "lantern" | "fern" | "banner" | "cake" | "brazier" | "pennant";
};

export type Palette = {
  skyTop: string;
  skyMid: string;
  skyLow: string;
  glow: string;
  /** Top face: Hi is the bevel highlight, A/B the face, C the front chamfer. */
  topHi: string; topA: string; topB: string; topC: string;
  /** +Y wall: Hi the top-edge light, A/B the face, C the foot, D a course seam. */
  leftHi: string; leftA: string; leftB: string; leftC: string; leftD: string;
  /** +X wall, same roles. */
  rightHi: string; rightA: string; rightB: string; rightC: string; rightD: string;
  edge: string;
  accent: string;
  mote: string;
  stars: number;
  /** Distant silhouette drawn behind the monument. */
  skyline: string;
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

/**
 * Position of a cell belonging to a mechanism, in a given state. Rotation is
 * quarter turns about the pivot in the XY plane; z is untouched, which is what
 * lets a whole multi-storey body turn as one rigid piece.
 */
export function restPos(m: Mechanism, state: number, base: Vec3): Vec3 {
  const st = m.states[state] ?? m.states[0];
  const q = (((st.rot ?? 0) % 4) + 4) % 4;
  const o = st.offset;
  let dx = base.x - m.pivot.x;
  let dy = base.y - m.pivot.y;
  for (let i = 0; i < q; i++) {
    const t = dy;
    dy = -dx;
    dx = t;
  }
  return {
    x: m.pivot.x + dx + (o?.x ?? 0),
    y: m.pivot.y + dy + (o?.y ?? 0),
    z: base.z + (o?.z ?? 0),
  };
}

// ------------------------------------------------------------ mass authoring
// Levels were one-tile-wide ribbons of cubes, which is why no amount of
// per-block shading made them read as architecture. These build the plazas,
// plinths and buttresses that ornament needs something to sit on.
const slab = (x0: number, x1: number, y0: number, y1: number, z: number, tone?: Prop["tone"]): Prop[] => {
  const out: Prop[] = [];
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) out.push({ pos: { x, y, z }, tone });
  return out;
};
const col = (x: number, y: number, z0: number, z1: number, tone?: Prop["tone"], stair?: boolean): Prop[] => {
  const out: Prop[] = [];
  for (let z = z0; z <= z1; z++) out.push({ pos: { x, y, z }, tone, stair });
  return out;
};

// ------------------------------------------------------------------ palettes
const valley: Palette = {
  skyTop: "#122b3d", skyMid: "#2f6d6a", skyLow: "#f0bd76", glow: "#ffd98a",
  topHi: "#c9ecd8", topA: "#8fd3b4", topB: "#5fae90", topC: "#3f8a72",
  leftHi: "#4d9d88", leftA: "#2f7d6d", leftB: "#1f5a50", leftC: "#16443c", leftD: "#123a34",
  rightHi: "#2c6159", rightA: "#17453f", rightB: "#0e2f2c", rightC: "#0d2b27", rightD: "#0a2421",
  edge: "rgba(255,255,255,.38)", accent: "#ffd98a", mote: "#ffe9b0", stars: 40,
  skyline: "#0b2230",
};

const moon: Palette = {
  skyTop: "#070d29", skyMid: "#241a4f", skyLow: "#5b2f6b", glow: "#9ecbff",
  topHi: "#eef2ff", topA: "#c8d2f7", topB: "#98a6e0", topC: "#7b8ac9",
  leftHi: "#6f79c9", leftA: "#4d57ad", leftB: "#39418c", leftC: "#2e3572", leftD: "#272e63",
  rightHi: "#3d448a", rightA: "#272c66", rightB: "#191d4a", rightC: "#171b42", rightD: "#14173a",
  edge: "rgba(255,255,255,.42)", accent: "#ffd98a", mote: "#cfe2ff", stars: 190,
  skyline: "#131a44",
};

const house: Palette = {
  skyTop: "#25102e", skyMid: "#6b2440", skyLow: "#d1743f", glow: "#ffb457",
  topHi: "#fff1cd", topA: "#f6d69b", topB: "#dcae70", topC: "#c2914f",
  leftHi: "#c87e5c", leftA: "#a85f45", leftB: "#834635", leftC: "#6b3729", leftD: "#5e3024",
  rightHi: "#7e4740", rightA: "#5e2f2c", rightB: "#41201f", rightC: "#33191a", rightD: "#2c1517",
  edge: "rgba(255,255,255,.34)", accent: "#ffe1a0", mote: "#ffcf94", stars: 70,
  skyline: "#3a1830",
};

// ---------------------------------------------------------------- level one
// Teaches the three verbs: walk, walk-to-a-crank, turn the world. No illusion
// yet — the player has to trust the geometry before it is worth breaking.
const levelOne: Level = {
  id: "valley",
  name: "The Waking Valley",
  line: "The first candle is waiting past the broken path.",
  hint: "Walk to the golden crank to swing the bridge around.",
  palette: valley,
  start: "n0",
  mechanisms: [{ id: "bridge", pivot: { x: 3, y: 0, z: 0 }, control: "piv", states: [{ rot: 0 }, { rot: 1 }] }],
  nodes: [
    { id: "n0", pos: { x: 0, y: 0, z: 0 } },
    { id: "n1", pos: { x: 1, y: 0, z: 0 } },
    { id: "n2", pos: { x: 2, y: 0, z: 0 } },
    { id: "piv", pos: { x: 3, y: 0, z: 0 }, crank: "bridge" },
    { id: "br0", pos: { x: 3, y: 1, z: 0 }, mech: "bridge" },
    { id: "br1", pos: { x: 3, y: 2, z: 0 }, mech: "bridge" },
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
    // Stops at x=1: (2,1,-1) screen-aliases the bridge's rest tile (3,2,0),
    // which renders as a glitch rather than as architecture.
    ...slab(-1, 1, 1, 3, 0),        // terrace flanking the opening walk
    ...slab(-1, 1, 1, 3, -1),       // its plinth, so the plaza has real depth
    ...col(3, 0, -4, -1),           // the pivot drum, plunging into cloud
    ...col(3, 0, -6, -5, "shadow"), // and fading rather than ending
    ...slab(6, 8, 1, 3, 0),         // the far plinth
    ...slab(6, 8, 1, 3, -1),
    { pos: { x: 7, y: 0, z: 0 } },  // the goal's pedestal
    { pos: { x: 6, y: 0, z: -1 } },
    { pos: { x: 7, y: 0, z: -1 } },
    ...col(8, 0, -3, -1, "shadow"),
  ],
  decor: [
    { pos: { x: 7, y: 0, z: 1 }, kind: "candle" },
    { pos: { x: 0, y: 0, z: 0 }, kind: "lantern" },
    { pos: { x: -1, y: 1, z: 0 }, kind: "fern" },
    { pos: { x: 2, y: 3, z: 0 }, kind: "fern" },
    { pos: { x: 8, y: 3, z: 0 }, kind: "fern" },
    { pos: { x: 6, y: 1, z: 0 }, kind: "brazier" },
  ],
};

// ---------------------------------------------------------------- level two
// The reveal, and it must be EARNED. The ground path dies at a cliff. Swinging
// the arch puts its far tile at (4,0,0), and (7,2,2) — two storeys up on a
// tower that visibly falls into the void — projects exactly one screen step
// beyond it, so their top faces share an edge. Walking it reads as a step
// forward and is really a climb into the sky.
const levelTwo: Level = {
  id: "moon",
  name: "The Birthday Moon",
  line: "Nothing up here connects the way it looks. Trust your eyes anyway.",
  hint: "Swing the arch around — then walk straight off the edge.",
  palette: moon,
  start: "g0",
  mechanisms: [{ id: "arch", pivot: { x: 2, y: 0, z: 0 }, control: "gpiv", states: [{ rot: 0 }, { rot: 1 }] }],
  nodes: [
    { id: "g0", pos: { x: 0, y: 0, z: 0 } },
    { id: "g1", pos: { x: 1, y: 0, z: 0 } },
    { id: "gpiv", pos: { x: 2, y: 0, z: 0 }, crank: "arch" },
    { id: "am0", pos: { x: 2, y: 1, z: 0 }, mech: "arch" },
    { id: "am1", pos: { x: 2, y: 2, z: 0 }, mech: "arch" },
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
    ...slab(-1, 1, 1, 3, 0),          // start plaza
    // Plinth stops at x=0: (1,1,-1) screen-aliases the arch's rest tile (2,2,0).
    ...slab(-1, 0, 1, 3, -1),
    ...col(0, 0, -2, -1, "shadow"),
    ...col(2, 0, -3, -1),             // arch pivot drum
    // The tower sits DIRECTLY beneath the high walkway and falls away into
    // nothing. Putting this mass beside the walkway instead reads as a second
    // platform at the same height, which quietly destroys the illusion — the
    // player has to see that the far tiles are two storeys up.
    ...slab(7, 9, 2, 3, 1),
    ...slab(7, 9, 2, 3, 0),
    ...slab(7, 9, 2, 3, -1),
    ...col(7, 2, -3, -2, "shadow"),
    ...col(9, 2, -3, -2, "shadow"),
  ],
  decor: [
    { pos: { x: 9, y: 2, z: 2 }, kind: "candle" },
    { pos: { x: 0, y: 0, z: 0 }, kind: "lantern" },
    { pos: { x: 8, y: 2, z: 2 }, kind: "pennant" },
    { pos: { x: 7, y: 3, z: 1 }, kind: "brazier" },
    { pos: { x: -1, y: 3, z: 0 }, kind: "pennant" },
  ],
};

// -------------------------------------------------------------- level three
// Everything at once, and the cranks are now places rather than buttons: the
// gate's control sits back at the start, so the last illusion has to be walked
// to, crossed, and returned from.
const levelThree: Level = {
  id: "house",
  name: "The Candlelit House",
  line: "One cake. One last impossible step.",
  hint: "Two cranks, and a path that only exists from here.",
  palette: house,
  start: "a0",
  mechanisms: [
    { id: "gate", pivot: { x: 2, y: 0, z: 0 }, control: "bpiv", states: [{ rot: 0 }, { rot: 1 }] },
    { id: "spire", pivot: { x: 9, y: 0, z: 2 }, control: "cpiv", states: [{ rot: 0 }, { rot: 1 }] },
  ],
  nodes: [
    { id: "a0", pos: { x: 0, y: 0, z: 0 } },
    { id: "a1", pos: { x: 1, y: 0, z: 0 } },
    { id: "bpiv", pos: { x: 2, y: 0, z: 0 }, crank: "gate" },
    { id: "bg0", pos: { x: 2, y: 1, z: 0 }, mech: "gate" },
    { id: "bg1", pos: { x: 2, y: 2, z: 0 }, mech: "gate" },
    { id: "a2", pos: { x: 5, y: 0, z: 0 } },
    { id: "st0", pos: { x: 6, y: 0, z: 1 } },
    { id: "st1", pos: { x: 7, y: 0, z: 2 } },
    { id: "c0", pos: { x: 8, y: 0, z: 2 } },
    { id: "cpiv", pos: { x: 9, y: 0, z: 2 }, crank: "spire" },
    { id: "sp0", pos: { x: 9, y: 1, z: 2 }, mech: "spire" },
    { id: "sp1", pos: { x: 9, y: 2, z: 2 }, mech: "spire" },
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
    ...slab(-1, 1, 1, 3, 0),              // entry court
    // Plinth stops at x=0: (1,1,-1) screen-aliases the gate's rest tile (2,2,0).
    ...slab(-1, 0, 1, 3, -1),
    ...col(2, 0, -3, -1),                 // gate drum
    ...slab(5, 5, 1, 2, 0),
    ...col(5, 0, -2, -1),
    ...col(6, 0, -1, 0, undefined, true), // staircase flights, coursed masonry
    ...col(7, 0, -1, 1, undefined, true),
    // No column under (8,0,2): (8,0,1) screen-aliases the spire's rest tile
    // (9,1,2), so the arm would sit exactly on it and appear to spawn a block
    // when it swung away. c0 spans as a lintel instead, which suits the house.
    ...col(9, 0, 0, 1),
    ...slab(8, 9, 1, 2, 1),               // landing mass, kept a storey below the rotor
    ...slab(8, 9, 1, 2, 0),
    ...col(13, 1, 1, 2),                  // the house plinth
    ...col(15, 1, 1, 2),
    ...col(14, 1, 2, 2),
    ...slab(13, 15, 2, 3, 2),             // receding wing
    ...slab(13, 15, 2, 3, 1),
    ...col(13, 1, -1, 0, "shadow"),
    ...col(15, 1, 0, 0, "shadow"),
  ],
  decor: [
    { pos: { x: 15, y: 1, z: 3 }, kind: "cake" },
    { pos: { x: 0, y: 0, z: 0 }, kind: "lantern" },
    { pos: { x: 8, y: 0, z: 2 }, kind: "lantern" },
    { pos: { x: 14, y: 1, z: 3 }, kind: "pennant" },
    { pos: { x: 13, y: 3, z: 2 }, kind: "brazier" },
    { pos: { x: -1, y: 3, z: 0 }, kind: "pennant" },
    { pos: { x: 5, y: 2, z: 0 }, kind: "fern" },
  ],
};

export const levels: Level[] = [levelOne, levelTwo, levelThree];

/**
 * Dev-only geometry audit. An unintended screen alias between a walkable tile
 * and structural mass reads to a player as a rendering fault, and a block
 * sitting in a rotor's swept ring will visibly intersect it mid-turn. Both are
 * easy to author by accident and invisible until someone plays the level.
 */
export function auditLevel(level: Level): string[] {
  const problems: string[] = [];
  const seam = new Set(level.edges.filter((e) => e.illusion).flatMap((e) => [e.a, e.b]));

  const walkScreen = new Map<string, string>();
  for (const n of level.nodes) {
    const m = n.mech ? level.mechanisms.find((x) => x.id === n.mech) : undefined;
    const states = m ? m.states.map((_, i) => restPos(m, i, n.pos)) : [n.pos];
    states.forEach((p) => walkScreen.set(screenKey(p), n.id));
  }

  for (const p of level.props) {
    const hit = walkScreen.get(screenKey(p.pos));
    if (hit && !seam.has(hit)) {
      problems.push(`prop ${cellKey(p.pos)} screen-aliases walkable "${hit}"`);
    }
  }

  for (const m of level.mechanisms) {
    const swept = new Set<string>();
    const members = [
      ...level.nodes.filter((n) => n.mech === m.id).map((n) => n.pos),
      ...level.props.filter((p) => p.mech === m.id).map((p) => p.pos),
    ];
    members.forEach((b) => m.states.forEach((_, i) => swept.add(cellKey(restPos(m, i, b)))));
    for (const p of level.props) {
      if (p.mech === m.id) continue;
      if (swept.has(cellKey(p.pos))) problems.push(`prop ${cellKey(p.pos)} sits in "${m.id}" sweep`);
    }
  }

  const blocks = level.nodes.length + level.props.length;
  if (blocks > 90) problems.push(`${blocks} blocks exceeds the 90-block budget`);
  return problems;
}
