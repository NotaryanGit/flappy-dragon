/* Storybook Ember Sky: warm illustrated arcade, tactile paper UI, ember-orange action states. */
import { useEffect, useRef, useState } from "react";
import dragonMascotFlapping from "@/assets/dragon-mascot-flapping.png";

const SKY = "/manus-storage/ChatGPTImageSep9,2026,10_44_19PM_5dac135d.png";
// This is the user's exact 200-frame transparent animation. No pose interpolation or trail is applied.
const DRAGON = "/manus-storage/dragon-flapping_c03c69a5.webp";

type Mode = "ready" | "playing" | "over";
type ScoreRow = { name: string; score: number; date: string };
type Particle = { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number; color: string; gravity: number };

type GameState = {
  mode: Mode;
  score: number;
  best: number;
  time: number;
  last: number;
  dragon: { x: number; y: number; vy: number; rotation: number; flap: number; anticipation: number; flapPending: boolean };
  pipes: { x: number; gapY: number; passed: boolean }[];
  cloudOffset: number;
  groundOffset: number;
  particles: Particle[];
  shake: number;
  demo: boolean;
  reducedMotion: boolean;
};

const initialState = (best = 0, demo = false): GameState => ({
  mode: "ready", score: 0, best, time: 0, last: 0,
  dragon: { x: 0, y: 0, vy: 0, rotation: 0, flap: 0, anticipation: 0, flapPending: false },
  pipes: [],   cloudOffset: 0, groundOffset: 0, particles: [], shake: 0, demo, reducedMotion: false,
});

function readScores(): ScoreRow[] {
  try {
    const parsed = JSON.parse(localStorage.getItem("flappy-dragon-scores") || "[]");
    return Array.isArray(parsed) ? parsed.filter((row): row is ScoreRow => row && typeof row.score === "number" && typeof row.name === "string" && typeof row.date === "string") : [];
  } catch { return []; }
}
function readBestScore(scores = readScores()): number {
  try {
    const stored = Number(localStorage.getItem("flappy-dragon-best") || 0);
    const fromScores = scores.reduce((highest, row) => Math.max(highest, row.score), 0);
    return Math.max(Number.isFinite(stored) ? stored : 0, fromScores);
  } catch { return scores.reduce((highest, row) => Math.max(highest, row.score), 0); }
}
function persistBestScore(score: number) {
  try { localStorage.setItem("flappy-dragon-best", String(score)); } catch { /* Storage can be unavailable in private browsing. */ }
}
let audioContext: AudioContext | null = null;
function playSfx(kind: "jump" | "score" | "crash") {
  if (typeof window === "undefined") return;
  const AudioCtor = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtor) return;
  audioContext ||= new AudioCtor();
  const ctx = audioContext as AudioContext;
  if (ctx.state === "suspended") void ctx.resume();
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  const settings = kind === "jump" ? { start: 320, end: 570, duration: 0.11, wave: "sine" as OscillatorType } : kind === "score" ? { start: 620, end: 980, duration: 0.18, wave: "triangle" as OscillatorType } : { start: 190, end: 72, duration: 0.34, wave: "sawtooth" as OscillatorType };
  osc.type = settings.wave; osc.frequency.setValueAtTime(settings.start, now); osc.frequency.exponentialRampToValueAtTime(settings.end, now + settings.duration);
  gain.gain.setValueAtTime(0.0001, now); gain.gain.exponentialRampToValueAtTime(kind === "crash" ? 0.16 : 0.11, now + 0.012); gain.gain.exponentialRampToValueAtTime(0.0001, now + settings.duration);
  osc.start(now); osc.stop(now + settings.duration + 0.02);
}

function burst(state: GameState, x: number, y: number, color: string, count: number) {
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 45 + Math.random() * 150;
    state.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 25, life: 0.45 + Math.random() * 0.35, maxLife: 0.8, size: 2 + Math.random() * 4, color, gravity: 160 + Math.random() * 180 });
  }
}

