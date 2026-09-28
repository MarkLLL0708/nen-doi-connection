// TEST MODE ONLY — see TEST_MODE_REMOVAL.md. Rendered only when TEST_MODE_ENABLED (dev/preview build).
import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { BottomSheet, Pressable, PrimaryButton, SecondaryButton } from "@/components/visual";
import { testClearAll, testClearToday, testSetupCouple, testSignIn } from "@/lib/testmode.functions";
import { FAKE_HOUR_KEY, SAMPLE_PHOTOS_KEY, currentWho, forgetTestSessions, switchTo, type Who } from "@/lib/testmode";

export function TestPill() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const router = useRouter();
  const signIn = useServerFn(testSignIn), setup = useServerFn(testSetupCouple), clearToday = useServerFn(testClearToday), clearAll = useServerFn(testClearAll);
  const [open, setOpen] = useState(false), [who, setWho] = useState<Who | null>(null);
  const [busy, setBusy] = useState(false), [msg, setMsg] = useState<string | null>(null);
  const [samples, setSamples] = useState(false), [late, setLate] = useState(false);

  useEffect(() => {
    setWho(currentWho());
    setSamples(localStorage.getItem(SAMPLE_PHOTOS_KEY) === "1");
    setLate(localStorage.getItem(FAKE_HOUR_KEY) === "20.5");
  }, [open]);

  const run = async (fn: () => Promise<string | void>) => {
    setBusy(true); setMsg(null);
    try { const m = await fn(); if (m) setMsg(m); }
    catch (e) { setMsg(/403|off/i.test(String(e)) ? t("test.off") : t("test.error")); }
    setBusy(false);
  };
  const refresh = async () => { await qc.resetQueries(); await router.invalidate(); };
  const doSwitch = (to: Who) => run(async () => {
    await switchTo(to, () => signIn({ data: { who: to } }));
    setWho(to); await refresh();
  });
  const other: Who = who === "A" ? "B" : "A";
  const toggle = (key: string, on: boolean, val: string, set: (b: boolean) => void) => {
    if (on) localStorage.setItem(key, val); else localStorage.removeItem(key);
    set(on); void qc.invalidateQueries();
  };

  return <>
    <FloatingHandle label={who ? `${t("test.pill")} · ${who}` : t("test.pill")} aria={t("test.title")} collapseLabel={t("test.collapse")} onOpen={() => setOpen(true)} />
    <BottomSheet open={open} onOpenChange={setOpen}>
      <p className="type-label text-muted-foreground">{t("test.title")}</p>
      <p className="mt-2 type-title">{who ? `${t("test.now")} Thử ${who}` : t("test.nobody")}</p>
      <PrimaryButton className="mt-5" disabled={busy} onClick={() => void doSwitch(who ? other : "A")}>
        {busy ? t("test.working") : who ? t("test.switchTo", { who: `Thử ${other}` }) : t("test.signInAs", { who: "Thử A" })}
      </PrimaryButton>
      <div className="mt-3 grid grid-cols-1 gap-2">
        <SecondaryButton disabled={busy} onClick={() => void run(async () => { const r = await setup(); await refresh(); return r.created ? t("test.setupNew") : t("test.setupDone"); })}>{t("test.setup")}</SecondaryButton>
        <SecondaryButton disabled={busy} onClick={() => void run(async () => { await clearToday(); await refresh(); return t("test.clearedToday"); })}>{t("test.clearToday")}</SecondaryButton>
        <SecondaryButton disabled={busy} onClick={() => void run(async () => { await clearAll(); forgetTestSessions(); setWho(null); await refresh(); return t("test.clearedAll"); })}>{t("test.clearAll")}</SecondaryButton>
      </div>
      <label className="mt-5 flex items-center justify-between gap-3">
        <span><span className="block type-button">{t("test.samples")}</span><span className="type-caption text-muted-foreground">{t("test.samplesNote")}</span></span>
        <input type="checkbox" className="size-6 accent-[var(--ember)]" checked={samples} onChange={(e) => toggle(SAMPLE_PHOTOS_KEY, e.target.checked, "1", setSamples)} />
      </label>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="type-button">{t("test.hour")}</span>
        <div className="flex gap-1 rounded-full bg-surface p-1">
          {[false, true].map((v) => <Pressable key={String(v)} aria-pressed={late === v} onClick={() => toggle(FAKE_HOUR_KEY, v, "20.5", setLate)}
            className={`rounded-full px-4 py-2 type-label ${late === v ? "bg-ink text-cream" : ""}`}>{v ? t("test.hourLate") : t("test.hourNormal")}</Pressable>)}
        </div>
      </div>
      {msg && <p role="status" className="mt-4 rounded-[18px] bg-ink px-4 py-3 type-button text-cream">{msg}</p>}
    </BottomSheet>
  </>;
}

