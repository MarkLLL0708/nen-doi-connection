import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Logo, Pressable } from "@/components/visual";
import { LANG_KEY } from "@/components/app/GlobalControls";
import { cn } from "@/lib/utils";

export function setLang(l: "vi" | "en", i18n: { changeLanguage: (l: string) => unknown }) {
  void i18n.changeLanguage(l);
  try { localStorage.setItem(LANG_KEY, l); } catch { /* private mode */ }
}

/** Two-button VI / EN switch. */
export function LangSwitch({ className }: { className?: string }) {
  const { t, i18n } = useTranslation();
  return <div role="group" aria-label={t("landing.nav.langLabel")} className={cn("flex items-center rounded-full bg-ink p-1 text-cream", className)}>
    {(["vi", "en"] as const).map((l) => <Pressable key={l} onClick={() => setLang(l, i18n)} aria-pressed={i18n.language === l}
      className={cn("h-9 min-w-11 rounded-full px-3 text-[12px] font-bold tracking-[0.08em]", i18n.language === l && "bg-cream text-ink")}>{l.toUpperCase()}</Pressable>)}
  </div>;
}

export function SiteHeader() {
  const { t } = useTranslation();
  return <header className="mx-auto flex max-w-[1120px] items-center justify-between gap-3 px-5 py-4">
    <Link to="/" aria-label="Nến Đôi"><Logo /></Link>
    <div className="flex items-center gap-2">
      <LangSwitch />
      <Link to="/auth" className="inline-flex h-11 items-center rounded-full block-ember px-5 type-button">{t("landing.nav.start")}</Link>
    </div>
  </header>;
}

export function SiteFooter() {
  const { t } = useTranslation();
  return <footer className="block-ink">
    <div className="mx-auto flex max-w-[1120px] flex-col gap-6 px-5 py-10 md:flex-row md:items-center md:justify-between">
      <div><Logo onBlock /><p className="mt-2 type-caption opacity-80">{t("landing.footer.rights")}</p></div>
      <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 type-button">
        <Link to="/privacy" className="underline-offset-4 hover:underline">{t("landing.footer.privacy")}</Link>
        <Link to="/terms" className="underline-offset-4 hover:underline">{t("landing.footer.terms")}</Link>
        <Link to="/contact" className="underline-offset-4 hover:underline">{t("landing.footer.contact")}</Link>
      </nav>
      <LangSwitch className="self-start bg-cream text-ink [&_[aria-pressed=true]]:bg-ink [&_[aria-pressed=true]]:text-cream" />
    </div>
  </footer>;
}
