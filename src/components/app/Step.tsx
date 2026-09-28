import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { Pressable, PrimaryButton, SlideUp, snap } from "@/components/visual";
import { Shell } from "./Shell";
import { cn } from "@/lib/utils";

/** One question per screen: colour flood, thin progress bar, huge question, big options. */
export function StepScreen({ stepKey, tone, label, question, note, progress, onBack, onNext, canNext, nextLabel, busy, children }: {
  stepKey: string; tone: string; label: string; question: string; note?: string | undefined; progress: number;
  onBack?: (() => void) | undefined; onNext?: (() => void) | undefined; canNext?: boolean | undefined; nextLabel?: string | undefined; busy?: boolean | undefined; children?: ReactNode;
}) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  return <Shell className={cn("grain transition-colors duration-300", tone)}>
    <div className="relative z-[2] flex flex-1 flex-col px-5 pb-8 pt-4">
      <div className="flex items-center gap-3">
        {onBack ? <Pressable aria-label={t("app.back")} onClick={onBack} className="grid size-11 place-items-center rounded-full bg-current/10"><ArrowLeft strokeWidth={2.5} className="size-5" /></Pressable> : <span className="size-11" />}
        <div className="mr-[92px] h-1.5 flex-1 overflow-hidden rounded-full bg-current/20" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
          <motion.div className="h-full rounded-full bg-current" animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.3, ease: snap }} />
        </div>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={stepKey} className="flex flex-1 flex-col" initial={reduce ? { opacity: 0 } : { x: 48, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={reduce ? { opacity: 0 } : { x: -48, opacity: 0 }} transition={{ duration: 0.28, ease: snap }}>
          <p className="mt-10 type-label">{label}</p>
          <h1 className="mt-3 type-display"><SlideUp>{question}</SlideUp></h1>
          {note && <p className="mt-3 type-body opacity-80">{note}</p>}
          <div className="mt-8 flex-1">{children}</div>
        </motion.div>
      </AnimatePresence>
      {onNext && <PrimaryButton className="mt-6" disabled={!canNext || busy} onClick={onNext}>{nextLabel ?? t("app.next")}</PrimaryButton>}
    </div>
  </Shell>;
}

/** Big tappable answer option with press feedback. */
export function Option({ selected, onClick, children, sub }: { selected: boolean; onClick: () => void; children: ReactNode; sub?: string | undefined }) {
  return <Pressable haptics aria-pressed={selected} onClick={onClick}
    className={cn("flex min-h-14 w-full flex-col items-start justify-center rounded-[20px] px-5 py-3 text-left type-button text-[17px] transition-colors", selected ? "bg-ink text-cream" : "bg-current/10")}>
    <span>{children}</span>{sub && <span className="mt-1 text-[14px] font-medium opacity-80">{sub}</span>}
  </Pressable>;
}

export const stepInput = "h-16 w-full rounded-[20px] bg-cream px-5 text-[20px] font-bold text-ink placeholder:text-ink/50 focus:outline-none focus-visible:ring-4 focus-visible:ring-ink/40";
