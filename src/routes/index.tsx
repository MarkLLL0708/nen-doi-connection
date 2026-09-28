import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Check, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SlideUp, Stagger, StaggerItem, Ticker } from "@/components/visual";
import { PhonePreview } from "@/components/landing/PhonePreview";
import { SiteFooter, SiteHeader } from "@/components/landing/SiteChrome";
import { PRICING, formatVnd } from "@/config/pricing";
import { cn } from "@/lib/utils";
import i18n from "@/i18n";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: i18n.t("landing.meta.title") },
    { name: "description", content: i18n.t("landing.meta.desc") },
    { property: "og:title", content: i18n.t("landing.meta.title") },
    { property: "og:description", content: i18n.t("landing.meta.desc") },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Landing,
});

type Item = { title: string; body: string };
const wrap = "mx-auto max-w-[1120px] px-5";

/** Public landing for visitors; signed-in users go straight to the app. */
function Landing() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => { if (data.session) void navigate({ to: "/app", replace: true }); });
  }, [navigate]);

  const steps = t("landing.how.steps", { returnObjects: true }) as Item[];
  const values = t("landing.values.items", { returnObjects: true }) as Item[];
  const faq = t("landing.faq.items", { returnObjects: true }) as { q: string; a: string }[];
  const privacy = t("landing.privacy.lines", { returnObjects: true }) as string[];
  const free = t("landing.pricing.free.items", { returnObjects: true }) as string[];
  const prem = t("landing.pricing.premium.items", { returnObjects: true }) as string[];

  return <div className="min-h-dvh bg-background text-foreground">
    <SiteHeader />
    <Ticker text={t("landing.ticker")} className="block-ink" />

    <section className="grain block-ember">
      <div className={cn(wrap, "relative z-[2] grid items-center gap-10 py-12 md:grid-cols-[1.2fr_1fr] md:py-20")}>
        <div>
          <h1 className="type-display text-[44px] leading-[1.15] sm:text-[60px] lg:text-[76px]"><SlideUp>{t("landing.hero.title")}</SlideUp></h1>
          <p className="mt-6 max-w-[520px] text-[17px] font-medium leading-relaxed">{t("landing.hero.body")}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/auth" className="inline-flex h-14 items-center justify-center rounded-[18px] bg-ink px-6 type-button text-cream">{t("landing.hero.primary")}</Link>
            <a href="#how" className="inline-flex h-14 items-center justify-center rounded-[18px] bg-cream px-6 type-button text-ink">{t("landing.hero.secondary")}</a>
          </div>
          <Link to="/demo" className="mt-4 inline-flex h-12 items-center type-button underline decoration-2 underline-offset-[6px]">{t("landing.hero.demo")}</Link>
        </div>
        <PhonePreview />
      </div>
    </section>

    <section id="how" className={cn(wrap, "scroll-mt-4 py-16")}>
      <p className="type-label text-muted-foreground">{t("landing.how.label")}</p>
      <h2 className="mt-3 type-display text-[34px] leading-[1.15] md:text-[48px]">{t("landing.how.title")}</h2>
      <Stagger className="mt-8 grid gap-3 md:grid-cols-3">
        {steps.map((s, i) => <StaggerItem key={s.title}><div className={cn("grain flex h-full min-h-[220px] flex-col rounded-[28px] p-6", ["block-butter", "block-plum", "block-blush"][i])}>
          <span className="relative z-[2] type-display text-[48px] leading-none">{i + 1}</span>
          <h3 className="relative z-[2] mt-auto pt-6 type-title">{s.title}</h3>
          <p className="relative z-[2] mt-2 type-body">{s.body}</p>
        </div></StaggerItem>)}
      </Stagger>
    </section>

    <section className={cn(wrap, "pb-16")}>
      <p className="type-label text-muted-foreground">{t("landing.values.label")}</p>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {values.map((v, i) => <div key={v.title} className="rounded-[28px] bg-surface p-6">
          <Shape i={i} />
          <h3 className="mt-6 type-title">{v.title}</h3>
          <p className="mt-2 type-body text-muted-foreground">{v.body}</p>
        </div>)}
      </div>
    </section>

    <section className="grain block-butter">
      <p className={cn(wrap, "relative z-[2] py-16 type-display text-[36px] leading-[1.15] md:py-24 md:text-[64px]")}>{t("landing.positioning")}</p>
    </section>

    <section className="block-ink">
      <div className={cn(wrap, "py-16 md:py-20")}>
        <h2 className="max-w-[820px] type-display text-[32px] leading-[1.15] md:text-[48px]">{t("landing.privacy.title")}</h2>
        <ul className="mt-8 grid gap-3 md:grid-cols-3">
          {privacy.map((l) => <li key={l} className="flex gap-3 rounded-[22px] border-2 border-current/20 p-5 type-body"><Check strokeWidth={2.5} className="mt-0.5 size-5 shrink-0 text-ember" aria-hidden="true" />{l}</li>)}
        </ul>
      </div>
    </section>

    <section className={cn(wrap, "py-16")}>
      <div className="flex flex-wrap items-center gap-3">
        <p className="type-label text-muted-foreground">{t("landing.pricing.label")}</p>
        {PRICING.isTestPrice && <span className="rounded-full block-butter px-3 py-1 type-label">{t("landing.pricing.test")}</span>}
      </div>
      <h2 className="mt-3 max-w-[760px] type-display text-[30px] leading-[1.15] md:text-[44px]">{t("landing.pricing.title")}</h2>
      <div className="mt-8 grid gap-3 md:grid-cols-2">
        <div className="rounded-[28px] bg-surface p-6">
          <h3 className="type-title">{t("landing.pricing.free.name")}</h3>
          <p className="mt-3 type-display text-[40px]">{t("landing.pricing.free.price")}</p>
          <PlanList items={free} />
        </div>
        <div className="grain block-plum rounded-[28px] p-6">
          <h3 className="relative z-[2] type-title">{t("landing.pricing.premium.name")}</h3>
          <p className="relative z-[2] mt-3 flex flex-wrap items-baseline gap-x-2">
            <span className="type-display text-[36px]">{formatVnd(PRICING.monthly)}</span><span className="type-button">{t("landing.pricing.premium.perMonth")}</span>
          </p>
          <p className="relative z-[2] mt-1 type-button">{t("landing.pricing.premium.or")} {formatVnd(PRICING.yearly)}{t("landing.pricing.premium.perYear")}</p>
          <p className="relative z-[2] mt-2 type-caption opacity-80">{t("landing.pricing.premium.note")}</p>
          <PlanList items={prem} />
        </div>
      </div>
    </section>

    <section className={cn(wrap, "pb-16")}>
      <p className="type-label text-muted-foreground">{t("landing.faq.label")}</p>
      <h2 className="mt-3 type-display text-[30px] leading-[1.15] md:text-[44px]">{t("landing.faq.title")}</h2>
      <div className="mt-6 space-y-2">
        {faq.map((f) => <details key={f.q} className="group rounded-[22px] bg-surface open:block-blush">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 type-title text-[18px] [&::-webkit-details-marker]:hidden">
            {f.q}<Plus strokeWidth={2.5} className="size-5 shrink-0 transition-transform group-open:rotate-45" aria-hidden="true" />
          </summary>
          <p className="px-5 pb-5 type-body">{f.a}</p>
        </details>)}
      </div>
    </section>

    <section className="grain block-ember">
      <div className={cn(wrap, "relative z-[2] flex flex-col items-start gap-6 py-16 md:flex-row md:items-center md:justify-between")}>
        <h2 className="type-display text-[32px] leading-[1.15] md:text-[48px]">{t("landing.final.title")}</h2>
        <Link to="/auth" className="inline-flex h-14 shrink-0 items-center justify-center rounded-[18px] bg-ink px-6 type-button text-cream">{t("landing.final.cta")}</Link>
      </div>
    </section>

    <SiteFooter />
  </div>;
}

function PlanList({ items }: { items: string[] }) {
  return <ul className="relative z-[2] mt-6 space-y-2">
    {items.map((x) => <li key={x} className="flex gap-2 type-body"><Check strokeWidth={2.5} className="mt-0.5 size-5 shrink-0" aria-hidden="true" />{x}</li>)}
  </ul>;
}

/** Bold geometric marks, one per value card. */
function Shape({ i }: { i: number }) {
  return <svg viewBox="0 0 48 48" className="size-12" aria-hidden="true">
    {i === 0 && <circle cx="24" cy="24" r="18" fill="var(--ember)" />}
    {i === 1 && <><rect x="4" y="8" width="26" height="20" rx="6" fill="var(--plum)" /><rect x="18" y="20" width="26" height="20" rx="6" fill="var(--butter)" /></>}
    {i === 2 && <rect x="8" y="8" width="32" height="32" rx="4" fill="var(--blush)" transform="rotate(45 24 24)" />}
  </svg>;
}
