import { useId } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export type FlameExpression = "vui" | "yeu" | "doi" | "doiBung" | "nho" | "ngu" | "mung" | "buon";
export const flameExpressions: FlameExpression[] = ["vui", "yeu", "doi", "doiBung", "nho", "ngu", "mung", "buon"];

export function FlameMascot({ expression = "vui", size = 116, pulse = false, className }: { expression?: FlameExpression; size?: number; pulse?: boolean; className?: string }) {
  const { t } = useTranslation();
  const id = useId().replaceAll(":", "");
  const sleepy = expression === "ngu";
  const love = expression === "yeu";
  const pout = expression === "doi";
  const sad = expression === "buon";
  const hungry = expression === "doiBung";
  const celebrating = expression === "mung";
  return <svg className={cn(pulse && "flame-pulse", className)} width={size} height={size} viewBox="0 0 160 160" role="img" aria-label={t("mascotLabel", { expression: t(`expressions.${expression}`) })} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id={`${id}-outer`} x1="19%" y1="14%" x2="81%" y2="92%"><stop stopColor="#FFCA73"/><stop offset="0.42" stopColor="#FF882C"/><stop offset="1" stopColor="#E95418"/></linearGradient>
      <linearGradient id={`${id}-inner`} x1="0%" y1="0%" x2="100%" y2="100%"><stop stopColor="#FFF3BA"/><stop offset="1" stopColor="#FFBD62"/></linearGradient>
      <filter id={`${id}-shadow`} x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#AC582C" floodOpacity="0.22"/></filter>
    </defs>
    <ellipse cx="80" cy="143" rx="42" ry="8" fill="#7B4029" opacity="0.11"/>
    <g filter={`url(#${id}-shadow)`}>
      <path d="M81 11C88 28 87 38 82 48C103 36 110 23 108 12C133 34 136 54 127 71C140 68 145 61 146 52C153 93 139 133 102 140C59 150 26 134 18 103C9 70 30 51 47 35C46 49 49 58 55 61C55 39 64 25 81 11Z" fill={`url(#${id}-outer)`}/>
      <path d="M75 52C79 64 75 72 69 80C86 72 94 63 95 51C112 66 123 83 120 105C116 127 101 137 79 137C57 137 40 126 37 106C34 88 44 72 56 62C56 74 58 78 63 81C63 69 67 59 75 52Z" fill={`url(#${id}-inner)`} opacity="0.84"/>
      <path d="M39 65C39 54 50 44 56 36" fill="none" stroke="#FFE7B8" strokeWidth="7" strokeLinecap="round" opacity="0.6"/>
      <ellipse cx="55" cy="103" rx="11" ry="6" fill="#ED7464" opacity="0.35"/><ellipse cx="108" cy="103" rx="11" ry="6" fill="#ED7464" opacity="0.35"/>
      {love ? <g fill="#753128"><path d="M59 88C51 79 43 92 59 100C75 92 67 79 59 88Z"/><path d="M103 88C95 79 87 92 103 100C119 92 111 79 103 88Z"/></g> : sleepy ? <g fill="none" stroke="#65362B" strokeWidth="4" strokeLinecap="round"><path d="M50 94q9 8 18 0"/><path d="M92 94q9 8 18 0"/></g> : <g fill="none" stroke="#65362B" strokeWidth="4.5" strokeLinecap="round">{pout ? <><path d="M52 88l16 5"/><path d="M108 88l-16 5"/></> : sad ? <><path d="M52 91q8-7 16 1"/><path d="M92 92q8-8 16-1"/></> : <><path d="M59 90v5"/><path d="M101 90v5"/></>}</g>}
      {hungry ? <><ellipse cx="80" cy="113" rx="7" ry="10" fill="#76362C"/><ellipse cx="82" cy="119" rx="3" ry="2" fill="#F59186"/></> : pout ? <path d="M75 111q7-7 14 0q-7 7-14 0Z" fill="#79372C"/> : sad ? <path d="M71 117q9-9 18 0" fill="none" stroke="#79372C" strokeWidth="3.5" strokeLinecap="round"/> : sleepy ? <path d="M75 113q6 4 12 0" fill="none" stroke="#79372C" strokeWidth="3" strokeLinecap="round"/> : celebrating ? <><path d="M69 109q11 21 22 0" fill="#79372C"/><path d="M75 119q5-5 11 0" fill="#EF9187"/></> : <path d="M69 109q11 15 22 0" fill="none" stroke="#79372C" strokeWidth="4" strokeLinecap="round"/>}
      {expression === "nho" && <path d="M108 100q8 10 0 13q-8-3 0-13Z" fill="#75BCE7"/>}
    </g>
    {celebrating && <g fill="#F7C957"><path d="M19 35l3 8 8 3-8 3-3 8-3-8-8-3 8-3Z"/><path d="M133 20l2 6 6 2-6 2-2 6-2-6-6-2 6-2Z"/></g>}
    {love && <path d="M131 40C124 33 118 42 131 51C144 42 138 33 131 40Z" fill="#F28E8C"/>}
  </svg>;
}
