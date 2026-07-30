"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  TILE_H,
  TILE_W,
  TILE_Z,
  depthOf,
  levels,
  project,
  type Decor,
  type Level,
  type Node,
  type Prop,
  type Vec3,
} from "@/lib/quest-levels";

const WALK_MS = 300;
const TURN_MS = 620;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const mix = (a: Vec3, b: Vec3, t: number): Vec3 => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  z: lerp(a.z, b.z, t),
});

/** Deterministic pseudo-random so the starfield never shifts between renders. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

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

  // The viewBox is fitted to the container's aspect ratio below. Without this
  // the SVG letterboxes and the sky stops short of the screen edges.
  useEffect(() => {
    const el = shell.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => {
      const r = entry.contentRect;
      if (r.width > 0 && r.height > 0) setBox({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const level: Level = levels[levelIndex];

  const loadLevel = useCallback((index: number) => {
    const lv = levels[index];
    const start: Record<string, number> = {};
    lv.mechanisms.forEach((m) => (start[m.id] = 0));
    setMech(start);
    setTurning(null);
    setHeroNode(lv.start);
    const node = lv.nodes.find((n) => n.id === lv.start)!;
    setHeroPos(node.pos);
    setLit(false);
    setBusy(false);
    setFacing(1);
  }, []);

  useEffect(() => {
    if (stage === "play") loadLevel(levelIndex);
  }, [stage, levelIndex, loadLevel]);

  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current); }, []);

  /** Where a node sits right now, accounting for a mechanism mid-turn. */
  const posOf = useCallback(
    (id: string): Vec3 => {
      const n = level.nodes.find((x) => x.id === id);
      if (!n) return { x: 0, y: 0, z: 0 };
      if (!n.mech || !n.states) return n.pos;
      if (turning && turning.mech === n.mech) {
        return mix(n.states[turning.from], n.states[turning.to], ease(turning.t));
      }
      return n.states[mech[n.mech] ?? 0] ?? n.pos;
    },
    [level, mech, turning],
  );

  const edgeLive = useCallback(
    (when?: { mech: string; state: number }) => !when || mech[when.mech] === when.state,
    [mech],
  );

  /** Breadth-first over currently-live edges. */
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

  const reachable = useMemo(() => {
    const set = new Set<string>();
    level.nodes.forEach((n) => {
      if (n.id !== heroNode && findPath(heroNode, n.id)) set.add(n.id);
    });
    return set;
  }, [level, heroNode, findPath]);

  const walkTo = useCallback(
    (target: string) => {
      if (busy || stage !== "play") return;
      const path = findPath(heroNode, target);
      if (!path || path.length < 2) return;
      setBusy(true);
      let leg = 0;
      const runLeg = () => {
        if (leg >= path.length - 1) {
          setBusy(false);
          const end = level.nodes.find((n) => n.id === path[path.length - 1]);
          if (end?.goal) {
            setLit(true);
            setFlash(true);
            window.setTimeout(() => setFlash(false), 900);
            window.setTimeout(() => {
              if (levelIndex + 1 < levels.length) setLevelIndex(levelIndex + 1);
              else setStage("done");
            }, 1850);
          }
          return;
        }
        const a = posOf(path[leg]);
        const b = posOf(path[leg + 1]);
        setFacing(project(b).sx >= project(a).sx ? 1 : -1);
        const t0 = performance.now();
        const frame = (now: number) => {
          const t = Math.min(1, (now - t0) / WALK_MS);
          setHeroPos(mix(a, b, ease(t)));
          if (t < 1) raf.current = requestAnimationFrame(frame);
          else {
            leg += 1;
            setHeroNode(path[leg]);
            runLeg();
          }
        };
        raf.current = requestAnimationFrame(frame);
      };
      runLeg();
    },
    [busy, stage, findPath, heroNode, level, levelIndex, posOf],
  );

  const turnMech = useCallback(
    (id: string) => {
      if (busy || stage !== "play") return;
      const spec = level.mechanisms.find((m) => m.id === id);
      if (!spec) return;
      const from = mech[id] ?? 0;
      const to = (from + 1) % spec.states;
      setBusy(true);
      const riding = level.nodes.find((n) => n.id === heroNode);
      const rides = riding?.mech === id && riding.states;
      const t0 = performance.now();
      const frame = (now: number) => {
        const t = Math.min(1, (now - t0) / TURN_MS);
        setTurning({ mech: id, from, to, t });
        if (rides && riding?.states) {
          setHeroPos(mix(riding.states[from], riding.states[to], ease(t)));
        }
        if (t < 1) raf.current = requestAnimationFrame(frame);
        else {
          setTurning(null);
          setMech((m) => ({ ...m, [id]: to }));
          setBusy(false);
        }
      };
      raf.current = requestAnimationFrame(frame);
    },
    [busy, stage, level, mech, heroNode],
  );

  // ---------------------------------------------------------------- drawing
  const palette = level.palette;

  const drawables = useMemo(() => {
    const items: Array<{ key: string; pos: Vec3; node?: Node; prop?: Prop }> = [];
    level.props.forEach((p, i) => items.push({ key: `p${i}`, pos: p.pos, prop: p }));
    level.nodes.forEach((n) => items.push({ key: n.id, pos: posOf(n.id), node: n }));
    return items.sort((a, b) => depthOf(a.pos) - depthOf(b.pos));
  }, [level, posOf]);

  const view = useMemo(() => {
    const pts = [
      ...level.nodes.flatMap((n) => (n.states ? n.states : [n.pos])),
      ...level.props.map((p) => p.pos),
    ].map(project);
    const xs = pts.map((p) => p.sx);
    const ys = pts.map((p) => p.sy);
    // Phones fit the level by width, so generous padding there just shrinks the
    // monument into the middle of a lot of empty sky.
    const pad = box.w < 700 ? 34 : 96;
    const minX = Math.min(...xs) - TILE_W / 2 - pad;
    const maxX = Math.max(...xs) + TILE_W / 2 + pad;
    const minY = Math.min(...ys) - TILE_H - pad - 40; // headroom for the HUD
    const maxY = Math.max(...ys) + TILE_Z + TILE_H + pad;

    // Grow the short axis so the viewBox matches the screen exactly. This keeps
    // the monument fully visible at any aspect ratio and leaves no letterbox
    // for the sky to stop short of.
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    let w = maxX - minX;
    let h = maxY - minY;
    const target = box.w / box.h;
    if (w / h < target) w = h * target;
    else h = w / target;
    return { minX: cx - w / 2, minY: cy - h / 2, w, h };
  }, [level, box]);

  const stars = useMemo(() => {
    const r = rng(level.id.length * 9871 + 17);
    return Array.from({ length: palette.stars }, () => ({
      x: view.minX + r() * view.w,
      y: view.minY + r() * view.h * 0.75,
      s: 0.6 + r() * 1.9,
      o: 0.25 + r() * 0.7,
      d: r() * 4,
    }));
  }, [palette.stars, view, level.id]);

  const motes = useMemo(() => {
    const r = rng(level.id.length * 3313 + 5);
    return Array.from({ length: 26 }, (_, i) => ({
      x: view.minX + r() * view.w,
      y: view.minY + r() * view.h,
      s: 1.4 + r() * 3.2,
      d: r() * 9,
      i,
    }));
  }, [view, level.id]);

  function Block({ pos, tone, faded }: { pos: Vec3; tone?: string; faded?: boolean }) {
    const { sx, sy } = project(pos);
    const hw = TILE_W / 2;
    const hh = TILE_H / 2;
    const d = TILE_Z;
    const shadow = tone === "shadow";
    const suffix = shadow ? "-dim" : "";
    return (
      <g opacity={faded ? 0.4 : shadow ? 0.55 : 1}>
        <polygon
          points={`${sx - hw},${sy} ${sx},${sy + hh} ${sx},${sy + hh + d} ${sx - hw},${sy + d}`}
          fill={`url(#left${suffix})`}
        />
        <polygon
          points={`${sx},${sy + hh} ${sx + hw},${sy} ${sx + hw},${sy + d} ${sx},${sy + hh + d}`}
          fill={`url(#right${suffix})`}
        />
        <polygon
          points={`${sx},${sy - hh} ${sx + hw},${sy} ${sx},${sy + hh} ${sx - hw},${sy}`}
          fill={`url(#top${suffix})`}
        />
        <polyline
          points={`${sx - hw},${sy} ${sx},${sy - hh} ${sx + hw},${sy}`}
          fill="none"
          stroke={palette.edge}
          strokeWidth="1.1"
        />
      </g>
    );
  }

  function DecorItem({ item }: { item: Decor }) {
    const { sx, sy } = project(item.pos);
    const top = sy - TILE_H / 2;
    if (item.kind === "fern") {
      return (
        <g opacity="0.9">
          {[-14, -4, 7, 16].map((dx, i) => (
            <path
              key={i}
              d={`M${sx + dx},${top + 4} q ${dx / 2},-18 ${dx / 1.2},-30`}
              stroke={palette.topB}
              strokeWidth="3.4"
              fill="none"
              strokeLinecap="round"
              opacity={0.75}
            />
          ))}
        </g>
      );
    }
    if (item.kind === "banner") {
      return (
        <g>
          <path d={`M${sx - 26},${top - 40} Q ${sx},${top - 24} ${sx + 26},${top - 40}`} stroke={palette.accent} strokeWidth="1.6" fill="none" opacity="0.75" />
          {[-18, -6, 6, 18].map((dx, i) => (
            <polygon key={i} points={`${sx + dx - 5},${top - 36 + Math.abs(dx) * 0.12} ${sx + dx + 5},${top - 36 + Math.abs(dx) * 0.12} ${sx + dx},${top - 24 + Math.abs(dx) * 0.12}`} fill={i % 2 ? palette.accent : palette.topA} opacity="0.95" />
          ))}
        </g>
      );
    }
    if (item.kind === "lantern") {
      // A paper lantern on a slender post — reads far better at this scale
      // than a floating box did.
      const hang = top - 34;
      return (
        <g>
          <circle cx={sx} cy={hang} r="26" fill={palette.glow} opacity="0.18" filter="url(#soft)" />
          <line x1={sx} y1={top + 2} x2={sx} y2={hang - 6} stroke={palette.rightB} strokeWidth="2.2" opacity="0.8" />
          <g className="q-flicker" style={{ transformOrigin: `${sx}px ${hang - 6}px` }}>
            <ellipse cx={sx} cy={hang} rx="8.5" ry="10.5" fill={palette.accent} opacity="0.95" />
            <ellipse cx={sx} cy={hang} rx="4" ry="7" fill="#fff6de" opacity="0.9" />
            <line x1={sx - 8.5} y1={hang} x2={sx + 8.5} y2={hang} stroke={palette.rightB} strokeWidth="0.9" opacity="0.35" />
          </g>
        </g>
      );
    }
    // candle + cake share the flame, the cake gets a body
    const isCake = item.kind === "cake";
    const baseY = top - (isCake ? 6 : 2);
    return (
      <g>
        <circle cx={sx} cy={baseY - 40} r={isCake ? 54 : 34} fill={palette.glow} opacity={lit ? 0.3 : 0.13} className="q-glow" />
        {isCake && (
          <>
            <ellipse cx={sx} cy={baseY - 6} rx="30" ry="11" fill={palette.topA} />
            <rect x={sx - 30} y={baseY - 24} width="60" height="19" fill={palette.topB} />
            <ellipse cx={sx} cy={baseY - 24} rx="30" ry="11" fill={palette.accent} />
          </>
        )}
        <rect
          x={sx - (isCake ? 4 : 5)}
          y={baseY - (isCake ? 50 : 34)}
          width={isCake ? 8 : 10}
          height={isCake ? 28 : 32}
          rx="3"
          fill="#fdf3dc"
        />
        <g className={lit ? "q-flame" : "q-flame q-flame--out"}>
          <ellipse cx={sx} cy={baseY - (isCake ? 58 : 40)} rx="6" ry="11" fill={palette.accent} />
          <ellipse cx={sx} cy={baseY - (isCake ? 56 : 38)} rx="2.6" ry="6" fill="#fff8e2" />
        </g>
      </g>
    );
  }

  function Crank({ node }: { node: Node }) {
    const { sx, sy } = project(posOf(node.id));
    const turned = (mech[node.crank!] ?? 0) === 1;
    return (
      <g
        className="q-crank"
        onClick={(e) => {
          e.stopPropagation();
          turnMech(node.crank!);
        }}
        role="button"
        tabIndex={0}
        aria-label="Turn the mechanism"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            turnMech(node.crank!);
          }
        }}
      >
        <circle cx={sx} cy={sy - 30} r="27" fill={palette.accent} opacity="0.12" className="q-pulse" />
        <g style={{ transform: `rotate(${turned ? 90 : 0}deg)`, transformOrigin: `${sx}px ${sy - 30}px`, transition: `transform ${TURN_MS}ms cubic-bezier(.62,.03,.3,1)` }}>
          <circle cx={sx} cy={sy - 30} r="13" fill="none" stroke={palette.accent} strokeWidth="3.2" />
          {[0, 90, 180, 270].map((a) => (
            <line
              key={a}
              x1={sx + Math.cos((a * Math.PI) / 180) * 13}
              y1={sy - 30 + Math.sin((a * Math.PI) / 180) * 13}
              x2={sx + Math.cos((a * Math.PI) / 180) * 20}
              y2={sy - 30 + Math.sin((a * Math.PI) / 180) * 20}
              stroke={palette.accent}
              strokeWidth="3.2"
              strokeLinecap="round"
            />
          ))}
          <circle cx={sx} cy={sy - 30} r="4" fill={palette.accent} />
        </g>
      </g>
    );
  }

  const heroScreen = project(heroPos);

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
            <stop offset="0%" stopColor={palette.skyTop} />
            <stop offset="58%" stopColor={palette.skyMid} />
            <stop offset="100%" stopColor={palette.skyLow} />
          </linearGradient>
          <radialGradient id="halo" cx="50%" cy="46%" r="52%">
            <stop offset="0%" stopColor={palette.glow} stopOpacity="0.34" />
            <stop offset="100%" stopColor={palette.glow} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="top" x1="0" y1="0" x2="0.6" y2="1">
            <stop offset="0%" stopColor={palette.topA} />
            <stop offset="100%" stopColor={palette.topB} />
          </linearGradient>
          <linearGradient id="left" x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0%" stopColor={palette.leftA} />
            <stop offset="100%" stopColor={palette.leftB} />
          </linearGradient>
          <linearGradient id="right" x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0%" stopColor={palette.rightA} />
            <stop offset="100%" stopColor={palette.rightB} />
          </linearGradient>
          <linearGradient id="top-dim" x1="0" y1="0" x2="0.6" y2="1">
            <stop offset="0%" stopColor={palette.topB} />
            <stop offset="100%" stopColor={palette.leftB} />
          </linearGradient>
          <linearGradient id="left-dim" x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0%" stopColor={palette.leftB} />
            <stop offset="100%" stopColor={palette.rightB} />
          </linearGradient>
          <linearGradient id="right-dim" x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0%" stopColor={palette.rightB} />
            <stop offset="100%" stopColor={palette.rightB} />
          </linearGradient>
          <radialGradient id="vignette" cx="50%" cy="48%" r="72%">
            <stop offset="55%" stopColor="#000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.55" />
          </radialGradient>
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <filter id="soft" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
        </defs>

        <rect x={view.minX} y={view.minY} width={view.w} height={view.h} fill="url(#sky)" />
        <rect x={view.minX} y={view.minY} width={view.w} height={view.h} fill="url(#halo)" />

        <g>
          {stars.map((s, i) => (
            <circle
              key={i}
              cx={s.x}
              cy={s.y}
              r={s.s}
              fill="#fff"
              opacity={s.o}
              className="q-twinkle"
              style={{ animationDelay: `${s.d}s` }}
            />
          ))}
        </g>

        {level.id === "moon" && (
          <g opacity="0.85">
            <circle cx={view.minX + view.w * 0.78} cy={view.minY + view.h * 0.2} r="86" fill="#6b74c9" opacity="0.5" />
            <ellipse cx={view.minX + view.w * 0.78} cy={view.minY + view.h * 0.2} rx="150" ry="26" fill="none" stroke="#cbd4ff" strokeWidth="7" opacity="0.42" />
            <circle cx={view.minX + view.w * 0.2} cy={view.minY + view.h * 0.13} r="34" fill="#d9b3e8" opacity="0.36" />
          </g>
        )}
        {level.id === "valley" && (
          <g opacity="0.4">
            <path d={`M${view.minX},${view.minY + view.h * 0.62} L${view.minX + view.w * 0.24},${view.minY + view.h * 0.34} L${view.minX + view.w * 0.44},${view.minY + view.h * 0.62} Z`} fill={palette.leftB} />
            <path d={`M${view.minX + view.w * 0.36},${view.minY + view.h * 0.62} L${view.minX + view.w * 0.62},${view.minY + view.h * 0.3} L${view.minX + view.w * 0.9},${view.minY + view.h * 0.62} Z`} fill={palette.rightA} />
          </g>
        )}
        {level.id === "house" && (
          <g opacity="0.35">
            <circle cx={view.minX + view.w * 0.72} cy={view.minY + view.h * 0.18} r="62" fill="#ffdca6" opacity="0.5" />
          </g>
        )}

        <g>
          {drawables.map((d) => {
            const node = d.node;
            const isGoal = node?.goal;
            const canReach = node ? reachable.has(node.id) : false;
            return (
              <g key={d.key}>
                <Block pos={d.pos} tone={d.prop?.tone} />
                {node && (
                  <polygon
                    className={`q-tile${canReach ? " q-tile--live" : ""}`}
                    points={(() => {
                      const { sx, sy } = project(d.pos);
                      return `${sx},${sy - TILE_H / 2} ${sx + TILE_W / 2},${sy} ${sx},${sy + TILE_H / 2} ${sx - TILE_W / 2},${sy}`;
                    })()}
                    onClick={() => walkTo(node.id)}
                    role="button"
                    tabIndex={canReach ? 0 : -1}
                    aria-label={isGoal ? "Light the candle" : "Move here"}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        walkTo(node.id);
                      }
                    }}
                  />
                )}
              </g>
            );
          })}
        </g>

        <g>{level.decor.map((item, i) => <DecorItem key={i} item={item} />)}</g>
        <g>{level.nodes.filter((n) => n.crank).map((n) => <Crank key={n.id} node={n} />)}</g>

        <g className="q-hero" style={{ transform: `translate(${heroScreen.sx}px, ${heroScreen.sy}px)` }}>
          <ellipse cx="0" cy="4" rx="17" ry="8" fill="#000" opacity="0.28" />
          <circle cx="0" cy="-26" r="26" fill={palette.glow} opacity="0.2" filter="url(#soft)" />
          <g style={{ transform: `scaleX(${facing})` }} className={busy ? "q-hero-bob q-hero-bob--walk" : "q-hero-bob"}>
            <path d="M-9,-2 Q-11,-22 0,-24 Q11,-22 9,-2 Z" fill="#f4e3c4" />
            <path d="M-9,-2 Q-11,-14 0,-16 Q11,-14 9,-2 Z" fill={palette.accent} opacity="0.55" />
            <circle cx="0" cy="-32" r="9.5" fill="#f7e7cb" />
            <path d="M-9.5,-34 Q0,-44 9.5,-34 Q4,-38 -9.5,-34 Z" fill="#4b3322" />
            <circle cx="3.4" cy="-32" r="1.5" fill="#33241a" />
          </g>
        </g>

        <g>
          {motes.map((m) => (
            <circle
              key={m.i}
              cx={m.x}
              cy={m.y}
              r={m.s}
              fill={palette.mote}
              opacity="0.5"
              className="q-mote"
              style={{ animationDelay: `${m.d}s` }}
            />
          ))}
        </g>

        <rect x={view.minX} y={view.minY} width={view.w} height={view.h} fill="url(#vignette)" pointerEvents="none" />
        <rect x={view.minX} y={view.minY} width={view.w} height={view.h} filter="url(#grain)" opacity="0.06" pointerEvents="none" style={{ mixBlendMode: "overlay" }} />
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
            <button type="button" className="quest-ghost" onClick={() => loadLevel(levelIndex)}>
              Reset
            </button>
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
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setHero(nameInput.trim());
                    setStage("play");
                  }
                }}
              />
            </label>
            <button
              type="button"
              className="quest-primary"
              onClick={() => {
                setHero(nameInput.trim());
                setStage("play");
              }}
            >
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
            <Link className="quest-primary" href="/#pricing">
              See the books
            </Link>
            <button
              type="button"
              className="quest-ghost quest-ghost--wide"
              onClick={() => {
                setLevelIndex(0);
                setStage("play");
              }}
            >
              Play again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
