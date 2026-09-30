import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ThumbBurst } from "@/components/app/ThumbBurst";
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
  const [conn, setConn] = useState<"on" | "retry" | "off">("retry");
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const celebrated = useRef(0);

  const { data: total } = useQuery({ queryKey: ["thumb-count", coupleId], enabled: !!coupleId, queryFn: async () => {
    const { count: c } = await supabase.from("thumb_syncs").select("id", { count: "exact", head: true });
    return c ?? 0;
  } });

  /** Both phones celebrate off the same signal, whichever one noticed first. */
  const celebrate = (at: number) => {
    if (celebrated.current && at - celebrated.current < 2000) return;
    celebrated.current = at;
    setSynced(true); setBurst(at);
    try { navigator.vibrate?.([60, 40, 120]); } catch { /* unsupported */ }
  };

  useEffect(() => {
    if (!coupleId || !me) return;
    let closed = false;

    const connect = () => {
      if (closed) return;
      setConn("retry");
      // Private channel: the database only lets the two pair members join it.
      const ch = supabase.channel(`thumb:${coupleId}`, { config: { private: true, presence: { key: me.userId } } });
      ch.on("presence", { event: "sync" }, () => {
        const others = Object.entries(ch.presenceState<PresenceState>()).filter(([k]) => k !== me.userId).flatMap(([, v]) => v);
        setPartnerHere(others.length > 0);
        setPartnerPressing(others.some((p) => p.pressing));
      }).on("broadcast", { event: "press" }, ({ payload }) => {
        // Faster than presence; presence remains the source of truth for who is here.
        if (payload?.user_id !== me.userId) { setPartnerHere(true); setPartnerPressing(!!payload?.pressing); }
      }).on("broadcast", { event: "sync" }, ({ payload }) => {
        if (payload?.user_id !== me.userId) celebrate(Number(payload?.at) || Date.now());
      }).subscribe((s) => {
        if (s === "SUBSCRIBED") { setConn("on"); void ch.track({ user_id: me.userId, pressing: false }); }
        else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT") setConn("off");
        else if (s === "CLOSED") setConn("retry");
      });
      channelRef.current = ch;
    };
    connect();

    // Phones freeze the socket when the screen locks — rebuild it on resume.
    const resume = () => {
      if (document.visibilityState !== "visible") return;
      const old = channelRef.current;
      channelRef.current = null;
      if (old) void supabase.removeChannel(old);
      setPartnerHere(false); setPartnerPressing(false);
      connect();
    };
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("focus", resume);
    window.addEventListener("online", resume);
    return () => {
      closed = true;
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("focus", resume);
      window.removeEventListener("online", resume);
      const old = channelRef.current;
      channelRef.current = null;
      if (old) void supabase.removeChannel(old);
    };
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
    const at = Date.now();
    celebrate(at);
    void channelRef.current?.send({ type: "broadcast", event: "sync", payload: { user_id: me?.userId, at } });
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
      <span className="ml-auto flex items-center gap-2 rounded-full bg-current/10 px-3 py-1.5 type-caption">
        <span aria-hidden="true" className={`size-2.5 rounded-full ${conn === "on" ? "bg-[var(--butter)]" : conn === "retry" ? "bg-[var(--blush)]" : "bg-[var(--ember)]"}`} />
        {t(`feat.thumb.conn.${conn}`)}
      </span>
    </header>

    <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-8 px-6 text-center">
      <p className="type-display text-[24px] leading-[1.2]" aria-live="polite">{status}</p>
      <div className="relative grid place-items-center">
      <ThumbBurst fire={burst} />
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
      </div>
      <p className="type-caption opacity-80">{t("feat.thumb.hint")}</p>
      <p className="type-caption opacity-80">{t("feat.thumb.count", { count: shown })}</p>
    </div>

    {!solo && !partnerHere && <div className="relative z-10 px-6 pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
      <PrimaryButton disabled={nudge === "sent"} onClick={() => void sendNudge()}>{nudge === "sent" ? t("feat.thumb.nudgeSent", { partner }) : t("feat.thumb.nudge", { partner })}</PrimaryButton>
      {nudge === "wait" && <p className="mt-2 text-center type-caption opacity-80">{t("feat.thumb.nudgeWait")}</p>}
      {nudge === "err" && <p className="mt-2 text-center type-caption opacity-80">{t("feat.thumb.nudgeErr")}</p>}
    </div>}
  </div>;
}
