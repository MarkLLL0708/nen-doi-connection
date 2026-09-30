import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Block, FlameMark, Pressable, PrimaryButton, SlideUp } from "@/components/visual";
import { Shell } from "@/components/app/Shell";
import { DrawCanvas } from "@/components/app/DrawCanvas";
import { useMe, type Me } from "@/lib/couple";
import i18n from "@/i18n";

const DUEL_SECONDS = 60;

export const Route = createFileRoute("/_authenticated/draw")({
  validateSearch: z.object({ mode: z.enum(["free", "duel"]).optional() }),
  head: () => ({ meta: [
    { title: i18n.t("feat.draw.metaTitle") },
    { name: "description", content: i18n.t("feat.draw.metaDesc") },
    { property: "og:title", content: i18n.t("feat.draw.metaTitle") },
    { property: "og:description", content: i18n.t("feat.draw.metaDesc") },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: DrawScreen,
});

function DrawScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: me, isLoading } = useMe();
  const { mode = "free" } = Route.useSearch();

  if (isLoading || !me?.couple) return <Shell><div className="grid flex-1 place-items-center"><FlameMark size={40} /></div></Shell>;

  return <Shell className="pb-10">
    <div className="flex flex-1 flex-col px-4 pt-4">
      <button onClick={() => void navigate({ to: "/app" })} className="flex h-12 w-fit items-center gap-2 type-button">
        <ArrowLeft strokeWidth={2.5} className="size-5" aria-hidden="true" />{t("feat.draw.back")}
      </button>
      <h1 className="mt-2 px-1 type-display text-[32px] leading-[1.15]"><SlideUp>{t(mode === "duel" ? "feat.draw.duelTitle" : "feat.draw.title")}</SlideUp></h1>
      <div className="mt-4 flex gap-2">
        {(["free", "duel"] as const).map((m) => <Pressable key={m} haptics aria-pressed={mode === m} onClick={() => void navigate({ to: "/draw", search: m === "free" ? {} : { mode: m } })}
          className={`h-11 rounded-full px-5 type-button ${mode === m ? "block-ink" : "bg-surface"}`}>{t(`feat.draw.tabs.${m}`)}</Pressable>)}
      </div>
      <div className="mt-5 flex-1">{mode === "duel" ? <Duel me={me} /> : <Free me={me} />}</div>
    </div>
  </Shell>;
}

function partnerName(me: Me, fallback: string) {
  return me.profile?.partner_call_name || me.partner?.display_name || fallback;
}

function Free({ me }: { me: Me }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  const [reply, setReply] = useState<string | null>(null);
  const partner = partnerName(me, t("app.setup.call.ban"));

  const gallery = useQuery({ queryKey: ["drawings", "free"], refetchInterval: 15000, queryFn: async () => {
    const { data, error } = await supabase.from("drawings").select("id,user_id,image,created_at").is("round_id", null).order("created_at", { ascending: false }).limit(12);
    if (error) throw error; return data ?? [];
  } });

  const send = async (image: string) => {
    setBusy(true); setErr(false);
    const { error } = await supabase.from("drawings").insert({ couple_id: me.couple!.id, user_id: me.userId, image, reply_to: null });
    setBusy(false);
    if (error) { setErr(true); return; }
    setReply(null);
    void qc.invalidateQueries({ queryKey: ["drawings", "free"] });
  };

  return <div>
    <p className="px-1 type-body text-muted-foreground">{t("feat.draw.freeBody", { partner })}</p>
    <div className="mt-4"><DrawCanvas background={reply} busy={busy} submitLabel={t("feat.draw.send")} onSubmit={(d) => void send(d)} /></div>
    {err && <p role="alert" className="mt-3 type-button">{t("feat.draw.error")}</p>}
    {reply && <button onClick={() => setReply(null)} className="mt-3 type-button underline decoration-2 underline-offset-4">{t("feat.draw.freshStart")}</button>}

    <h2 className="mt-8 px-1 type-title">{t("feat.draw.gallery")}</h2>
    {!gallery.data?.length ? <p className="mt-3 px-1 type-body text-muted-foreground">{t("feat.draw.galleryEmpty")}</p>
      : <ul className="mt-3 grid grid-cols-3 gap-3">
        {gallery.data.map((d) => <li key={d.id}>
          <button onClick={() => setReply(d.image)} className="block w-full overflow-hidden rounded-[18px]"
            aria-label={t("feat.draw.replyTo", { name: d.user_id === me.userId ? t("app.home.you") : partner })}>
            <img src={d.image} alt="" className="aspect-square w-full bg-cream object-cover" />
          </button>
          <p className="mt-1 type-caption text-muted-foreground">{d.user_id === me.userId ? t("app.home.you") : partner}</p>
        </li>)}
      </ul>}
    {!!gallery.data?.length && <p className="mt-3 px-1 type-caption text-muted-foreground">{t("feat.draw.replyHint")}</p>}
  </div>;
}

function Duel({ me }: { me: Me }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const partner = partnerName(me, t("app.setup.call.ban"));

  useEffect(() => { const id = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(id); }, []);

  const round = useQuery({ queryKey: ["duelRound"], refetchInterval: 5000, queryFn: async () => {
    const { data, error } = await supabase.from("draw_rounds").select("id,prompt,ends_at,created_at").order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (error) throw error; return data;
  } });
  const roundId = round.data?.id;

  const entries = useQuery({ enabled: !!roundId, queryKey: ["duelDrawings", roundId], refetchInterval: 4000, queryFn: async () => {
    const { data, error } = await supabase.from("drawings").select("id,user_id,image").eq("round_id", roundId!);
    if (error) throw error; return data ?? [];
  } });
  const votes = useQuery({ enabled: !!roundId, queryKey: ["duelVotes", roundId], refetchInterval: 6000, queryFn: async () => {
    const { data, error } = await supabase.from("draw_votes").select("user_id,liked_user_id").eq("round_id", roundId!);
    if (error) throw error; return data ?? [];
  } });

  const mine = (entries.data ?? []).find((d) => d.user_id === me.userId);
  const theirs = (entries.data ?? []).find((d) => d.user_id !== me.userId);
  const left = round.data ? Math.max(0, Math.ceil((new Date(round.data.ends_at).getTime() - now) / 1000)) : 0;
  const submitSignal = useMemo(() => (round.data && left === 0 && !mine ? 1 : 0), [round.data?.id, left === 0, !!mine]); // eslint-disable-line react-hooks/exhaustive-deps

  const startRound = async () => {
    setBusy(true); setErr(false);
    const { data: pool } = await supabase.from("game_content").select("content").eq("type", "draw_duel");
    const list = (pool ?? []).map((r) => (r.content as { text_vi?: string }).text_vi).filter(Boolean) as string[];
    const prompt = list[Math.floor(Math.random() * list.length)];
    if (!prompt) { setBusy(false); setErr(true); return; }
    const { error } = await supabase.from("draw_rounds").insert({ couple_id: me.couple!.id, created_by: me.userId, prompt, ends_at: new Date(Date.now() + DUEL_SECONDS * 1000).toISOString() });
    setBusy(false);
    if (error) { setErr(true); return; }
    await qc.invalidateQueries({ queryKey: ["duelRound"] });
  };

  const submit = async (image: string) => {
    if (busy || mine) return;
    setBusy(true); setErr(false);
    const { error } = await supabase.from("drawings").insert({ couple_id: me.couple!.id, user_id: me.userId, round_id: roundId!, image });
    setBusy(false);
    if (error && error.code !== "23505") { setErr(true); return; }
    await qc.invalidateQueries({ queryKey: ["duelDrawings", roundId] });
  };

  const vote = async (likedUser: string) => {
    const { error } = await supabase.from("draw_votes").insert({ round_id: roundId!, couple_id: me.couple!.id, user_id: me.userId, liked_user_id: likedUser });
    if (error && error.code !== "23505") { setErr(true); return; }
    void qc.invalidateQueries({ queryKey: ["duelVotes", roundId] });
  };

  if (round.isLoading) return <div className="grid flex-1 place-items-center"><FlameMark size={36} /></div>;

  const newRoundButton = <PrimaryButton className="mt-5 bg-ink text-cream" disabled={busy} onClick={() => void startRound()}>{t("feat.draw.startDuel")}</PrimaryButton>;

  if (!round.data) return <Block tone="block-plum"><p className="type-body">{t("feat.draw.duelBody", { partner, seconds: DUEL_SECONDS })}</p>{newRoundButton}</Block>;

  const both = !!mine && !!theirs;
  const myVote = (votes.data ?? []).find((v) => v.user_id === me.userId)?.liked_user_id;
  const theirVote = (votes.data ?? []).find((v) => v.user_id !== me.userId)?.liked_user_id;

  return <div>
    <Block tone="block-plum">
      <p className="type-label">{t("feat.draw.promptLabel")}</p>
      <p className="mt-2 type-display text-[32px] leading-[1.15]">{round.data.prompt}</p>
      {!both && <p className="mt-3 type-title nums" role="timer">{left > 0 ? t("feat.draw.seconds", { s: left }) : t("feat.draw.timeUp")}</p>}
    </Block>

    {!mine ? <div className="mt-5">
      <DrawCanvas submitLabel={t("feat.draw.submitDuel")} busy={busy} submitSignal={submitSignal} onSubmit={(d) => void submit(d)} />
    </div> : !theirs ? <Block tone="block-butter" className="mt-5">
      <FlameMark size={36} /><p className="mt-3 type-title">{t("feat.draw.waiting", { partner })}</p>
    </Block> : <div className="mt-5">
      <div className="grid grid-cols-2 gap-3">
        {[{ d: mine, name: t("app.home.you"), uid: me.userId }, { d: theirs, name: partner, uid: theirs.user_id }].map((x) =>
          <div key={x.uid}>
            <img src={x.d.image} alt={t("feat.draw.drawingBy", { name: x.name })} className="aspect-square w-full rounded-[20px] bg-cream object-cover" />
            <Pressable haptics disabled={!!myVote} onClick={() => void vote(x.uid)}
              className={`mt-2 h-11 w-full rounded-full type-button disabled:opacity-70 ${myVote === x.uid ? "block-ember" : "bg-surface"}`}>
              {myVote === x.uid ? t("feat.draw.voted") : t("feat.draw.vote", { name: x.name })}
            </Pressable>
          </div>)}
      </div>
      {theirVote && <p className="mt-3 px-1 type-body">{t("feat.draw.partnerVoted", { partner, name: theirVote === me.userId ? t("app.home.you") : partner })}</p>}
      {newRoundButton}
    </div>}

    {err && <p role="alert" className="mt-3 type-button">{t("feat.draw.error")}</p>}
  </div>;
}
