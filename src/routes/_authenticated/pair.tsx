import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Copy, MessageCircle, Send, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ColourFlood, FitText, GhostButton, Logo, Pressable, PrimaryButton, SlideUp, Ticker } from "@/components/visual";
import { Shell } from "@/components/app/Shell";
import { stepInput } from "@/components/app/Step";
import { PENDING_CODE_KEY, inviteLink, useInvalidateMe, useMe } from "@/lib/couple";
import i18n from "@/i18n";

export const Route = createFileRoute("/_authenticated/pair")({
  validateSearch: z.object({ join: z.boolean().optional() }),
  head: () => ({ meta: [
    { title: i18n.t("app.meta.pairTitle") },
    { name: "description", content: i18n.t("app.meta.pairDesc") },
    { property: "og:title", content: i18n.t("app.meta.pairTitle") },
    { property: "og:description", content: i18n.t("app.meta.pairDesc") },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Pair,
});

function Pair() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: me } = useMe();
  const invalidate = useInvalidateMe();
  const [flood, setFlood] = useState(false);
  const partner = me?.profile?.partner_call_name || t("app.setup.call.ban");
  const paired = (me?.members.length ?? 0) >= 2;

  // Poll membership while waiting so the moment the partner joins, this screen floods too.
  useQuery({ queryKey: ["pair-poll"], enabled: !!me?.couple && !paired && !flood, refetchInterval: 3000,
    queryFn: async () => { await invalidate(); return Date.now(); } });
  const wasSolo = useRef<boolean | null>(null);
  useEffect(() => {
    if (!me?.couple) return;
    if (wasSolo.current === null) { wasSolo.current = !paired; if (paired) void navigate({ to: "/app", replace: true }); return; }
    if (wasSolo.current && paired) setFlood(true);
  }, [me, paired, navigate]);

  if (!me) return null;
  if (!me.couple) return <JoinForm partner={partner} onJoined={async () => { await invalidate(); setFlood(true); }} flood={flood} />;

  return <Shell className="block-ember grain">
    <Ticker text={t("app.ticker")} className="relative z-[2] bg-ink text-cream" />
    <div className="relative z-[2] flex flex-1 flex-col px-5 pb-8 pt-5">
      <Logo onBlock />
      <p className="mt-10 type-label">{t("app.pair.label")}</p>
      <CodeBlock />
      <h1 className="mt-4 type-display text-[36px]"><SlideUp>{t("app.pair.title", { partner })}</SlideUp></h1>
      <p className="mt-3 type-body">{t("app.pair.note", { partner })}</p>
      <p className="mt-6 flex items-center gap-2 type-button"><span className="size-2.5 animate-pulse rounded-full bg-ink" />{t("app.pair.waiting", { partner })}</p>
      <div className="mt-auto pt-8"><GhostButton onClick={() => void navigate({ to: "/app" })}>{t("app.pair.solo")}</GhostButton></div>
    </div>
    <FloodOverlay active={flood} text={t("app.pair.joined")} onDone={() => void navigate({ to: "/app", replace: true })} />
  </Shell>;
}

function CodeBlock() {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const { data: code } = useQuery({ queryKey: ["invite-code"], queryFn: async () => { const { data, error } = await supabase.rpc("refresh_invite"); if (error) throw error; return data as string; } });
  if (!code) return <div className="h-[120px]" />;
  const link = inviteLink(code);
  const text = t("app.pair.shareText", { code });
  const copy = async () => { try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* blocked */ } };
  const share = async () => { if (navigator.share) { try { await navigator.share({ title: "Nến Đôi", text, url: link }); } catch { /* cancelled */ } } else void copy(); };
  const btn = "flex h-14 items-center justify-center gap-2 rounded-[18px] bg-ink px-4 type-button text-cream";
  return <>
    <FitText max={96} className="mt-2" measure={code}><span className="tracking-[0.04em]" data-testid="pair-code">{code}</span></FitText>
    <div className="mt-5 grid grid-cols-2 gap-3">
      {/* Zalo has no public web share URL: the system sheet lists Zalo on phones; elsewhere we copy the link. */}
      <Pressable haptics className={btn} onClick={() => void share()}><Send strokeWidth={2.5} className="size-5" />{t("app.pair.zalo")}</Pressable>
      <Pressable haptics className={btn} onClick={() => { window.location.href = `fb-messenger://share/?link=${encodeURIComponent(link)}`; }}><MessageCircle strokeWidth={2.5} className="size-5" />{t("app.pair.messenger")}</Pressable>
      <Pressable haptics className={btn} onClick={() => void copy()}><Copy strokeWidth={2.5} className="size-5" />{copied ? t("app.pair.copied") : t("app.pair.copy")}</Pressable>
      <Pressable haptics className={btn} onClick={() => void share()}><Share2 strokeWidth={2.5} className="size-5" />{t("app.pair.share")}</Pressable>
    </div>
  </>;
}

function FloodOverlay({ active, text, onDone }: { active: boolean; text: string; onDone: () => void }) {
  const [shown, setShown] = useState(false);
  useEffect(() => { if (!shown) return; const id = setTimeout(onDone, 900); return () => clearTimeout(id); }, [shown, onDone]);
  return <div className={active ? "absolute inset-0 z-30" : "pointer-events-none absolute inset-0 z-30"}>
    <ColourFlood at={null} active={active} colourClass="block-plum" onDone={() => setShown(true)} />
    {shown && <div className="relative z-10 flex h-full items-end p-6 pb-24 text-cream"><h2 className="type-display"><SlideUp>{text}</SlideUp></h2></div>}
  </div>;
}

function JoinForm({ partner, onJoined, flood }: { partner: string; onJoined: () => Promise<void>; flood: boolean }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [code, setCode] = useState(() => (typeof window !== "undefined" ? sessionStorage.getItem(PENDING_CODE_KEY) ?? "" : ""));
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const join = async () => {
    setBusy(true); setErr(null);
    const { error } = await supabase.rpc("join_couple", { _code: code });
    setBusy(false);
    if (error) { setErr(/already/.test(error.message) ? t("app.pair.already") : /full/.test(error.message) ? t("app.pair.full") : t("app.pair.invalid")); return; }
    sessionStorage.removeItem(PENDING_CODE_KEY);
    await onJoined();
  };
  return <Shell className="block-butter grain">
    <div className="relative z-[2] flex flex-1 flex-col px-5 pb-8 pt-6">
      <Logo onBlock />
      <p className="mt-12 type-label">{t("app.pair.joinLabel")}</p>
      <h1 className="mt-3 type-display"><SlideUp>{t("app.pair.joinTitle", { partner })}</SlideUp></h1>
      <input autoFocus className={`${stepInput} mt-8 text-center font-display text-[32px] uppercase tracking-[0.2em]`} maxLength={6} placeholder={t("app.pair.joinPh")} aria-label={t("app.pair.joinPh")}
        value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} />
      {err && <p role="alert" className="mt-4 rounded-[18px] bg-ink px-4 py-3 text-[14px] font-bold text-cream">{err}</p>}
      <PrimaryButton className="mt-auto" disabled={code.length !== 6 || busy} onClick={() => void join()}>{t("app.pair.join")}</PrimaryButton>
    </div>
    <FloodOverlay active={flood} text={t("app.pair.joined")} onDone={() => void navigate({ to: "/app", replace: true })} />
  </Shell>;
}
