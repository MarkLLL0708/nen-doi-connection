import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Eraser, Trash2, Undo2 } from "lucide-react";
import { Pressable, PrimaryButton, haptic } from "@/components/visual";

const SIZE = 720;
const TOKENS = ["--ink", "--ember", "--butter", "--plum", "--blush"] as const;
const WIDTHS = [6, 16, 34] as const;

function token(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

type Stroke = { colour: string; width: number; erase: boolean; pts: [number, number][] };

/** Shared drawing surface: Colour Block palette only, works with finger, pen or mouse. */
export function DrawCanvas({ background, submitLabel, busy, submitSignal, onSubmit, disabled }: {
  background?: string | null;
  submitLabel: string;
  busy?: boolean;
  submitSignal?: number;
  disabled?: boolean;
  onSubmit: (dataUrl: string) => void;
}) {
  const { t } = useTranslation();
  const canvas = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<Stroke[]>([]);
  const current = useRef<Stroke | null>(null);
  const bg = useRef<HTMLImageElement | null>(null);
  const [colour, setColour] = useState(0);
  const [width, setWidth] = useState(1);
  const [erase, setErase] = useState(false);
  const [count, setCount] = useState(0);

  const redraw = useCallback(() => {
    const c = canvas.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    ctx.fillStyle = token("--cream", "#F5EFE6");
    ctx.fillRect(0, 0, SIZE, SIZE);
    if (bg.current) ctx.drawImage(bg.current, 0, 0, SIZE, SIZE);
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    const all = current.current ? [...strokes.current, current.current] : strokes.current;
    for (const s of all) {
      ctx.globalCompositeOperation = s.erase ? "destination-out" : "source-over";
      ctx.strokeStyle = s.colour; ctx.lineWidth = s.width;
      ctx.beginPath();
      s.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      if (s.pts.length === 1) ctx.lineTo(s.pts[0]![0] + 0.1, s.pts[0]![1]);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";
  }, []);

  useEffect(() => {
    if (!background) { bg.current = null; redraw(); return; }
    const img = new Image();
    img.onload = () => { bg.current = img; redraw(); };
    img.src = background;
  }, [background, redraw]);

  useEffect(() => { redraw(); }, [redraw]);

  const submit = useCallback(() => {
    const c = canvas.current; if (!c) return;
    onSubmit(c.toDataURL("image/png"));
  }, [onSubmit]);

  const fired = useRef(0);
  useEffect(() => {
    if (!submitSignal || submitSignal === fired.current) return;
    fired.current = submitSignal;
    submit();
  }, [submitSignal, submit]);

  const at = (e: React.PointerEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * SIZE, ((e.clientY - r.top) / r.height) * SIZE] as [number, number];
  };
  const down = (e: React.PointerEvent) => {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    current.current = { colour: token(TOKENS[colour]!, "#121212"), width: WIDTHS[width]!, erase, pts: [at(e)] };
    redraw();
  };
  const move = (e: React.PointerEvent) => {
    if (!current.current) return;
    current.current.pts.push(at(e));
    redraw();
  };
  const up = () => {
    if (!current.current) return;
    strokes.current = [...strokes.current, current.current];
    current.current = null;
    setCount(strokes.current.length);
    redraw();
  };

  const undo = () => { strokes.current = strokes.current.slice(0, -1); setCount(strokes.current.length); redraw(); haptic(8); };
  const clear = () => { strokes.current = []; setCount(0); redraw(); haptic(12); };

  return <div>
    <canvas ref={canvas} width={SIZE} height={SIZE} aria-label={t("feat.draw.canvasAria")}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onPointerLeave={up}
      className="aspect-square w-full touch-none rounded-[24px] bg-cream" style={{ touchAction: "none" }} />

    <div className="mt-3 flex flex-wrap items-center gap-2">
      {TOKENS.map((tk, i) => <Pressable key={tk} aria-label={t(`feat.draw.colours.${tk.slice(2)}`)} aria-pressed={!erase && colour === i}
        onClick={() => { setColour(i); setErase(false); }}
         className={`size-11 rounded-full ${tk === "--ink" ? "block-ink" : tk === "--ember" ? "block-ember" : tk === "--butter" ? "block-butter" : tk === "--plum" ? "block-plum" : "block-blush"} ${!erase && colour === i ? "ring-4 ring-foreground" : ""}`} />)}
      <Pressable haptics aria-pressed={erase} aria-label={t("feat.draw.eraser")} onClick={() => setErase(true)}
        className={`grid size-11 place-items-center rounded-full ${erase ? "block-ember" : "bg-surface"}`}><Eraser strokeWidth={2} className="size-5" aria-hidden="true" /></Pressable>
    </div>

    <div className="mt-2 flex flex-wrap items-center gap-2">
      {WIDTHS.map((w, i) => <Pressable key={w} aria-pressed={width === i} aria-label={t(`feat.draw.sizes.${i}`)} onClick={() => setWidth(i)}
        className={`grid h-11 min-w-11 place-items-center rounded-full px-3 ${width === i ? "block-ink" : "bg-surface"}`}>
        <span className="block rounded-full bg-current" style={{ width: w / 2 + 4, height: w / 2 + 4 }} /></Pressable>)}
      <Pressable haptics disabled={!count} aria-label={t("feat.draw.undo")} onClick={undo} className="grid size-11 place-items-center rounded-full bg-surface disabled:opacity-40"><Undo2 strokeWidth={2} className="size-5" aria-hidden="true" /></Pressable>
      <Pressable haptics disabled={!count} aria-label={t("feat.draw.clear")} onClick={clear} className="grid size-11 place-items-center rounded-full bg-surface disabled:opacity-40"><Trash2 strokeWidth={2} className="size-5" aria-hidden="true" /></Pressable>
    </div>

    <PrimaryButton className="mt-3" disabled={busy || disabled} onClick={submit}>{submitLabel}</PrimaryButton>
  </div>;
}