// Draggable handle: drag anywhere, tap to open, collapse to a dot. Position + collapsed state persist.
const POS_KEY = "nendoi.test.pillPos", DOT_KEY = "nendoi.test.pillDot";
type Pos = { x: number; y: number };
function FloatingHandle({ label, aria, collapseLabel, onOpen }: { label: string; aria: string; collapseLabel: string; onOpen: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [saved, setSaved] = useState<Pos | null>(null), [dot, setDot] = useState<boolean | null>(null);
  const [vp, setVp] = useState({ w: 390, h: 800 }), [drag, setDrag] = useState<Pos | null>(null);
  const start = useRef<{ px: number; py: number; x: number; y: number; moved: boolean } | null>(null);
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    try { const p = localStorage.getItem(POS_KEY); if (p) setSaved(JSON.parse(p) as Pos); } catch { /* ignore */ }
    const d = localStorage.getItem(DOT_KEY); setDot(d === null ? null : d === "1");
    const r = () => setVp({ w: window.innerWidth, h: window.innerHeight }); r();
    window.addEventListener("resize", r); return () => window.removeEventListener("resize", r);
  }, []);
  const hasTabs = path === "/app";
  // Off the tab screen the handle is a dot unless just tapped open; it folds back on every page change.
  const [peek, setPeek] = useState(false);
  useEffect(() => { setPeek(false); }, [path]);
  const collapsed = hasTabs ? !!dot : !peek;
  const size = collapsed ? { w: 28, h: 28 } : { w: 110, h: 36 };
  // Parked in the top bar, left of the language/theme pill: the only strip no screen fills with content.
  const def: Pos = { x: vp.w - size.w - 104, y: 20 };
  const clamp = (p: Pos): Pos => ({ x: Math.min(Math.max(2, p.x), vp.w - size.w - 2), y: Math.min(Math.max(8, p.y), vp.h - size.h - 8) });
  const pos = clamp(drag ?? saved ?? def);
  const down = (e: RPointerEvent) => { if ((e.target as HTMLElement).closest("button")) return; start.current = { px: e.clientX, py: e.clientY, x: pos.x, y: pos.y, moved: false }; el.current?.setPointerCapture(e.pointerId); };
  const move = (e: RPointerEvent) => {
    const s = start.current; if (!s) return;
    const dx = e.clientX - s.px, dy = e.clientY - s.py;
    if (!s.moved && Math.hypot(dx, dy) < 6) return;
    s.moved = true; setDrag({ x: s.x + dx, y: s.y + dy });
  };
  const up = () => {
    const s = start.current; start.current = null; if (!s) return;
    if (s.moved && drag) { const p = clamp(drag); setSaved(p); localStorage.setItem(POS_KEY, JSON.stringify(p)); setDrag(null); }
    else if (collapsed) setCollapsed(false); else { onOpen(); if (!hasTabs) setPeek(false); }
  };
  const setCollapsed = (v: boolean) => { if (!hasTabs) { setPeek(!v); return; } setDot(v); localStorage.setItem(DOT_KEY, v ? "1" : "0"); };
  return <div ref={el} role="button" tabIndex={0} aria-label={aria} data-testid="test-pill"
    onPointerDown={down} onPointerMove={move} onPointerUp={up} onKeyDown={(e) => { if (e.key === "Enter") onOpen(); }}
    style={{ left: pos.x, top: pos.y, touchAction: "none" }}
    className={`fixed z-50 flex cursor-grab select-none items-center rounded-full bg-butter text-ink shadow-float ${collapsed ? "size-7 justify-center" : "h-9 gap-2 pl-4 pr-1"}`}>
    {collapsed
      ? <span className="size-2.5 rounded-full bg-ink" />
      : <><span className="type-label whitespace-nowrap">{label}</span>
        <button type="button" aria-label={collapseLabel} onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onClick={() => setCollapsed(true)}
          className="grid size-7 place-items-center rounded-full bg-ink text-cream type-label">–</button></>}
  </div>;
}