function saveScore(name: string, score: number) {
  const clean = name.replace(/[^a-z0-9 _-]/gi, "").trim().slice(0, 12) || "SKY PILOT";
  const next = [...readScores(), { name: clean, score, date: new Date().toISOString() }]
    .sort((a, b) => b.score - a.score).slice(0, 10);
  try { localStorage.setItem("flappy-dragon-scores", JSON.stringify(next)); } catch { /* Keep the in-memory score even if storage is unavailable. */ }
  return next;
}

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("ready");
  const [score, setScore] = useState(0);
  const [scores, setScores] = useState<ScoreRow[]>(() => readScores());
  const [best, setBest] = useState(() => readBestScore());
  const [showBoard, setShowBoard] = useState(false);
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => { if (typeof window === "undefined") return false; const stored = localStorage.getItem("flappy-dragon-reduced-motion"); return stored === null ? window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false : stored === "true"; });
  const stateRef = useRef<GameState>(initialState(best, new URLSearchParams(location.search).has("demo")));
  stateRef.current.reducedMotion = reducedMotion;
  const raf = useRef<number | undefined>(undefined);
  const dragonImg = useRef<HTMLImageElement | undefined>(undefined);
  const skyImg = useRef<HTMLImageElement | undefined>(undefined);

  useEffect(() => {
    const state = stateRef.current;
    state.best = best;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(rect.width * dpr); canvas.height = Math.floor(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!state.dragon.x) { state.dragon.x = rect.width * 0.27; state.dragon.y = rect.height * 0.47; } if (state.mode === "ready") { state.dragon.x = rect.width * 0.72; state.dragon.y = rect.height * 0.42; }
    };
    resize(); window.addEventListener("resize", resize);
    const loadImage = (src: string) => { const img = new Image(); img.src = src; return img; };
    dragonImg.current = loadImage(DRAGON); skyImg.current = loadImage(SKY); if (state.demo) { state.mode = "playing"; state.dragon.x = canvas.clientWidth * 0.28; state.dragon.y = canvas.clientHeight * 0.47; setMode("playing"); }

    const flap = () => {
      if (state.mode !== "playing") { state.mode = "playing"; state.score = 0; state.pipes = []; state.dragon.y = canvas.clientHeight * 0.47; state.dragon.vy = -440; state.dragon.flap = 1; state.dragon.anticipation = state.reducedMotion ? 0 : 1; state.dragon.flapPending = false; playSfx("jump"); setMode("playing"); setScore(0); setShowBoard(false); setSaved(false); return; }
      state.dragon.vy = -440; state.dragon.flap = 1; state.dragon.anticipation = state.reducedMotion ? 0 : 1; state.dragon.flapPending = false; playSfx("jump");
    };
    const key = (e: KeyboardEvent) => { if (["Space", "ArrowUp"].includes(e.code)) { e.preventDefault(); flap(); } };
    const pointer = () => flap();
    window.addEventListener("keydown", key); canvas.addEventListener("pointerdown", pointer);

    const draw = (now: number) => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const dt = Math.min((now - (state.last || now)) / 1000, 0.033); state.last = now; state.time += dt;
      state.particles.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.gravity * dt; p.life -= dt; }); state.particles = state.particles.filter(p => p.life > 0);
      if (state.mode === "playing") {
        state.dragon.vy += 1180 * dt; state.dragon.y += state.dragon.vy * dt; state.dragon.rotation = Math.max(-0.42, Math.min(1.15, state.dragon.vy / 650)); state.dragon.flap = Math.max(0, state.dragon.flap - dt * 5); state.dragon.anticipation = Math.max(0, state.dragon.anticipation - dt * 8);
        state.cloudOffset = (state.cloudOffset + 16 * dt) % 420; state.groundOffset = (state.groundOffset + 145 * dt) % 48;
        const speed = 188 + Math.min(state.score * 3, 72);
        if (!state.pipes.length || state.pipes[state.pipes.length - 1].x < w - 265) state.pipes.push({ x: w + 30, gapY: h * 0.34 + Math.random() * h * 0.28, passed: false });
        state.pipes.forEach(p => p.x -= speed * dt); state.pipes = state.pipes.filter(p => p.x > -90);
        const ground = h - 62, dragonR = 21;
        for (const p of state.pipes) {
          const gap = Math.max(145, 188 - state.score * 1.5), top = p.gapY - gap / 2, bottom = p.gapY + gap / 2;
          if (!p.passed && p.x + 76 < state.dragon.x) { p.passed = true; state.score += 1; setScore(state.score); playSfx("score"); burst(state, p.x + 38, state.dragon.y, "#ffe1a1", 14); }
          const hitX = state.dragon.x + dragonR > p.x && state.dragon.x - dragonR < p.x + 76;
          if (hitX && (state.dragon.y - dragonR < top || state.dragon.y + dragonR > bottom)) endGame();
        }
        if (state.dragon.y < 28 || state.dragon.y > ground - 4) endGame();
        if (state.demo && state.time > 1.1) { const target = state.pipes[0]?.gapY || h * .48; if (state.dragon.y > target + 18 || state.dragon.vy > 140) flap(); }
      }
      drawScene(ctx, w, h, state, skyImg.current, dragonImg.current);
      raf.current = requestAnimationFrame(draw);
    };
    const endGame = () => { if (state.mode !== "playing") return; playSfx("crash"); burst(state, state.dragon.x, state.dragon.y, "#e96f45", 30); state.mode = "over"; state.shake = 8; setMode("over"); setScore(state.score); if (state.score > best) { setBest(state.score); persistBestScore(state.score); } };
    (window as any).__flappyEnd = endGame;
    raf.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf.current!); window.removeEventListener("resize", resize); window.removeEventListener("keydown", key); canvas.removeEventListener("pointerdown", pointer); };
  }, [best]);

  const restart = () => { const s = stateRef.current; s.mode = "ready"; s.score = 0; s.pipes = []; s.time = 0; s.last = 0; s.dragon.y = (canvasRef.current?.clientHeight || 500) * .47; setMode("ready"); setScore(0); setShowBoard(false); setSaved(false); };
  const submit = () => { setScores(saveScore(name, score)); setSaved(true); };

  return <div ref={shellRef} className="game-shell">
    <canvas ref={canvasRef} aria-label="Flappy Dragon game canvas" />
    <div className="game-brand"><span className="brand-mark">✦</span><div><strong>FLAPPY DRAGON</strong><small>SKY ARCADE · FLIGHT LOG 01</small></div></div>
    <div className="hud"><span className="hud-label">SCORE</span><strong>{String(score).padStart(2, "0")}</strong><span className="hud-divider"/><span className="hud-label">BEST</span><strong>{String(best).padStart(2, "0")}</strong></div>
    {mode === "ready" && <div className="screen-card intro-card"><div className="intro-mascot-wrap"><img className="intro-mascot" src={dragonMascotFlapping} alt="The Flappy Dragon mascot with its wings spread" /><span className="mascot-caption">YOUR PILOT</span></div><div className="eyebrow">A tiny dragon. A very big sky.</div><h1>Keep your<br/><em>wings clear.</em></h1><p>Tap, click, or press Space to rise through the ruins. How far can you fly?</p><button onClick={() => (canvasRef.current?.dispatchEvent(new PointerEvent("pointerdown")))} className="primary-button"><span>START FLIGHT</span><b>↗</b></button><div className="hint"><span>SPACE</span> or tap anywhere</div></div>}
    {mode === "playing" && <div className="flight-tip">TAP TO FLAP <span>·</span> STAY LIGHT</div>}
    {mode === "over" && <div className="screen-card over-card"><div className="eyebrow">Flight log complete</div><h2>Clouds caught you.</h2><div className="result-line"><div><small>SCORE</small><strong>{score}</strong></div><div><small>BEST</small><strong>{best}</strong></div></div>{!saved ? <><label className="name-label" htmlFor="pilot-name">Save this flight</label><div className="name-row"><input id="pilot-name" maxLength={12} placeholder="YOUR NAME" value={name} onChange={e => setName(e.target.value)} /><button onClick={submit} className="small-button">SAVE</button></div></> : <div className="saved-note">✦ Flight logged to the hall of fame.</div>}<div className="over-actions"><button onClick={restart} className="primary-button"><span>FLY AGAIN</span><b>↗</b></button><button onClick={() => setShowBoard(true)} className="quiet-button">VIEW LEADERBOARD <span>→</span></button></div></div>}
    <div className="bottom-rail"><button className="rail-button" onClick={() => setShowBoard(true)}>✦ <span>FLIGHT LOG</span></button><span className="rail-copy">MADE FOR REPLAY · DRAGONS WELCOME</span><div className="rail-actions"><button className="rail-button sound">◒ <span>SOUND ON</span></button><button className="rail-button" onClick={() => setSettingsOpen(true)} aria-label="Open settings">⚙ <span>SETTINGS</span></button></div></div>
    {settingsOpen && <div className="settings-backdrop" onClick={() => setSettingsOpen(false)}><section className="settings-card" role="dialog" aria-modal="true" aria-labelledby="settings-title" onClick={e => e.stopPropagation()}><button className="close" onClick={() => setSettingsOpen(false)} aria-label="Close settings">×</button><div className="eyebrow">Flight preferences</div><h2 id="settings-title">Settings</h2><p>Adjust motion to keep the flight comfortable.</p><div className="setting-row"><div><strong>Reduced motion</strong><small>Keeps gameplay movement calmer without changing the uploaded dragon animation.</small></div><button className={`motion-toggle ${reducedMotion ? "is-on" : ""}`} role="switch" aria-checked={reducedMotion} onClick={() => { const next = !reducedMotion; setReducedMotion(next); localStorage.setItem("flappy-dragon-reduced-motion", String(next)); }}><span /></button></div><button className="settings-done" onClick={() => setSettingsOpen(false)}>DONE</button></section></div>}
    {showBoard && <div className="board-backdrop" onClick={() => setShowBoard(false)}><div className="leaderboard" onClick={e => e.stopPropagation()}><button className="close" onClick={() => setShowBoard(false)}>×</button><div className="eyebrow">The flight log</div><h2>Hall of the sky</h2><p>Local scores from this browser.</p>{scores.length ? <div className="score-list">{scores.map((row, i) => <div className="score-row" key={`${row.date}-${i}`}><span className="rank">{String(i + 1).padStart(2, "0")}</span><strong>{row.name}</strong><b>{row.score}</b></div>)}</div> : <div className="empty-board">No flights logged yet.<br/>Be the first one through the clouds.</div>}<button className="primary-button board-cta" onClick={() => { setShowBoard(false); restart(); }}><span>TAKE OFF</span><b>↗</b></button></div></div>}
  </div>;
}

