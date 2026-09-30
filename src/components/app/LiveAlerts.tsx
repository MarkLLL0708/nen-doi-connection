import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Brush, Camera, Fingerprint, Gamepad2, Mail, MessageCircle, Compass, X, type LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Pressable, spring } from "@/components/visual";
import { useMe } from "@/lib/couple";
import { MEM_VIEW_KEY } from "@/components/app/NotificationBell";

type Row = { id: string; kind: string; data: Record<string, unknown> | null; created_at: string };
type Target = { kind: "question" | "photo" | "play" | "draw" | "duel" | "thumb" | "explore" | "memories" };

const meta: Record<string, { tone: string; icon: LucideIcon; target: Target["kind"] }> = {
  question_answered: { tone: "block-plum", icon: MessageCircle, target: "question" },
  photo_received: { tone: "block-butter", icon: Camera, target: "photo" },
  game_turn: { tone: "block-blush", icon: Gamepad2, target: "play" },
  drawing_received: { tone: "block-plum", icon: Brush, target: "draw" },
  duel_started: { tone: "block-ember", icon: Brush, target: "duel" },
  duel_drawing: { tone: "block-ember", icon: Brush, target: "duel" },
  thumb_nudge: { tone: "block-ember", icon: Fingerprint, target: "thumb" },
  thumb_synced: { tone: "block-ember", icon: Fingerprint, target: "thumb" },
  category_request: { tone: "block-ember", icon: Compass, target: "explore" },
  category_accepted: { tone: "block-plum", icon: Compass, target: "explore" },
  category_declined: { tone: "block-plum", icon: Compass, target: "explore" },
  capsule_received: { tone: "block-blush", icon: Mail, target: "memories" },
  capsule_unlocked: { tone: "block-blush", icon: Mail, target: "memories" },
};

/**
 * One live listener for the signed-in person, alive on every screen.
 * Anything the partner does arrives over the socket in about a second and
 * opens a full-width card that stays until it is dismissed on purpose.
 */
export function LiveAlerts() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const { data: me } = useMe();
  const [userId, setUserId] = useState<string | null>(null);
  const [queue, setQueue] = useState<Row[]>([]);
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setUserId(s?.user.id ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  const refresh = useCallback((kind: string) => {
    const keys: string[][] = [["notifications"]];
    if (kind === "question_answered") keys.push(["answers"], ["todayQuestion"], ["today"]);
    if (kind === "photo_received") keys.push(["photos"], ["today"]);
    if (kind === "game_turn") keys.push(["gameRound"], ["today"]);
    if (kind.startsWith("category_")) keys.push(["categoryState"], ["todayQuestion"], ["today"]);
    if (kind.startsWith("duel") || kind === "drawing_received") keys.push(["drawings"], ["duel"]);
    if (kind.startsWith("thumb")) keys.push(["thumb-count"]);
    if (kind.startsWith("capsule")) keys.push(["capsules"]);
    keys.forEach((k) => void qc.invalidateQueries({ queryKey: k }));
  }, [qc]);

  useEffect(() => {
    if (!userId) return;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let closed = false;

    const connect = () => {
      if (closed) return;
      channel = supabase
        .channel(`live:${userId}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
          ({ new: row }) => {
            const n = row as Row;
            if (seen.current.has(n.id)) return;
            seen.current.add(n.id);
            refresh(n.kind);
            setQueue((q) => [...q, n]);
            try { navigator.vibrate?.([40, 30, 40]); } catch { /* unsupported */ }
          })
        .subscribe();
    };
    connect();

    // Phones freeze the socket when the screen locks — rebuild it on resume.
    const resume = () => {
      if (document.visibilityState !== "visible") return;
      if (channel) void supabase.removeChannel(channel);
      channel = null;
      connect();
      void qc.invalidateQueries();
    };
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("focus", resume);
    window.addEventListener("online", resume);
    return () => {
      closed = true;
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("focus", resume);
      window.removeEventListener("online", resume);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [userId, refresh, qc]);

  const current = queue[0];
  if (!current) return null;

  const partner = me?.profile?.partner_call_name || me?.partner?.display_name || t("app.setup.call.ban");
  const m = meta[current.kind] ?? { tone: "block-ember", icon: MessageCircle, target: "memories" as const };
  const Icon = m.icon;
  const d = (current.data ?? {}) as { type?: string; pack?: string };
  const body = t(`feat.notif.${current.kind}`, {
    partner,
    type: t(`feat.capsule.types.${d.type ?? "miss"}`),
    category: t(`question.packs.${d.pack ?? "memory"}`),
    defaultValue: t("feat.notif.alertTitle.default"),
  });
  const title = t(`feat.notif.alertTitle.${current.kind}`, { defaultValue: t("feat.notif.alertTitle.default") });
  const cta = t(`feat.notif.cta.${current.kind}`, { defaultValue: t("feat.notif.cta.default") });

  const close = () => setQueue((q) => q.slice(1));
  const go = () => {
    close();
    switch (m.target) {
      case "question": return void navigate({ to: "/question" });
      case "photo": return void navigate({ to: "/photo" });
      case "play": return void navigate({ to: "/app", search: { tab: "play" } });
      case "draw": return void navigate({ to: "/draw" });
      case "duel": return void navigate({ to: "/draw", search: { mode: "duel" } });
      case "thumb": return void navigate({ to: "/thumb" });
      case "explore": return void navigate({ to: "/app", search: { tab: "explore" } });
      default: {
        try { localStorage.setItem(MEM_VIEW_KEY, "capsules"); } catch { /* ignore */ }
        return void navigate({ to: "/app", search: { tab: "memories" } });
      }
    }
  };

  return <AnimatePresence>
    <motion.div key={current.id} className="fixed inset-0 z-[70] flex justify-center px-4 pt-[max(1.5rem,env(safe-area-inset-top))]"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <button type="button" aria-label={t("feat.notif.dismiss")} onClick={close} className="absolute inset-0 bg-ink/60" />
      <motion.div role="alertdialog" aria-live="assertive" aria-label={title}
        initial={reduce ? false : { y: -40, opacity: 0, scale: 0.96 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={spring}
        className={`grain relative z-[1] h-fit w-[82%] max-w-[420px] rounded-[28px] p-6 ${m.tone}`}>
        <button type="button" onClick={close} aria-label={t("feat.notif.dismiss")}
          className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-surface text-foreground">
          <X strokeWidth={2.5} className="size-5" aria-hidden="true" />
        </button>
        <span className="relative z-[2] grid size-14 place-items-center rounded-[18px] bg-surface text-foreground">
          <Icon strokeWidth={2} className="size-7" aria-hidden="true" />
        </span>
        <p className="relative z-[2] mt-4 type-display text-[26px] leading-[1.15]">{title}</p>
        <p className="relative z-[2] mt-2 type-body text-[17px] opacity-90">{body}</p>
        <Pressable haptics onClick={go}
          className="relative z-[2] mt-5 flex h-14 w-full items-center justify-center rounded-[18px] bg-surface type-button text-[17px] text-foreground">
          {cta}
        </Pressable>
      </motion.div>
    </motion.div>
  </AnimatePresence>;
}
