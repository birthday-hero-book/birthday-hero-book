"use client";

import Link from "next/link";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  TILE_H,
  TILE_W,
  TILE_Z,
  auditLevel,
  cellKey,
  depthOf,
  fTop,
  fX,
  fY,
  levels,
  project,
  restPos,
  screenKey,
  type Decor,
  type Level,
  type Mechanism,
  type Node,
  type Palette,
  type Vec3,
} from "@/lib/quest-levels";

const WALK_MS = 300;
const TURN_MS = 640;
const HW = TILE_W / 2;
const HH = TILE_H / 2;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Deterministic pseudo-random so the starfield never shifts between renders. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const pts = (...p: (readonly [number, number])[]) => p.map(([x, y]) => `${x},${y}`).join(" ");

// ---------------------------------------------------------------- the block
// Hoisted to module scope and memoised. Declaring these inside the render body
// changes their function identity every frame, so React unmounts and remounts
// the entire monument on every animation frame — roughly eighteen times per
// walk step. Every prop here is a primitive so the memo comparison stays cheap.
type BlockProps = {
  sx: number;
  sy: number;
  dim?: boolean;
  faded?: boolean;
  cullTop?: boolean;
  cullX?: boolean;
  cullY?: boolean;
  rimNX?: boolean;
  rimNY?: boolean;
  xGrad: string;
  yGrad: string;
  aoNX?: boolean;
  aoNY?: boolean;
  rim: string;
};

const Block = memo(function Block({
  sx, sy, dim, faded, cullTop, cullX, cullY, rimNX, rimNY, xGrad, yGrad, aoNX, aoNY, rim,
}: BlockProps) {
  const o = faded ? 0.4 : dim ? 0.5 : 1;
  // The bevel: an outer rhombus in a vertical ramp, then the face rhombus
  // scaled to 0.86 and lifted 1.2px. Pure scaling insets every edge by 2.0px;
  // the lift thins the two upper chamfers to a hairline of light and thickens
  // the two lower ones into a shadowed front edge — a cut-stone read from two
  // polygons rather than five.
  const K = 0.86;
  const DY = 1.2;
  return (
    <>
      {!cullY && (
        <polygon
          points={pts([sx - HW, sy], [sx, sy + HH], [sx, sy + HH + TILE_Z], [sx - HW, sy + TILE_Z])}
          fill={`url(#${dim ? "dY" : yGrad})`}
          opacity={o}
        />
      )}
      {!cullX && (
        <polygon
          points={pts([sx, sy + HH], [sx + HW, sy], [sx + HW, sy + TILE_Z], [sx, sy + HH + TILE_Z])}
          fill={`url(#${dim ? "dX" : xGrad})`}
          opacity={o}
        />
      )}
      {!cullTop && (
        <>
          <polygon
            points={pts([sx, sy - HH], [sx + HW, sy], [sx, sy + HH], [sx - HW, sy])}
            fill="url(#bevel)"
            opacity={o}
          />
          <polygon
            points={pts(
              [sx, sy - HH * K - DY], [sx + HW * K, sy - DY],
              [sx, sy + HH * K - DY], [sx - HW * K, sy - DY],
            )}
            fill={`url(#${dim ? "dTop" : "top"})`}
            opacity={o}
          />
          {aoNX && (
            <polygon
              points={pts(fTop(sx, sy, 0, 1), fTop(sx, sy, 0, 0), fTop(sx, sy, 0.17, 0), fTop(sx, sy, 0.17, 1))}
              fill="url(#aoNX)"
            />
          )}
          {aoNY && (
            <polygon
              points={pts(fTop(sx, sy, 0, 0), fTop(sx, sy, 1, 0), fTop(sx, sy, 1, 0.17), fTop(sx, sy, 0, 0.17))}
              fill="url(#aoNY)"
            />
          )}
          {rimNX && (
            <path d={`M${sx - HW},${sy}L${sx},${sy - HH}`} stroke={rim} strokeOpacity=".55" strokeWidth="1.5" fill="none" />
          )}
          {rimNY && (
            <path d={`M${sx},${sy - HH}L${sx + HW},${sy}`} stroke={rim} strokeOpacity=".3" strokeWidth="1.3" fill="none" />
          )}
        </>
      )}
    </>
  );
});

