import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BottomSheet, Pressable } from "@/components/visual";
import type { Me } from "@/lib/couple";

export const MEM_VIEW_KEY = "nendoi.memView";

/** In-app notification center. Checks for newly unlocked capsules whenever it loads. */
export function NotificationBell({ me }: { me: Me }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const partner = me.profile?.partner_call_name || me.partner?.display_name || t("app.setup.call.ban");
  // No polling: the live listener refreshes this list the moment something arrives.
  const { data } = useQuery({ queryKey: ["notifications"], queryFn: async () => {
    await supabase.rpc("sync_capsule_notices");
    const { data, error } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(30);
    if (error) throw error; return data;
  } });
  const unread = (data ?? []).filter((n) => !n.read_at).length;
  useEffect(() => {
    if (!open || !unread) return;
    void supabase.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null).then(() => qc.invalidateQueries({ queryKey: ["notifications"] }));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  return <>
    <Pressable haptics onClick={() => setOpen(true)} aria-label={unread ? `${t("feat.notif.open")} · ${t("feat.notif.unread", { count: unread })}` : t("feat.notif.open")}
      className="relative grid size-11 place-items-center rounded-full bg-surface">
      <Bell strokeWidth={2} className="size-5" aria-hidden="true" />
      {!!unread && <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full block-ember px-1 text-[11px] font-bold">{unread}</span>}
    </Pressable>
    <BottomSheet open={open} onOpenChange={setOpen}>
      <p className="type-display text-[28px]">{t("feat.notif.title")}</p>
      {!data?.length ? <p className="mt-4 type-body text-muted-foreground">{t("feat.notif.empty")}</p>
        : <ul className="mt-4 space-y-2">{data.map((n) => { const d = n.data as { type?: string }; return <li key={n.id}>
          <button onClick={() => { setOpen(false); if (n.kind === "thumb_nudge" || n.kind === "thumb_synced") { void navigate({ to: "/thumb" }); return; } if (n.kind === "drawing_received") { void navigate({ to: "/draw" }); return; } if (n.kind === "duel_started" || n.kind === "duel_drawing") { void navigate({ to: "/draw", search: { mode: "duel" } }); return; } if (n.kind.startsWith("category_")) { void navigate({ to: "/app", search: { tab: "explore" } }); return; } if (n.kind === "question_answered") { void navigate({ to: "/question" }); return; } if (n.kind === "photo_received") { void navigate({ to: "/photo" }); return; } if (n.kind === "game_turn") { void navigate({ to: "/app", search: { tab: "play" } }); return; } try { localStorage.setItem(MEM_VIEW_KEY, "capsules"); } catch { /* ignore */ } void navigate({ to: "/app", search: { tab: "memories" } }); }}
            className={`w-full rounded-[18px] p-4 text-left type-body ${n.read_at ? "bg-surface" : "block-butter"}`}>
            {t(`feat.notif.${n.kind}`, { partner, type: t(`feat.capsule.types.${d.type ?? "miss"}`), category: t(`question.packs.${(n.data as { pack?: string }).pack ?? "memory"}`) })}
            <span className="mt-1 block type-caption opacity-70">{new Date(n.created_at).toLocaleDateString("vi-VN")}</span>
          </button></li>; })}</ul>}
    </BottomSheet>
  </>;
}
