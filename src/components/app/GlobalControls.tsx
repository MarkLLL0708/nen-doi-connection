import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Monitor, Moon, Sun } from "lucide-react";
import { Pressable, applyTheme, type ThemeMode } from "@/components/visual";

export const THEME_KEY = "nendoi.theme";
export const LANG_KEY = "nendoi.lang";
const EVT = "nendoi-theme";

/** Saves and applies a theme choice everywhere (the floating switch and Settings stay in sync). */
export function setThemeEverywhere(m: ThemeMode) {
  applyTheme(m);
  try { localStorage.setItem(THEME_KEY, m); } catch { /* private mode */ }
  window.dispatchEvent(new CustomEvent(EVT, { detail: m }));
}
export function storedTheme(): ThemeMode | null {
  try { return (localStorage.getItem(THEME_KEY) as ThemeMode | null) ?? null; } catch { return null; }
}

const order: ThemeMode[] = ["system", "light", "dark"];
const icons = { system: Monitor, light: Sun, dark: Moon };
/** Pages with their own full switches in the header. */
const hidden = ["/preview-home", "/styleguide"];

/** Small floating language + light/dark switch shown on every screen. */
export function GlobalControls() {
  const { t, i18n } = useTranslation();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [mode, setMode] = useState<ThemeMode>("system");

  useEffect(() => {
    const m = storedTheme(); if (m) { setMode(m); applyTheme(m); }
    try { const l = localStorage.getItem(LANG_KEY); if (l && l !== i18n.language) void i18n.changeLanguage(l); } catch { /* ignore */ }
    const on = (e: Event) => setMode((e as CustomEvent<ThemeMode>).detail);
    window.addEventListener(EVT, on);
    return () => window.removeEventListener(EVT, on);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { document.documentElement.lang = i18n.language; }, [i18n.language]);

  if (hidden.includes(path)) return null;
  const Icon = icons[mode];
  const next = order[(order.indexOf(mode) + 1) % order.length]!;
  const lang = () => { const l = i18n.language === "vi" ? "en" : "vi"; void i18n.changeLanguage(l); try { localStorage.setItem(LANG_KEY, l); } catch { /* ignore */ } };

  return <div className="pointer-events-none fixed inset-x-0 top-0 z-50 mx-auto max-w-[390px]">
    <div className="pointer-events-auto absolute right-3 top-3 flex items-center gap-1 rounded-full bg-ink p-1 text-cream shadow-float">
      <Pressable onClick={lang} aria-label={t("actions.switchLanguage")} className="h-9 min-w-10 rounded-full px-3 text-[12px] font-bold tracking-[0.08em]">
        {i18n.language === "vi" ? "EN" : "VI"}
      </Pressable>
      <Pressable onClick={() => setThemeEverywhere(next)} aria-label={`${t("cb.theme.label")}: ${t(`cb.theme.${mode}`)}`} className="grid size-9 place-items-center rounded-full bg-cream text-ink">
        <Icon strokeWidth={2.5} className="size-4" />
      </Pressable>
    </div>
  </div>;
}
