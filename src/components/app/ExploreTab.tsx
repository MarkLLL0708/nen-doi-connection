import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Pressable, PrimaryButton, Stagger, StaggerItem } from "@/components/visual";
import type { Me } from "@/lib/couple";
import { questionPackTone } from "@/routes/_authenticated/question";

const ORDER = ["memory", "food", "fun", "tet", "deep", "distance", "conflict", "family", "money"];
type Pending = { id: string; pack: string; mine: boolean; created_at: string };
export type CategoryState = { active: string | null; packs: { pack: string; count: number }[]; pending: Pending | null };

/** Shared by the pair: polled so both phones see the same active category and request. */
export function useCategoryState() {
  return useQuery({ queryKey: ["categoryState"], refetchInterval: 4000, queryFn: async () => {
    const { data, error } = await supabase.rpc("category_state");
    if (error) throw error;
    return data as unknown as CategoryState;
  } });
}

export function ExploreTab({ me }: { me: Me }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data } = useCategoryState();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const partner = me.profile?.partner_call_name || me.partner?.display_name || t("app.setup.call.ban");
  const name = (p: string) => t(`question.packs.${p}`);

  const run = async (fn: () => PromiseLike<{ error: unknown }>) => {
    setBusy(true); setErr(null);
    const { error } = await fn();
    if (error) setErr(t("feat.explore.error"));
    await qc.invalidateQueries({ queryKey: ["categoryState"] });
    await qc.invalidateQueries({ queryKey: ["todayQuestion"] });
    await qc.invalidateQueries({ queryKey: ["todayStatus"] });
    setBusy(false);
  };

  if (!data) return <div className="flex-1" />;
  const pend = data.pending;
  const packs = [...data.packs].sort((a, b) => ORDER.indexOf(a.pack) - ORDER.indexOf(b.pack));

  return <div className="flex flex-1 flex-col gap-5 pt-2">
    <header>
      <p className="type-caption text-muted-foreground">{t("feat.explore.label")}</p>
      <h1 className="type-display text-[32px] leading-[1.15]">{t("feat.explore.title")}</h1>
      <p className="mt-2 type-body text-muted-foreground">{data.active ? t("feat.explore.activeNow", { category: name(data.active) }) : t("feat.explore.none")}</p>
    </header>

    {pend && !pend.mine && <div role="alert" className="grain block-butter rounded-[24px] p-5">
      <p className="type-body font-bold">{t("feat.explore.incoming", { partner, category: name(pend.pack) })}</p>
      <div className="mt-4 flex gap-2">
        <PrimaryButton disabled={busy} onClick={() => void run(() => supabase.rpc("respond_category", { _id: pend.id, _accept: true }))}>{t("feat.explore.accept")}</PrimaryButton>
        <Pressable disabled={busy} onClick={() => void run(() => supabase.rpc("respond_category", { _id: pend.id, _accept: false }))}
          className="h-12 rounded-full bg-surface px-5 type-button">{t("feat.explore.decline")}</Pressable>
      </div>
    </div>}

    {pend && pend.mine && <div role="status" className="grain block-plum rounded-[24px] p-5">
      <p className="type-body font-bold">{t("feat.explore.waiting", { partner })}</p>
      <p className="mt-1 type-caption opacity-80">{t("feat.explore.waitingSub", { category: name(pend.pack) })}</p>
      <Pressable disabled={busy} onClick={() => void run(() => supabase.rpc("cancel_category", { _id: pend.id }))}
        className="mt-4 h-11 rounded-full bg-surface px-5 type-button text-foreground">{t("feat.explore.cancel")}</Pressable>
    </div>}

    {err && <p role="status" className="rounded-[18px] bg-surface px-4 py-3 type-body">{err}</p>}

    <Stagger className="grid grid-cols-1 gap-3">
      {packs.map(({ pack, count }) => {
        const active = data.active === pack, requested = pend?.pack === pack;
        const locked = busy || active || (!!pend && !pend.mine);
        return <StaggerItem key={pack}>
          <Pressable haptics disabled={locked} aria-pressed={active}
            onClick={() => void run(() => supabase.rpc("request_category", { _pack: pack }))}
            className={`grain relative w-full rounded-[24px] p-5 text-left ${questionPackTone[pack] ?? "block-ember"} ${!active && pend && !pend.mine ? "opacity-60" : ""}`}>
            <div className="flex items-start justify-between gap-3">
              <p className="type-display text-[20px] leading-[1.15]">{name(pack)}</p>
              {active && <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-surface px-3 py-1 type-caption font-bold text-foreground"><Check className="size-4" strokeWidth={2} aria-hidden="true" />{t("feat.explore.playing")}</span>}
              {requested && !active && <span className="shrink-0 rounded-full bg-surface px-3 py-1 type-caption font-bold text-foreground">{t("feat.explore.requested")}</span>}
            </div>
            <p className="mt-2 type-body opacity-90">{t(`feat.explore.desc.${pack}`)}</p>
            <p className="mt-3 type-caption font-bold opacity-80">{t("feat.explore.count", { count })}</p>
          </Pressable>
        </StaggerItem>;
      })}
    </Stagger>
  </div>;
}
