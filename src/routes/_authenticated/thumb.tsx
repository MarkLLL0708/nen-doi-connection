import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ColourFlood, FlameMark, GeometricBurst, PrimaryButton } from "@/components/visual";
import { Shell } from "@/components/app/Shell";
import { useMe } from "@/lib/couple";
import i18n from "@/i18n";

export const Route = createFileRoute("/_authenticated/thumb")({
  head: () => ({ meta: [
    { title: i18n.t("feat.thumb.metaTitle") }, { name: "description", content: i18n.t("feat.thumb.metaDesc") },
    { property: "og:title", content: i18n.t("feat.thumb.metaTitle") }, { property: "og:description", content: i18n.t("feat.thumb.metaDesc") },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: ThumbScreen,
});

type PresenceState = { user_id: string; pressing: boolean };

function ThumbScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const { data: me } = useMe();
  const coupleId = me?.couple?.id;
  const partner = me?.profile?.partner_call_name || me?.partner?.display_name || t("app.setup.call.ban");

  const [pressing, setPressing] = useState(false);
  const [partnerHere, setPartnerHere] = useState(false);
  const [partnerPressing, setPartnerPressing] = useState(false);
  const [synced, setSynced] = useState(false);
  const [burst, setBurst] = useState(0);
  const [count, setCount] = useState<number | null>(null);
  const [nudge, setNudge] = useState<"idle" | "sent" | "wait" | "err">("idle");
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const { data: total } = useQuery({ queryKey: ["thumb-count", coupleId], enabled: !!coupleId, queryFn: async () => {
    const { count: c } = await supabase.from("thumb_syncs").select("id", { count: "exact", head: true });
    return c ?? 0;
  } });

  useEffect(() => {
    if (!coupleId || !me) return;
    // Private channel: the database only lets the two pair members join it.
    const ch = supabase.channel(`thumb:${coupleId}`, { config: { private: true, presence: { key: me.userId } } });
    ch.on("presence", { event: "sync" }, () => {
      const others = Object.entries(ch.presenceState<PresenceState>()).filter(([k]) => k !== me.userId).flatMap(([, v]) => v);
      setPartnerHere(others.length > 0);
      setPartnerPressing(others.some((p) => p.pressing));
    }).on("broadcast", { event: "press" }, ({ payload }) => {
      // Faster than presence; presence remains the source of truth for who is here.
      if (payload?.user_id !== me.userId) { setPartnerHere(true); setPartnerPressing(!!payload?.pressing); }
    }).subscribe((s) => { if (s === "SUBSCRIBED") void ch.track({ user_id: me.userId, pressing: false }); });
    channelRef.current = ch;
    return () => { channelRef.current = null; void supabase.removeChannel(ch); };
  }, [coupleId, me?.userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const setPress = (v: boolean) => {
    setPressing(v);
    if (!me) return;
    void channelRef.current?.send({ type: "broadcast", event: "press", payload: { user_id: me.userId, pressing: v } });
    void channelRef.current?.track({ user_id: me.userId, pressing: v });
  };

  const both = pressing && partnerPressing;
  useEffect(() => {
    if (!both) { setSynced(false); return; }
    if (synced) return;
    setSynced(true); setBurst(Date.now());
    try { navigator.vibrate?.([60, 40, 120]); } catch { /* unsupported */ }
    void supabase.rpc("log_thumb_sync").then(({ data }) => { if (typeof data === "number") setCount(data); });
  }, [both]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendNudge = async () => {
    const { data, error } = await supabase.rpc("send_thumb_nudge");
    setNudge(error ? "err" : data ? "sent" : "wait");
  };

  if (!me?.couple) return <Shell><div className="grid flex-1 place-items-center"><FlameMark size={40} /></div></Shell>;
  const solo = me.members.length < 2;
  const shown = count ?? total ?? 0;
  const status = solo ? t("feat.thumb.solo") : both ? t("feat.thumb.synced", { partner })
    : partnerPressing ? t("feat.thumb.partnerHolding", { partner }) : partnerHere ? t("feat.thumb.together", { partner }) : t("feat.thumb.waiting", { partner });

  return <div className="block-ink relative flex min-h-dvh flex-col overflow-hidden">
    <ColourFlood at={null} active={synced} colourClass="block-ember" />
    <GeometricBurst fire={burst} />
    <header className="relative z-10 flex items-center gap-3 px-5 py-4">
      <button onClick={() => void navigate({ to: "/app" })} aria-label={t("feat.thumb.back")} className="grid size-11 place-items-center rounded-full bg-surface text-foreground">
        <ArrowLeft strokeWidth={2} className="size-5" aria-hidden="true" />
      </button>
      <p className="type-title text-[20px]">{t("feat.thumb.title")}</p>
    </header>

    <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-8 px-6 text-center">
      <p className="type-display text-[24px] leading-[1.2]" aria-live="polite">{status}</p>
      <motion.button type="button" aria-label={t("feat.thumb.hold")} disabled={solo}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setPress(true); }}
        onPointerUp={() => setPress(false)} onPointerCancel={() => setPress(false)} onContextMenu={(e) => e.preventDefault()}
        className={`relative grid size-56 touch-none select-none place-items-center rounded-full ${pressing ? "block-ember" : "block-butter"}`}
        animate={reduce ? {} : pressing ? { scale: [1, 1.06, 1], boxShadow: ["0 0 0 0 var(--ember)", "0 0 0 28px transparent", "0 0 0 0 transparent"] } : { scale: 1 }}
        transition={pressing ? { duration: 1.1, repeat: Infinity } : { type: "spring", stiffness: 400, damping: 28 }}>
        <span aria-hidden="true" className="absolute inset-8 rounded-full border-2 border-current opacity-40" />
        <span aria-hidden="true" className="absolute inset-16 rounded-full border-2 border-current opacity-60" />
        <span aria-hidden="true" className="absolute inset-24 rounded-full border-2 border-current" />
        {partnerPressing && <span aria-hidden="true" className="absolute -inset-3 rounded-full border-2 border-[var(--blush)]" />}
      </motion.button>
      <p className="type-caption opacity-80">{t("feat.thumb.hint")}</p>
      <p className="type-caption opacity-80">{t("feat.thumb.count", { count: shown })}</p>
    </div>

    {!solo && !partnerHere && <div className="relative z-10 px-6 pb-10">
      <PrimaryButton disabled={nudge === "sent"} onClick={() => void sendNudge()}>{nudge === "sent" ? t("feat.thumb.nudgeSent", { partner }) : t("feat.thumb.nudge", { partner })}</PrimaryButton>
      {nudge === "wait" && <p className="mt-2 text-center type-caption opacity-80">{t("feat.thumb.nudgeWait")}</p>}
      {nudge === "err" && <p className="mt-2 text-center type-caption opacity-80">{t("feat.thumb.nudgeErr")}</p>}
    </div>}
  </div>;
}
