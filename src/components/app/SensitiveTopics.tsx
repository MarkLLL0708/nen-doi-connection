import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Pressable } from "@/components/visual";
import type { Me } from "@/lib/couple";

/** "Chủ đề nhạy cảm": each partner's own choice; the packs are on only while both say yes. */
export function SensitiveTopics({ me }: { me: Me }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const cid = me.couple!.id;
  const partnerId = me.members.find((m) => m.user_id !== me.userId)?.user_id;
  const partner = me.profile?.partner_call_name || me.partner?.display_name || t("app.setup.call.ban");
  const { data } = useQuery({ queryKey: ["consents", cid], refetchInterval: 8000, queryFn: async () => {
    const { data, error } = await supabase.from("pack_consents").select("user_id,agreed").eq("couple_id", cid);
    if (error) throw error;
    return data ?? [];
  } });
  const mine = data?.find((c) => c.user_id === me.userId)?.agreed;
  const theirs = partnerId ? data?.find((c) => c.user_id === partnerId)?.agreed : undefined;
  const on = mine === true && theirs === true;
  const choose = async (agreed: boolean) => {
    setBusy(true);
    await supabase.from("pack_consents").upsert({ couple_id: cid, user_id: me.userId, agreed, decided_at: new Date().toISOString() });
    setBusy(false);
    void qc.invalidateQueries({ queryKey: ["consents"] }); void qc.invalidateQueries({ queryKey: ["todayQuestion"] });
  };
  const state = (v: boolean | undefined) => v === true ? t("feat.sensitive.yes") : v === false ? t("feat.sensitive.later") : t("feat.sensitive.undecided");
  return <section className={`grain ${on ? "block-plum" : "bg-surface"} mt-8 rounded-[28px] p-6`} aria-labelledby="sensitive-title">
    <div className="relative z-[2]">
      <div className="flex items-center justify-between gap-3">
        <p className="type-label">{t("feat.sensitive.label")}</p>
        <span className={`rounded-full px-3 py-1 type-label ${on ? "bg-cream text-ink" : "bg-ink text-cream"}`} data-testid="sensitive-state">{on ? t("feat.sensitive.on") : t("feat.sensitive.off")}</span>
      </div>
      <p id="sensitive-title" className="mt-3 type-title">{t("feat.sensitive.title")}</p>
      <p className="mt-2 type-caption">{t("feat.sensitive.body")}</p>
      <dl className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-[18px] bg-background/70 p-3 text-foreground"><dt className="type-label">{t("feat.sensitive.you")}</dt><dd className="mt-1 type-button">{state(mine)}</dd></div>
        <div className="rounded-[18px] bg-background/70 p-3 text-foreground"><dt className="type-label">{partner}</dt><dd className="mt-1 type-button">{partnerId ? state(theirs) : "—"}</dd></div>
      </dl>
      <div className="mt-4 grid grid-cols-2 gap-3" role="group" aria-label={t("feat.sensitive.label")}>
        {([true, false] as const).map((v) => <Pressable key={String(v)} haptics disabled={busy} aria-pressed={mine === v} onClick={() => void choose(v)}
          className={`h-14 rounded-[18px] type-button ${mine === v ? "block-ember" : "bg-background text-foreground"}`}>{v ? t("feat.sensitive.yes") : t("feat.sensitive.later")}</Pressable>)}
      </div>
      {!partnerId && <p className="mt-3 type-caption">{t("feat.sensitive.solo", { partner })}</p>}
    </div>
  </section>;
}
