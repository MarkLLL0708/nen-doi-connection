import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/landing/SiteChrome";

/** Plain draft legal text; `page` is privacy | terms | contact. */
export function LegalPage({ page }: { page: "privacy" | "terms" | "contact" }) {
  const { t } = useTranslation();
  const sections = t(`landing.legal.${page}.sections`, { returnObjects: true }) as { h: string; p: string }[];
  return <div className="flex min-h-dvh flex-col bg-background text-foreground">
    <SiteHeader />
    <main className="mx-auto w-full max-w-[720px] flex-1 px-5 pb-16 pt-4">
      <Link to="/" className="flex h-12 w-fit items-center gap-2 type-button"><ArrowLeft strokeWidth={2.5} className="size-5" aria-hidden="true" />{t("landing.legal.back")}</Link>
      <p className="mt-4 inline-block rounded-full block-butter px-3 py-1 type-label">{t("landing.legal.draft")}</p>
      <h1 className="mt-4 type-display text-[40px] leading-[1.15]">{t(`landing.legal.${page}.title`)}</h1>
      <p className="mt-2 type-caption text-muted-foreground">{t("landing.legal.updated")}</p>
      <div className="mt-8 space-y-6">{sections.map((s) => <section key={s.h}><h2 className="type-title">{s.h}</h2><p className="mt-2 type-body">{s.p}</p></section>)}</div>
    </main>
    <SiteFooter />
  </div>;
}

export function legalHead(page: "privacy" | "terms" | "contact", t: (k: string) => string) {
  const title = t(`landing.legal.${page}.metaTitle`), desc = t(`landing.legal.${page}.metaDesc`);
  return { meta: [
    { title }, { name: "description", content: desc }, { property: "og:title", content: title }, { property: "og:description", content: desc },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] };
}
