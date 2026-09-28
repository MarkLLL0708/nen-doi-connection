import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { FlameMark, GhostButton, PrimaryButton, SecondaryButton, SlideUp } from "@/components/visual";
import { Shell } from "@/components/app/Shell";
import { PRODUCT_WORDMARK } from "@/config/product";
import i18n from "@/i18n";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [
    { title: i18n.t("app.meta.authTitle") },
    { name: "description", content: i18n.t("app.meta.authDesc") },
    { property: "og:title", content: i18n.t("app.meta.authTitle") },
    { property: "og:description", content: i18n.t("app.meta.authDesc") },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: AuthPage,
});

const inputCls = "h-14 w-full rounded-[18px] bg-surface px-5 type-body text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-4 focus-visible:ring-ring/50";

function AuthPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => { if (data.session) void navigate({ to: "/app", replace: true }); });
    const { data: sub } = supabase.auth.onAuthStateChange((e, s) => { if (e === "SIGNED_IN" && s) void navigate({ to: "/app", replace: true }); });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setErr(null);
    if (password.length < 8) { setErr(t("app.auth.weak")); return; }
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setErr(/confirm/i.test(error.message) ? t("app.auth.unconfirmed") : t("app.auth.badLogin"));
      else void navigate({ to: "/app", replace: true });
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
      if (error) setErr(/registered|exists/i.test(error.message) ? t("app.auth.exists") : t("app.error"));
      else if (data.session) void navigate({ to: "/app", replace: true });
      else setSent(true);
    }
    setBusy(false);
  };

  const social = async (provider: "google" | "apple") => {
    setErr(null);
    const r = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
    if (r.error) { setErr(t("app.error")); return; }
    if (r.redirected) return;
    void navigate({ to: "/app", replace: true });
  };

  return <Shell>
    <div className="flex flex-1 flex-col px-5 pb-8 pt-10">
      <div className="flex items-center gap-3"><FlameMark size={34} /><span className="type-display text-[34px] lowercase">{PRODUCT_WORDMARK}</span></div>
      {sent ? <div className="mt-16">
        <h1 className="type-display"><SlideUp>{t("app.auth.checkTitle")}</SlideUp></h1>
        <p className="mt-4 type-body text-muted-foreground">{t("app.auth.checkBody", { email })}</p>
        <GhostButton className="mt-6" onClick={() => { setSent(false); setMode("in"); }}>{t("app.auth.toSignIn")}</GhostButton>
      </div> : <>
        <h1 className="mt-14 type-display"><SlideUp key={mode}>{mode === "in" ? t("app.auth.signInTitle") : t("app.auth.signUpTitle")}</SlideUp></h1>
        <form onSubmit={submit} className="mt-8 space-y-3">
          <label className="block"><span className="sr-only">{t("app.auth.email")}</span>
            <input className={inputCls} type="email" autoComplete="email" required placeholder={t("app.auth.email")} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label className="block"><span className="sr-only">{t("app.auth.password")}</span>
            <input className={inputCls} type="password" autoComplete={mode === "in" ? "current-password" : "new-password"} required minLength={8} placeholder={mode === "up" ? t("app.auth.passwordHint") : t("app.auth.password")} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          {err && <p role="alert" className="rounded-[18px] block-ember px-4 py-3 text-[14px] font-bold">{err}</p>}
          <PrimaryButton type="submit" disabled={busy}>{mode === "in" ? t("app.auth.signIn") : t("app.auth.signUp")}</PrimaryButton>
        </form>
        <p className="my-5 type-label text-muted-foreground">{t("app.auth.or")}</p>
        <div className="space-y-3">
          <SecondaryButton type="button" onClick={() => void social("google")}>{t("app.auth.google")}</SecondaryButton>
          <SecondaryButton type="button" onClick={() => void social("apple")}>{t("app.auth.apple")}</SecondaryButton>
        </div>
        <GhostButton className="mt-4" onClick={() => { setMode(mode === "in" ? "up" : "in"); setErr(null); }}>{mode === "in" ? t("app.auth.toSignUp") : t("app.auth.toSignIn")}</GhostButton>
      </>}
    </div>
  </Shell>;
}