// ---------------------------------------------------------------- decoration
const DecorItem = memo(function DecorItem({ item, p, lit }: { item: Decor; p: Palette; lit: boolean }) {
  const { sx, sy } = project(item.pos);
  const top = sy - HH;

  if (item.kind === "fern") {
    return (
      <g opacity="0.92">
        {[-15, -6, 4, 14].map((dx, i) => (
          <path
            key={i}
            d={`M${sx + dx},${top + 5} q ${dx / 2},-19 ${dx / 1.15},-32`}
            stroke={i % 2 ? p.topB : p.leftHi}
            strokeWidth="3.2"
            fill="none"
            strokeLinecap="round"
            opacity="0.8"
          />
        ))}
      </g>
    );
  }

  if (item.kind === "banner" || item.kind === "pennant") {
    const n = item.kind === "pennant" ? 5 : 4;
    return (
      <g className="q-sway" style={{ transformOrigin: `${sx}px ${top - 44}px` }}>
        <path d={`M${sx - 30},${top - 46} Q ${sx},${top - 26} ${sx + 30},${top - 46}`} stroke={p.accent} strokeWidth="1.6" fill="none" opacity="0.7" />
        {Array.from({ length: n }, (_, i) => {
          const dx = -22 + (44 / (n - 1)) * i;
          const dip = top - 42 + (1 - Math.abs(dx) / 26) * 13;
          return (
            <polygon
              key={i}
              points={`${sx + dx - 5.5},${dip} ${sx + dx + 5.5},${dip} ${sx + dx},${dip + 13}`}
              fill={i % 2 ? p.accent : p.topA}
              opacity="0.95"
            />
          );
        })}
      </g>
    );
  }

  if (item.kind === "lantern") {
    const hang = top - 36;
    return (
      <g>
        <circle cx={sx} cy={hang} r="30" fill="url(#bloom)" />
        <line x1={sx} y1={top + 2} x2={sx} y2={hang - 7} stroke={p.rightD} strokeWidth="2.2" opacity="0.85" />
        <g className="q-flicker" style={{ transformOrigin: `${sx}px ${hang - 7}px` }}>
          <ellipse cx={sx} cy={hang} rx="9" ry="11" fill={p.accent} opacity="0.95" />
          <ellipse cx={sx} cy={hang} rx="4" ry="7" fill="#fff6de" opacity="0.9" />
          <line x1={sx - 9} y1={hang} x2={sx + 9} y2={hang} stroke={p.rightD} strokeWidth="0.9" opacity="0.35" />
        </g>
      </g>
    );
  }

  if (item.kind === "brazier") {
    return (
      <g>
        <circle cx={sx} cy={top - 26} r="26" fill="url(#bloom)" />
        <path d={`M${sx - 11},${top - 14} L${sx + 11},${top - 14} L${sx + 7},${top - 2} L${sx - 7},${top - 2} Z`} fill={p.rightA} />
        <ellipse cx={sx} cy={top - 14} rx="11" ry="4" fill={p.rightHi} />
        <g className="q-flame">
          <ellipse cx={sx} cy={top - 23} rx="6.5" ry="10" fill={p.accent} />
          <ellipse cx={sx} cy={top - 21} rx="3" ry="6" fill="#fff8e2" />
        </g>
      </g>
    );
  }

  const isCake = item.kind === "cake";
  const baseY = top - (isCake ? 6 : 2);
  return (
    <g>
      <circle cx={sx} cy={baseY - 40} r={isCake ? 58 : 36} fill="url(#bloom)" opacity={lit ? 1 : 0.45} className="q-glow" />
      {isCake && (
        <>
          <ellipse cx={sx} cy={baseY - 6} rx="31" ry="11" fill={p.topB} />
          <rect x={sx - 31} y={baseY - 25} width="62" height="20" fill={p.topA} />
          <ellipse cx={sx} cy={baseY - 25} rx="31" ry="11" fill={p.topHi} />
          {[-19, -6.5, 6.5, 19].map((dx, i) => (
            <path key={i} d={`M${sx + dx - 5},${baseY - 27} q5,-6 10,0`} stroke={p.accent} strokeWidth="1.8" fill="none" opacity="0.75" />
          ))}
        </>
      )}
      <rect x={sx - (isCake ? 4 : 5)} y={baseY - (isCake ? 52 : 34)} width={isCake ? 8 : 10} height={isCake ? 29 : 32} rx="3" fill="#fdf3dc" />
      <g className={lit ? "q-flame" : "q-flame q-flame--out"}>
        <ellipse cx={sx} cy={baseY - (isCake ? 60 : 40)} rx="6.5" ry="11.5" fill={p.accent} />
        <ellipse cx={sx} cy={baseY - (isCake ? 58 : 38)} rx="2.8" ry="6" fill="#fff8e2" />
      </g>
    </g>
  );
});

// -------------------------------------------------------------------- crank
const Crank = memo(function Crank({
  sx, sy, angle, accent, active, onUse,
}: { sx: number; sy: number; angle: number; accent: string; active: boolean; onUse: () => void }) {
  const cy = sy - 30;
  return (
    <g
      className={`q-crank${active ? "" : " q-crank--idle"}`}
      onClick={(e) => { e.stopPropagation(); onUse(); }}
      role="button"
      tabIndex={active ? 0 : -1}
      aria-label="Turn the mechanism"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onUse(); }
      }}
    >
      <circle cx={sx} cy={cy} r="28" fill={accent} opacity="0.11" className={active ? "q-pulse" : undefined} />
      <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: `${sx}px ${cy}px` }}>
        <circle cx={sx} cy={cy} r="13" fill="none" stroke={accent} strokeWidth="3.2" />
        {[0, 90, 180, 270].map((a) => {
          const r = (a * Math.PI) / 180;
          return (
            <line
              key={a}
              x1={sx + Math.cos(r) * 13} y1={cy + Math.sin(r) * 13}
              x2={sx + Math.cos(r) * 21} y2={cy + Math.sin(r) * 21}
              stroke={accent} strokeWidth="3.2" strokeLinecap="round"
            />
          );
        })}
        <circle cx={sx} cy={cy} r="4.2" fill={accent} />
      </g>
    </g>
  );
});

// ==========================================================================
type Turning = { mech: string; from: number; to: number; t: number } | null;

