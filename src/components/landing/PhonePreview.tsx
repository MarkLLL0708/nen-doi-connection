import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";
import { MessageCircle } from "lucide-react";
import { ActionTile, AvatarDuo, Block, CountUp, FitText, StreakLine, snap } from "@/components/visual";

/** Looping preview of Home -> both answered -> reveal, with the mock couple Linh and Minh. No data. */
export function PhonePreview() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (reduce) { setStep(3); return; }
    const id = setInterval(() => setStep((s) => (s + 1) % 4), 2400);
    return () => clearInterval(id);
  }, [reduce]);
  const both = step >= 1;
  return <div aria-label={t("landing.phone.label")} role="img" className="relative mx-auto w-[300px] rounded-[44px] bg-ink p-3 shadow-float">
    <div className="relative h-[600px] overflow-hidden rounded-[34px] bg-background text-foreground">
      <AnimatePresence mode="wait" initial={false}>
        {step < 2 ? <motion.div key="home" className="space-y-3 p-4 pt-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: snap }}>
          <AvatarDuo size={36} people={[{ name: "Minh", done: true, avatar: "geo:1" }, { name: "Linh", done: both, avatar: "geo:2" }]} />
          <Block tone="block-ember" className="rounded-[22px] p-4">
            <FitText max={72} measure="412"><CountUp to={412} /></FitText>
            <p className="type-title text-[18px]">{t("landing.phone.days")}</p>
          </Block>
          <div className="px-1 [&_.type-title]:text-[17px]"><StreakLine count={7} note={t("landing.phone.streak")} /></div>
          <ActionTile tone="block-plum" icon={MessageCircle} title={t("landing.phone.question")} youDone partnerDone={both} youName="Minh" partnerName="Linh" />
          <p className="px-1 type-caption text-muted-foreground">{both ? t("landing.phone.bothDone") : t("landing.phone.minhDone")}</p>
        </motion.div> : step === 2 ? <motion.div key="flood" className="grain block-plum absolute inset-0 flex flex-col justify-end p-5"
          initial={{ clipPath: "circle(0% at 50% 80%)" }} animate={{ clipPath: "circle(150% at 50% 80%)" }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: snap }}>
          <p className="relative z-[2] type-label">{t("landing.phone.bothDone")}</p>
          <p className="relative z-[2] mt-3 type-display text-[30px] leading-[1.15]">{t("landing.phone.q")}</p>
          <span className="relative z-[2] mt-6 inline-flex h-12 items-center justify-center rounded-[16px] bg-cream type-button text-ink">{t("landing.phone.reveal")}</span>
        </motion.div> : <motion.div key="reveal" className="grain block-plum absolute inset-0 flex flex-col p-5 pt-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <p className="relative z-[2] type-display text-[24px] leading-[1.15]">{t("landing.phone.q")}</p>
          <div className="relative z-[2] mt-5 grid grid-cols-2 gap-2">
            {[["Minh", t("landing.phone.a1")], ["Linh", t("landing.phone.a2")]].map(([n, a], i) => <motion.div key={n} className="rounded-[18px] bg-cream p-3 text-ink"
              initial={reduce ? { opacity: 0 } : { opacity: 0, x: i ? 30 : -30 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", stiffness: 400, damping: 28, delay: i * 0.08 }}>
              <p className="type-label">{n}</p><p className="mt-2 text-[14px] font-bold leading-snug">{a}</p>
            </motion.div>)}
          </div>
          <p className="relative z-[2] mt-auto inline-flex self-start rounded-full block-butter px-4 py-2 type-button">{t("landing.phone.match")}</p>
        </motion.div>}
      </AnimatePresence>
    </div>
  </div>;
}
