// TEST MODE ONLY — see TEST_MODE_REMOVAL.md. Rendered only when TEST_MODE_ENABLED (dev/preview build).
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
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
    <div className="pointer-events-none fixed inset-x-0 bottom-28 z-50 mx-auto max-w-[390px]">
      <Pressable onClick={() => setOpen(true)} aria-label={t("test.title")}
        className="pointer-events-auto absolute left-3 rounded-full bg-butter px-4 py-2 type-label text-ink shadow-float">
        {t("test.pill")}{who ? ` · ${who}` : ""}
      </Pressable>
    </div>
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
