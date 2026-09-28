import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "motion/react";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GeometricBurst, Pressable, SlideUp, SwipeDeck, Tag } from "@/components/visual";
import type { Me } from "@/lib/couple";

type Idea = { id: string; title_vi: string; city: string | null; budget: string | null; mood: string | null };

export function DateTab({ me }: { me: Me }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [city, setCity] = useState<string | null>(null);
  const [match, setMatch] = useState<Idea | null>(null);
  const [burst, setBurst] = useState(0);

  const ideas = useQuery({ queryKey: ["dateIdeas"], queryFn: async () => {
    const [{ data: all }, { data: mine }] = await Promise.all([
      supabase.from("date_ideas").select("id,title_vi,city,budget,mood").order("created_at"),
      supabase.from("date_swipes").select("idea_id").eq("user_id", me.userId),
    ]);
    const seen = new Set((mine ?? []).map((s) => s.idea_id));
    return { all: (all ?? []) as Idea[], fresh: ((all ?? []) as Idea[]).filter((i) => !seen.has(i.id)) };
  } });
  const list = useQuery({ queryKey: ["dateList"], refetchInterval: 10_000, queryFn: async () => {
    const { data } = await supabase.from("shared_date_list").select("id,idea_id,done").order("created_at", { ascending: false });
    return data ?? [];
  } });

  const cities = [...new Set((ideas.data?.all ?? []).map((i) => i.city).filter(Boolean))] as string[];
  const deck = (ideas.data?.fresh ?? []).filter((i) => !city || i.city === city);
  const byId = Object.fromEntries((ideas.data?.all ?? []).map((i) => [i.id, i]));

  const swipe = async (idea: Idea, dir: "left" | "right") => {
    const { data } = await supabase.rpc("swipe_date" as never, { _idea: idea.id, _liked: dir === "right" } as never);
    if (data === true) { setMatch(idea); setBurst(Date.now()); void qc.invalidateQueries({ queryKey: ["dateList"] }); }
  };
  const toggle = async (id: string, done: boolean) => {
    await supabase.from("shared_date_list").update({ done: !done }).eq("id", id);
    void qc.invalidateQueries({ queryKey: ["dateList"] });
  };

  return <div className="relative px-4 pt-8">
    <GeometricBurst fire={burst} />
    <p className="px-1 type-label text-muted-foreground">{t("feat.date.label")}</p>
    <h1 className="mt-3 px-1 type-display"><SlideUp>{t("feat.date.title")}</SlideUp></h1>
    <p className="mt-3 px-1 type-body text-muted-foreground">{t("feat.date.body")}</p>
    {cities.length > 1 && <div className="mt-5 flex flex-wrap gap-2">
      {[null, ...cities].map((c) => <Pressable key={c ?? "all"} onClick={() => setCity(c)} aria-pressed={city === c}
        className={`h-11 rounded-full px-4 type-button ${city === c ? "bg-foreground text-background" : "bg-surface"}`}>{c ?? t("feat.date.all")}</Pressable>)}
    </div>}

    {ideas.data && (deck.length ? <SwipeDeck key={city ?? "all"} className="mt-6" items={deck} getKey={(i) => i.id} cardClassName="block-blush" onSwipe={(i, d) => void swipe(i, d)}
      renderCard={(i) => <div className="relative z-[2] mt-auto">
        <div className="flex flex-wrap gap-2">{i.city && <Tag tone="bg-ink text-cream">{i.city}</Tag>}{i.budget && <Tag tone="bg-cream text-ink">{t(`feat.date.budget.${i.budget}`, { defaultValue: i.budget })}</Tag>}</div>
        <p className="mt-4 type-display text-[32px]">{i.title_vi}</p>
        {i.mood && <p className="mt-3 type-label">{i.mood}</p>}
      </div>} />
      : <p className="mt-6 rounded-[24px] bg-surface p-6 type-title">{t("feat.date.doneAll")}</p>)}

    <AnimatePresence>{match && <motion.button initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} onClick={() => setMatch(null)}
      className="grain block-ember fixed inset-x-4 bottom-28 z-40 mx-auto max-w-[358px] rounded-[24px] p-5 text-left">
      <span className="relative z-[2] block type-title">{t("feat.date.match")}</span>
      <span className="relative z-[2] mt-1 block type-body">{t("feat.date.matchBody", { title: match.title_vi })}</span>
    </motion.button>}</AnimatePresence>

    <h2 className="mt-10 px-1 type-title">{t("feat.date.listTitle")}</h2>
    {!list.data?.length ? <p className="mt-3 px-1 type-body text-muted-foreground">{t("feat.date.listEmpty")}</p>
      : <ul className="mt-4 space-y-3">{list.data.map((row) => <li key={row.id}>
        <Pressable onClick={() => void toggle(row.id, row.done)} className={`flex w-full items-center justify-between gap-3 rounded-[20px] p-5 text-left ${row.done ? "bg-surface" : "block-plum"}`}>
          <span className="type-button">{byId[row.idea_id]?.title_vi}</span>
          <span className="flex shrink-0 items-center gap-1 type-label">{row.done && <Check strokeWidth={3} className="size-4" />}{row.done ? t("feat.date.done") : t("feat.date.notDone")}</span>
        </Pressable></li>)}</ul>}
  </div>;
}