function drawScene(ctx: CanvasRenderingContext2D, w: number, h: number, state: GameState, sky: HTMLImageElement | undefined, dragon: HTMLImageElement | undefined) {
  ctx.save(); if (state.shake > 0) { ctx.translate(Math.random() * state.shake - state.shake / 2, Math.random() * state.shake - state.shake / 2); state.shake *= .9; }
  const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#061231"); g.addColorStop(.55, "#0a2b62"); g.addColorStop(1, "#06112e"); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  if (sky?.complete && sky.naturalWidth) { const scale = Math.max(w / sky.width, h / sky.height); ctx.drawImage(sky, 0, 0, sky.width * scale, sky.height * scale); }
  for (const p of state.pipes) drawPipe(ctx, p.x, p.gapY, Math.max(145, 188 - state.score * 1.5), h);
  drawParticles(ctx, state.particles);
  ctx.fillStyle = "#57445f"; ctx.fillRect(0, h - 62, w, 62); ctx.fillStyle = "#f2b26f"; for (let x = -48 - state.groundOffset; x < w + 48; x += 48) ctx.fillRect(x, h - 62, 30, 5); ctx.fillStyle = "#3f354e"; ctx.fillRect(0, h - 12, w, 12);
  const d = state.dragon; ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.rotation); if (dragon?.complete && dragon.naturalWidth) { ctx.drawImage(dragon, -54, -30, 108, 61); } else { ctx.fillStyle = "#f4f0ef"; ctx.strokeStyle = "#6e6674"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, 27, 19, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); } ctx.restore(); ctx.restore();
}
function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  ctx.save(); particles.forEach(p => { ctx.globalAlpha = Math.max(0, p.life / p.maxLife); ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.65 + p.life / p.maxLife), 0, Math.PI * 2); ctx.fill(); }); ctx.restore();
}
function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) { ctx.save(); ctx.globalAlpha = .16; ctx.fillStyle = "#fff2cf"; ctx.beginPath(); ctx.arc(x, y, 28 * s, 0, Math.PI * 2); ctx.arc(x + 34 * s, y - 13 * s, 39 * s, 0, Math.PI * 2); ctx.arc(x + 77 * s, y, 24 * s, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
function drawPipe(ctx: CanvasRenderingContext2D, x: number, gapY: number, gap: number, h: number) { const top = gapY - gap / 2, bottom = gapY + gap / 2; ctx.fillStyle = "#5d7561"; ctx.fillRect(x, 0, 76, top); ctx.fillRect(x, bottom, 76, h - bottom - 62); ctx.fillStyle = "#89a266"; ctx.fillRect(x - 7, top - 18, 90, 18); ctx.fillRect(x - 7, bottom, 90, 18); ctx.fillStyle = "#3f5d54"; ctx.fillRect(x + 12, 0, 9, Math.max(0, top - 18)); ctx.fillRect(x + 12, bottom + 18, 9, h - bottom - 80); }