export function BirthdayQuest() {
  const [stage, setStage] = useState<"intro" | "play" | "done">("intro");
  const [nameInput, setNameInput] = useState("");
  const [hero, setHero] = useState("");
  const [levelIndex, setLevelIndex] = useState(0);
  const [mech, setMech] = useState<Record<string, number>>({});
  const [turning, setTurning] = useState<Turning>(null);
  const [heroNode, setHeroNode] = useState("");
  const [heroPos, setHeroPos] = useState<Vec3>({ x: 0, y: 0, z: 0 });
  const [busy, setBusy] = useState(false);
  const [lit, setLit] = useState(false);
  const [flash, setFlash] = useState(false);
  const [facing, setFacing] = useState(1);
  const raf = useRef<number | null>(null);
  const shell = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 1280, h: 720 });

  const level: Level = levels[levelIndex];
  const p = level.palette;

  useEffect(() => {
    const el = shell.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => {
      const r = entry.contentRect;
      if (r.width > 0 && r.height > 0) setBox({ w: Math.round(r.width), h: Math.round(r.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current); }, []);

  const nodeById = useMemo(() => new Map(level.nodes.map((n) => [n.id, n])), [level]);
  const mechById = useMemo(() => new Map(level.mechanisms.map((m) => [m.id, m])), [level]);

  // Audits every level, not just the current one — a geometry fault in the last
  // chapter should not wait until someone reaches the last chapter.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    let clean = true;
    levels.forEach((lv) => {
      const problems = auditLevel(lv);
      if (problems.length) { clean = false; console.warn(`[quest] ${lv.id}:`, problems.join(" | ")); }
    });
    const sizes = levels.map((lv) => `${lv.id} ${lv.nodes.length + lv.props.length}`).join(", ");
    if (clean) console.info(`[quest] geometry audit clean — blocks: ${sizes}`);
  }, []);

  const loadLevel = useCallback((index: number) => {
    const lv = levels[index];
    const start: Record<string, number> = {};
    lv.mechanisms.forEach((m) => (start[m.id] = 0));
    setMech(start);
    setTurning(null);
    setHeroNode(lv.start);
    setHeroPos(lv.nodes.find((n) => n.id === lv.start)!.pos);
    setLit(false);
    setBusy(false);
    setFacing(1);
  }, []);

  useEffect(() => { if (stage === "play") loadLevel(levelIndex); }, [stage, levelIndex, loadLevel]);

  /** Settled position of any cell — mid-turn bodies are drawn by the rotor group. */
  const settled = useCallback(
    (base: Vec3, mechId?: string): Vec3 => {
      if (!mechId) return base;
      const m = mechById.get(mechId);
      return m ? restPos(m, mech[mechId] ?? 0, base) : base;
    },
    [mechById, mech],
  );

  const posOf = useCallback(
    (id: string): Vec3 => {
      const n = nodeById.get(id);
      if (!n) return { x: 0, y: 0, z: 0 };
      if (!n.mech) return n.pos;
      const m = mechById.get(n.mech)!;
      if (turning && turning.mech === n.mech) {
        const a = restPos(m, turning.from, n.pos);
        const b = restPos(m, turning.to, n.pos);
        const e = ease(turning.t);
        return { x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e), z: lerp(a.z, b.z, e) };
      }
      return restPos(m, mech[n.mech] ?? 0, n.pos);
    },
    [nodeById, mechById, mech, turning],
  );

  const edgeLive = useCallback(
    (when?: { mech: string; state: number }) => !when || mech[when.mech] === when.state,
    [mech],
  );

  const findPath = useCallback(
    (from: string, to: string): string[] | null => {
      if (from === to) return [from];
      const seen = new Set([from]);
      const queue: string[][] = [[from]];
      while (queue.length) {
        const path = queue.shift()!;
        const tail = path[path.length - 1];
        for (const e of level.edges) {
          if (!edgeLive(e.when)) continue;
          const next = e.a === tail ? e.b : e.b === tail ? e.a : null;
          if (!next || seen.has(next)) continue;
          const extended = [...path, next];
          if (next === to) return extended;
          seen.add(next);
          queue.push(extended);
        }
      }
      return null;
    },
    [level, edgeLive],
  );

  /** One flood from the hero, not a BFS per node. */
  const reachable = useMemo(() => {
    const seen = new Set([heroNode]);
    const q = [heroNode];
    while (q.length) {
      const t = q.shift()!;
      for (const e of level.edges) {
        if (!edgeLive(e.when)) continue;
        const n = e.a === t ? e.b : e.b === t ? e.a : null;
        if (n && !seen.has(n)) { seen.add(n); q.push(n); }
      }
    }
    seen.delete(heroNode);
    return seen;
  }, [level, heroNode, edgeLive]);

  const walkTo = useCallback(
    (target: string, onArrive?: () => void) => {
      if (busy || stage !== "play") return;
      const path = findPath(heroNode, target);
      if (!path || path.length < 2) return;
      setBusy(true);
      let leg = 0;
      const runLeg = () => {
        if (leg >= path.length - 1) {
          setBusy(false);
          const end = nodeById.get(path[path.length - 1]);
          if (end?.goal) {
            setLit(true);
            setFlash(true);
            window.setTimeout(() => setFlash(false), 900);
            window.setTimeout(() => {
              if (levelIndex + 1 < levels.length) setLevelIndex(levelIndex + 1);
              else setStage("done");
            }, 1900);
          } else onArrive?.();
          return;
        }
        const a = posOf(path[leg]);
        const b = posOf(path[leg + 1]);
        setFacing(project(b).sx >= project(a).sx ? 1 : -1);
        const t0 = performance.now();
        const frame = (now: number) => {
          const t = Math.min(1, (now - t0) / WALK_MS);
          const e = ease(t);
          setHeroPos({ x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e), z: lerp(a.z, b.z, e) });
          if (t < 1) raf.current = requestAnimationFrame(frame);
          else { leg += 1; setHeroNode(path[leg]); runLeg(); }
        };
        raf.current = requestAnimationFrame(frame);
      };
      runLeg();
    },
    [busy, stage, findPath, heroNode, nodeById, levelIndex, posOf],
  );

  const turnMech = useCallback(
    (id: string) => {
      const m = mechById.get(id);
      if (!m) return;
      const from = mech[id] ?? 0;
      const to = (from + 1) % m.states.length;
      setBusy(true);
      const t0 = performance.now();
      const frame = (now: number) => {
        const t = Math.min(1, (now - t0) / TURN_MS);
        setTurning({ mech: id, from, to, t });
        if (t < 1) raf.current = requestAnimationFrame(frame);
        else {
          setTurning(null);
          setMech((prev) => ({ ...prev, [id]: to }));
          setBusy(false);
        }
      };
      raf.current = requestAnimationFrame(frame);
    },
    [mechById, mech],
  );

  /**
   * Cranks are places, not buttons. Walking to the control is what turns each
   * mechanism from a binary toggle into a routing problem — turn it, cross,
   * come back, turn it again. That loop is most of what "challenge" means here.
   */
  const useCrank = useCallback(
    (mechId: string, control: string) => {
      if (busy || stage !== "play") return;
      if (heroNode === control) { turnMech(mechId); return; }
      if (!reachable.has(control)) return;
      walkTo(control, () => turnMech(mechId));
    },
    [busy, stage, heroNode, reachable, turnMech, walkTo],
  );

  // -------------------------------------------------------------- occupancy
  // Computed per settled configuration, never per frame. Mechanism members are
  // excluded: they are drawn by the rotor group during a turn, and culling them
  // against stale occupancy would punch holes in a moving body.
  const occ = useMemo(() => {
    const opaque = new Set<string>();
    const world = new Set<string>();
    const screen = new Set<string>();
    const add = (v: Vec3, dim: boolean) => {
      world.add(cellKey(v));
      screen.add(screenKey(v));
      if (!dim) opaque.add(cellKey(v));
    };
    level.props.forEach((pr) => add(settled(pr.pos, pr.mech), pr.tone === "shadow"));
    level.nodes.forEach((n) => add(settled(n.pos, n.mech), false));
    return { opaque, world, screen };
  }, [level, settled]);

  const seamTiles = useMemo(
    () => new Set(level.edges.filter((e) => e.illusion).flatMap((e) => [e.a, e.b])),
    [level],
  );

  /** Screen positions of every seam tile, so structural mass never rims them either. */
  const seamScreen = useMemo(() => {
    const s = new Set<string>();
    seamTiles.forEach((id) => {
      const n = nodeById.get(id);
      if (n) s.add(screenKey(settled(n.pos, n.mech)));
    });
    return s;
  }, [seamTiles, nodeById, settled]);

  const blockFor = useCallback(
    (v: Vec3, tone?: string, stair?: boolean, isSeam?: boolean): Omit<BlockProps, "sx" | "sy"> => {
      const up = occ.world.has(cellKey({ ...v, z: v.z + 1 }));
      const down = occ.world.has(cellKey({ ...v, z: v.z - 1 }));
      const suffix = `${up ? "u" : ""}${down ? "" : "f"}`;
      const seam = isSeam || seamScreen.has(screenKey(v));
      return {
        dim: tone === "shadow",
        cullTop: occ.opaque.has(cellKey({ ...v, z: v.z + 1 })),
        cullY: occ.opaque.has(cellKey({ ...v, y: v.y + 1 })),
        cullX: occ.opaque.has(cellKey({ ...v, x: v.x + 1 })),
        // Rims need empty SKY behind them, not empty space — hence screen keys.
        // Without this an Escher join gets a bright line drawn straight down it.
        rimNX: !seam && !occ.screen.has(screenKey({ ...v, x: v.x - 1 })),
        rimNY: !seam && !occ.screen.has(screenKey({ ...v, y: v.y - 1 })),
        aoNX: !seam && occ.world.has(cellKey({ x: v.x - 1, y: v.y, z: v.z + 1 })),
        aoNY: !seam && occ.world.has(cellKey({ x: v.x, y: v.y - 1, z: v.z + 1 })),
        xGrad: stair ? "sX" : `lX${suffix}`,
        yGrad: stair ? "sY" : `lY${suffix}`,
        rim: p.glow,
      };
    },
    [occ, seamScreen, p.glow],
  );

  // ---------------------------------------------------------------- drawing
  const movingIds = useMemo(() => {
    if (!turning) return null;
    const ids = new Set<string>();
    level.nodes.forEach((n) => { if (n.mech === turning.mech) ids.add(n.id); });
    return ids;
  }, [turning, level]);

  const statics = useMemo(() => {
    const items: Array<{ key: string; pos: Vec3; node?: Node; tone?: string; stair?: boolean }> = [];
    level.props.forEach((pr, i) => {
      if (turning && pr.mech === turning.mech) return;
      items.push({ key: `p${i}`, pos: settled(pr.pos, pr.mech), tone: pr.tone, stair: pr.stair });
    });
    level.nodes.forEach((n) => {
      if (movingIds?.has(n.id)) return;
      items.push({ key: n.id, pos: settled(n.pos, n.mech), node: n });
    });
    return items.sort((a, b) => depthOf(a.pos) - depthOf(b.pos));
  }, [level, settled, turning, movingIds]);

  /** Members of the turning body, drawn once inside a single rotating group. */
  const rotor = useMemo(() => {
    if (!turning) return null;
    const m = mechById.get(turning.mech)!;
    const members: Array<{ key: string; pos: Vec3; node?: Node; tone?: string; stair?: boolean }> = [];
    level.props.forEach((pr, i) => {
      if (pr.mech === turning.mech) members.push({ key: `mp${i}`, pos: restPos(m, turning.from, pr.pos), tone: pr.tone, stair: pr.stair });
    });
    level.nodes.forEach((n) => {
      if (n.mech === turning.mech) members.push({ key: n.id, pos: restPos(m, turning.from, n.pos), node: n });
    });
    members.sort((a, b) => depthOf(a.pos) - depthOf(b.pos));
    // World rotation about z becomes the screen matrix A = [[cos, -2sin],[sin/2, cos]]
    // (that is M R M-inverse for M = [[32,-32],[16,16]]). det A = 1, so it sweeps
    // the correct 2:1 isometric ellipse — and because it is independent of z, one
    // group transform turns a body of any height rigidly, with no shear.
    const th = -(Math.PI / 2) * (turning.to - turning.from) * ease(turning.t);
    const c = Math.cos(th);
    const s = Math.sin(th);
    const P = project(m.pivot);
    const depth = Math.max(...members.map((x) => depthOf(x.pos)));
    return {
      members,
      depth,
      transform: `translate(${P.sx} ${P.sy}) matrix(${c} ${s / 2} ${-2 * s} ${c} 0 0) translate(${-P.sx} ${-P.sy})`,
      apply: (v: { sx: number; sy: number }) => ({
        sx: P.sx + c * (v.sx - P.sx) + -2 * s * (v.sy - P.sy),
        sy: P.sy + (s / 2) * (v.sx - P.sx) + c * (v.sy - P.sy),
      }),
    };
  }, [turning, mechById, level]);

  const view = useMemo(() => {
    const cells: Vec3[] = [];
    const push = (base: Vec3, mechId?: string) => {
      const m = mechId ? mechById.get(mechId) : undefined;
      if (m) m.states.forEach((_, i) => cells.push(restPos(m, i, base)));
      else cells.push(base);
    };
    level.nodes.forEach((n) => push(n.pos, n.mech));
    level.props.forEach((pr) => push(pr.pos, pr.mech));
    const ps = cells.map(project);
    const xs = ps.map((q) => q.sx);
    const ys = ps.map((q) => q.sy);
    const pad = box.w < 700 ? 40 : 96;
    const minX = Math.min(...xs) - HW - pad;
    const maxX = Math.max(...xs) + HW + pad;
    const minY = Math.min(...ys) - TILE_H - pad - 56;
    const maxY = Math.max(...ys) + TILE_Z + TILE_H + pad;
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    let w = maxX - minX;
    let h = maxY - minY;
    const target = box.w / box.h;
    if (w / h < target) w = h * target; else h = w / target;
    return { minX: cx - w / 2, minY: cy - h / 2, w, h };
  }, [level, mechById, box]);

  /**
   * Balustrades — the most recognisable Monument Valley silhouette, and the
   * whole level costs two DOM nodes because every post and rail concatenates
   * into two path strings. The screen-occupancy test is what keeps a railing
   * from walling off an Escher seam.
   */
  const rails = useMemo(() => {
    let dX = "";
    let dY = "";
    for (const n of level.nodes) {
      if (n.mech || n.goal) continue;
      const v = settled(n.pos, n.mech);
      if (seamTiles.has(n.id) || seamScreen.has(screenKey(v))) continue;
      const { sx, sy } = project(v);
      if (!occ.screen.has(screenKey({ ...v, x: v.x + 1 }))) {
        const [ax, ay] = fX(sx, sy, 0.07, 0);
        const [bx, by] = fX(sx, sy, 0.93, 0);
        dX += `M${ax},${ay - 11}L${bx},${by - 11}`;
        for (const t of [0.18, 0.5, 0.82]) {
          const [px, py] = fX(sx, sy, t, 0);
          dX += `M${px},${py}v-13`;
        }
      }
      if (!occ.screen.has(screenKey({ ...v, y: v.y + 1 }))) {
        const [ax, ay] = fY(sx, sy, 0.07, 0);
        const [bx, by] = fY(sx, sy, 0.93, 0);
        dY += `M${ax},${ay - 11}L${bx},${by - 11}`;
        for (const t of [0.18, 0.5, 0.82]) {
          const [px, py] = fY(sx, sy, t, 0);
          dY += `M${px},${py}v-13`;
        }
      }
    }
    return { dX, dY };
  }, [level, settled, occ, seamTiles, seamScreen]);

  const stars = useMemo(() => {
    const r = rng(level.id.length * 9871 + 17);
    const n = Math.round(p.stars * Math.min(1, (box.w * box.h) / 900000));
    const buckets = ["", "", ""];
    for (let i = 0; i < n; i++) {
      const x = view.minX + r() * view.w;
      const y = view.minY + r() * view.h * 0.8;
      const s = 0.6 + r() * 1.8;
      const b = Math.floor(r() * 3);
      buckets[b] += `M${x.toFixed(1)} ${y.toFixed(1)}m${-s.toFixed(2)} 0a${s.toFixed(2)} ${s.toFixed(2)} 0 1 0 ${(2 * s).toFixed(2)} 0a${s.toFixed(2)} ${s.toFixed(2)} 0 1 0 ${(-2 * s).toFixed(2)} 0`;
    }
    return buckets;
  }, [p.stars, view, level.id, box.w, box.h]);

  const motes = useMemo(() => {
    const r = rng(level.id.length * 3313 + 5);
    const buckets = ["", ""];
    for (let i = 0; i < 22; i++) {
      const x = view.minX + r() * view.w;
      const y = view.minY + r() * view.h;
      const s = 1.4 + r() * 3;
      buckets[i % 2] += `M${x.toFixed(1)} ${y.toFixed(1)}m${-s.toFixed(2)} 0a${s.toFixed(2)} ${s.toFixed(2)} 0 1 0 ${(2 * s).toFixed(2)} 0a${s.toFixed(2)} ${s.toFixed(2)} 0 1 0 ${(-2 * s).toFixed(2)} 0`;
    }
    return buckets;
  }, [view, level.id]);

  const heroScreenRaw = project(heroPos);
  const heroRiding = !!(turning && movingIds?.has(heroNode));
  const heroScreen = heroRiding && rotor ? rotor.apply(project(posOf(heroNode))) : heroScreenRaw;

  const wallStops = (hi: string, a: string, b: string, c: string, d: string) => ({ hi, a, b, c, d });
  const Y = wallStops(p.leftHi, p.leftA, p.leftB, p.leftC, p.leftD);
  const X = wallStops(p.rightHi, p.rightA, p.rightB, p.rightC, p.rightD);

  const drawBlock = (it: { key: string; pos: Vec3; node?: Node; tone?: string; stair?: boolean }) => {
    const { sx, sy } = project(it.pos);
    return <Block key={it.key} sx={sx} sy={sy} {...blockFor(it.pos, it.tone, it.stair, it.node ? seamTiles.has(it.node.id) : false)} />;
  };

  return (
    <div className="quest" data-stage={stage} ref={shell}>
      <svg
        className="quest-stage"
        viewBox={`${view.minX} ${view.minY} ${view.w} ${view.h}`}
        preserveAspectRatio="xMidYMid meet"
        aria-label={`${level.name} — isometric puzzle`}
      >
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0.25" y2="1">
            <stop offset="0%" stopColor={p.skyTop} />
            <stop offset="58%" stopColor={p.skyMid} />
            <stop offset="100%" stopColor={p.skyLow} />
          </linearGradient>
          <radialGradient id="halo" cx="50%" cy="44%" r="52%">
            <stop offset="0%" stopColor={p.glow} stopOpacity="0.32" />
            <stop offset="100%" stopColor={p.glow} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="bloom">
            <stop offset="0%" stopColor={p.glow} stopOpacity="0.5" />
            <stop offset="45%" stopColor={p.glow} stopOpacity="0.17" />
            <stop offset="100%" stopColor={p.glow} stopOpacity="0" />
          </radialGradient>

          <linearGradient id="bevel" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={p.topHi} />
            <stop offset="100%" stopColor={p.topC} />
          </linearGradient>
          <linearGradient id="top" x1="0" y1="0" x2="0.6" y2="1">
            <stop offset="0%" stopColor={p.topA} />
            <stop offset="100%" stopColor={p.topB} />
          </linearGradient>
          <linearGradient id="dTop" x1="0" y1="0" x2="0.6" y2="1">
            <stop offset="0%" stopColor={p.topB} />
            <stop offset="100%" stopColor={p.leftB} />
          </linearGradient>
          <linearGradient id="dY" x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0%" stopColor={p.leftB} /><stop offset="100%" stopColor={p.rightB} />
          </linearGradient>
          <linearGradient id="dX" x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0%" stopColor={p.rightB} /><stop offset="100%" stopColor={p.rightC} />
          </linearGradient>

          {/* Wall variants: -u means a block sits above (so the top edge is a
              masonry course joint, not a lit edge); -f means nothing below, so
              the base is exposed and darkens into its own footing. Applying the
              foot to every block instead produces a stacked-pillow quilt. */}
          {(["Y", "X"] as const).map((face) => {
            const s = face === "Y" ? Y : X;
            return [
              { id: `l${face}`, stops: [[0, s.hi], [0.07, s.a], [1, s.b]] },
              { id: `l${face}f`, stops: [[0, s.hi], [0.07, s.a], [0.62, s.b], [1, s.c]] },
              { id: `l${face}u`, stops: [[0, s.d], [0.09, s.a], [1, s.b]] },
              { id: `l${face}uf`, stops: [[0, s.d], [0.09, s.a], [0.62, s.b], [1, s.c]] },
            ].map((g) => (
              <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0.3" y2="1">
                {(g.stops as [number, string][]).map(([o, c]) => (
                  <stop key={o} offset={`${o * 100}%`} stopColor={c} />
                ))}
              </linearGradient>
            ));
          })}

          {/* Staircase treads: hard-stop repeats give three visible courses per
              storey without a single extra node. */}
          {(["Y", "X"] as const).map((face) => {
            const s = face === "Y" ? Y : X;
            return (
              <linearGradient key={`s${face}`} id={`s${face}`} x1="0" y1="0" x2="0.3" y2="1">
                <stop offset="0%" stopColor={s.hi} /><stop offset="4%" stopColor={s.a} />
                <stop offset="32%" stopColor={s.b} /><stop offset="34%" stopColor={s.hi} />
                <stop offset="38%" stopColor={s.a} /><stop offset="66%" stopColor={s.b} />
                <stop offset="68%" stopColor={s.hi} /><stop offset="72%" stopColor={s.a} />
                <stop offset="100%" stopColor={s.b} />
              </linearGradient>
            );
          })}

          <linearGradient id="aoNX" x1="0" y1="0" x2="0.83" y2="0.83">
            <stop offset="0" stopColor="#000" stopOpacity=".36" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="aoNY" x1="0" y1="0" x2="-0.83" y2="0.83">
            <stop offset="0" stopColor="#000" stopOpacity=".3" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </linearGradient>

          <radialGradient id="vignette" cx="50%" cy="48%" r="72%">
            <stop offset="55%" stopColor="#000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.58" />
          </radialGradient>
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>

        <rect x={view.minX} y={view.minY} width={view.w} height={view.h} fill="url(#sky)" />
        <rect x={view.minX} y={view.minY} width={view.w} height={view.h} fill="url(#halo)" />

        {stars.map((d, i) => (
          <path key={i} d={d} fill="#fff" opacity={[0.35, 0.6, 0.85][i]} className="q-twinkle" style={{ animationDelay: `${i * 1.5}s` }} />
        ))}

        {/* A skyline behind the monument: four nodes, and the world stops
            ending at the edge of the puzzle. */}
        <g className="q-drift" opacity="0.19">
          <path
            d={`M${view.minX},${view.minY + view.h * 0.66}
                l${view.w * 0.1},${-view.h * 0.13} l${view.w * 0.05},${view.h * 0.05}
                l${view.w * 0.08},${-view.h * 0.2} l${view.w * 0.06},${view.h * 0.2}
                l${view.w * 0.09},${-view.h * 0.09} l${view.w * 0.12},${view.h * 0.17}
                l${view.w * 0.1},${-view.h * 0.24} l${view.w * 0.08},${view.h * 0.24}
                l${view.w * 0.14},${-view.h * 0.11} l${view.w * 0.18},${view.h * 0.11}
                L${view.minX + view.w},${view.minY + view.h} L${view.minX},${view.minY + view.h} Z`}
            fill={p.skyline}
          />
        </g>
        {level.id === "moon" && (
          <g opacity="0.8">
            <circle cx={view.minX + view.w * 0.79} cy={view.minY + view.h * 0.19} r="86" fill="#6b74c9" opacity="0.45" />
            <ellipse cx={view.minX + view.w * 0.79} cy={view.minY + view.h * 0.19} rx="152" ry="26" fill="none" stroke="#cbd4ff" strokeWidth="7" opacity="0.4" />
            <circle cx={view.minX + view.w * 0.19} cy={view.minY + view.h * 0.12} r="34" fill="#d9b3e8" opacity="0.32" />
          </g>
        )}
        {level.id === "house" && (
          <circle cx={view.minX + view.w * 0.73} cy={view.minY + view.h * 0.17} r="64" fill="#ffdca6" opacity="0.2" />
        )}

        {/* Monument. The rotor group is spliced in at one depth slot; the
            one-tile clearance ring authored around each pivot is what makes a
            single slot correct. */}
        <g>
          {statics.filter((it) => !rotor || depthOf(it.pos) <= rotor.depth).map(drawBlock)}
          {rotor && <g transform={rotor.transform}>{rotor.members.map(drawBlock)}</g>}
          {rotor && statics.filter((it) => depthOf(it.pos) > rotor.depth).map(drawBlock)}
        </g>

        <path d={rails.dX} stroke={p.topHi} strokeOpacity=".4" strokeWidth="2" strokeLinecap="round" fill="none" pointerEvents="none" />
        <path d={rails.dY} stroke={p.topHi} strokeOpacity=".28" strokeWidth="2" strokeLinecap="round" fill="none" pointerEvents="none" />

        {/* Hit targets and the persistent reachability marker. Hover-only
            highlighting left phones with no indication of where you could go. */}
        <g>
          {level.nodes.map((n) => {
            const v = posOf(n.id);
            const { sx, sy } = project(v);
            const live = reachable.has(n.id);
            return (
              <g key={`t${n.id}`}>
                {live && !n.crank && (
                  <polygon
                    className="q-mark"
                    points={pts([sx, sy - HH * 0.34], [sx + HW * 0.34, sy], [sx, sy + HH * 0.34], [sx - HW * 0.34, sy])}
                    pointerEvents="none"
                  />
                )}
                <polygon
                  className={`q-tile${live ? " q-tile--live" : ""}`}
                  points={pts([sx, sy - HH], [sx + HW, sy], [sx, sy + HH], [sx - HW, sy])}
                  onClick={() => (n.crank ? useCrank(n.crank, n.id) : walkTo(n.id))}
                  role="button"
                  tabIndex={live ? 0 : -1}
                  aria-label={n.goal ? "Light the candle" : n.crank ? "Turn the mechanism" : "Move here"}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      n.crank ? useCrank(n.crank, n.id) : walkTo(n.id);
                    }
                  }}
                />
              </g>
            );
          })}
        </g>

        <g>{level.decor.map((item, i) => <DecorItem key={i} item={item} p={p} lit={lit} />)}</g>

        {level.nodes.filter((n) => n.crank).map((n) => {
          const m = mechById.get(n.crank!)!;
          const cur = mech[n.crank!] ?? 0;
          const prog = turning && turning.mech === n.crank ? turning.from + (turning.to - turning.from) * ease(turning.t) : cur;
          const v = project(posOf(n.id));
          return (
            <Crank
              key={n.id}
              sx={v.sx}
              sy={v.sy}
              angle={-90 * prog}
              accent={p.accent}
              active={!busy && (heroNode === n.id || reachable.has(n.id))}
              onUse={() => useCrank(n.crank!, n.id)}
            />
          );
        })}

        <g className="q-hero" style={{ transform: `translate(${heroScreen.sx}px, ${heroScreen.sy}px)` }}>
          <ellipse cx="0" cy="4" rx="17" ry="8" fill="#000" opacity="0.3" />
          <circle cx="0" cy="-26" r="30" fill="url(#bloom)" />
          <g style={{ transform: `scaleX(${facing})` }} className={busy ? "q-hero-bob q-hero-bob--walk" : "q-hero-bob"}>
            <path d="M-10,-2 Q-13,-20 -7,-25 L7,-25 Q13,-20 10,-2 Z" fill={p.accent} opacity="0.5" />
            <path d="M-9,-2 Q-11,-22 0,-24 Q11,-22 9,-2 Z" fill="#f6e6c8" />
            <path d="M-9,-2 Q-10,-11 0,-12 Q10,-11 9,-2 Z" fill={p.accent} opacity="0.42" />
            <circle cx="0" cy="-32" r="9.5" fill="#f9ebd2" />
            <path d="M-9.5,-34 Q0,-45 9.5,-34 Q4,-38.5 -9.5,-34 Z" fill="#4b3322" />
            <circle cx="3.4" cy="-32" r="1.5" fill="#33241a" />
          </g>
        </g>

        {motes.map((d, i) => (
          <g key={i} className="q-mote" style={{ animationDelay: `${i * 4}s` }}>
            <path d={d} fill={p.mote} opacity="0.5" />
          </g>
        ))}

        <rect x={view.minX} y={view.minY} width={view.w} height={view.h} fill="url(#vignette)" pointerEvents="none" />
        <rect x={view.minX} y={view.minY} width={view.w} height={view.h} filter="url(#grain)" opacity="0.05" pointerEvents="none" />
      </svg>

      {flash && <div className="quest-flash" aria-hidden="true" />}

      {stage === "play" && (
        <div className="quest-hud">
          <div className="quest-hud-left">
            <span className="quest-chapter">Chapter {levelIndex + 1} of {levels.length}</span>
            <h2>{level.name}</h2>
            <p>{level.line}</p>
          </div>
          <div className="quest-hud-right">
            <div className="quest-pips" aria-label={`${levelIndex} candles lit`}>
              {levels.map((l, i) => (
                <span key={l.id} className={i < levelIndex || (i === levelIndex && lit) ? "on" : ""} />
              ))}
            </div>
            <button type="button" className="quest-ghost" onClick={() => loadLevel(levelIndex)}>Reset</button>
          </div>
          <p className="quest-hint">{level.hint}</p>
        </div>
      )}

      {stage === "intro" && (
        <div className="quest-overlay">
          <div className="quest-card">
            <span className="quest-kicker">A Birthday Hero Book game</span>
            <h1>The Birthday Quest</h1>
            <p>
              Three impossible places. Three candles to light. Nothing up there connects the way it
              looks — which is rather the point.
            </p>
            <label className="quest-field">
              <span>Who is the birthday hero?</span>
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value.replace(/[^\p{L} '-]/gu, "").slice(0, 18))}
                placeholder="Their first name"
                autoComplete="off"
                onKeyDown={(e) => { if (e.key === "Enter") { setHero(nameInput.trim()); setStage("play"); } }}
              />
            </label>
            <button type="button" className="quest-primary" onClick={() => { setHero(nameInput.trim()); setStage("play"); }}>
              Begin the quest
            </button>
            <small>Their name never leaves your device — nothing is sent or saved.</small>
          </div>
        </div>
      )}

      {stage === "done" && (
        <div className="quest-overlay">
          <div className="quest-card">
            <span className="quest-kicker">All three candles lit</span>
            <h1>{hero ? `${hero} made it.` : "You made it."}</h1>
            <p>
              {hero ? `${hero} climbed` : "You climbed"} a valley that broke, a tower that lied about
              its own height, and a house where the last step shouldn&apos;t have been there at all.
            </p>
            <p className="quest-sell">
              That is more or less what we do for a living — except we put a real child at the centre
              of it, by name, and print it as a storybook for their birthday.
            </p>
            <Link className="quest-primary" href="/#pricing">See the books</Link>
            <button type="button" className="quest-ghost quest-ghost--wide" onClick={() => { setLevelIndex(0); setStage("play"); }}>
              Play again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
