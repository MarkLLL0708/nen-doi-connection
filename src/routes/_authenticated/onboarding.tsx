import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, FlameMark, Pressable, geoAvatars } from "@/components/visual";
import { Option, StepScreen, stepInput } from "@/components/app/Step";
import { Shell } from "@/components/app/Shell";
import { PENDING_CODE_KEY, updateProfile, useAvatarUrl, useInvalidateMe, useMe } from "@/lib/couple";
import { cn } from "@/lib/utils";
import i18n from "@/i18n";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [
    { title: i18n.t("app.meta.setupTitle") },
    { name: "description", content: i18n.t("app.meta.setupDesc") },
    { property: "og:title", content: i18n.t("app.meta.setupTitle") },
    { property: "og:description", content: i18n.t("app.meta.setupDesc") },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Onboarding,
});

const tones = ["block-ember", "block-plum", "block-butter", "block-blush", "block-deep", "block-tet", "block-ember", "block-plum", "block-butter", "block-blush", "block-plum", "block-ember"];
const calls = ["anh", "em", "ban", "minh", "cau"] as const;
const cities = ["hanoi", "hcm", "danang", "dalat", "haiphong", "cantho", "nhatrang", "other"] as const;
const profileSteps = ["name", "birthday", "avatar", "call", "dialect", "tone", "age", "consent"] as const;
const coupleSteps = ["choice", "start", "type", "myCity", "partnerCity"] as const;
type StepId = typeof profileSteps[number] | typeof coupleSteps[number];

function Onboarding() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: me, isLoading } = useMe();
  const invalidate = useInvalidateMe();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [f, setF] = useState({ name: "", birthday: "", avatar: "geo:1", call: "", customCall: "", dialect: "", tone: "", age: false, consent: false,
    start: "", type: "", myCity: "", partnerCity: "" });
  const set = (patch: Partial<typeof f>) => setF((x) => ({ ...x, ...patch }));
  const avatarUrl = useAvatarUrl(f.avatar);

  const steps: StepId[] = useMemo(() => {
    if (!me) return [];
    const s: StepId[] = me.profile?.onboarded ? [] : [...profileSteps];
    if (!me.couple) s.push(...coupleSteps);
    return s;
  }, [me?.profile?.onboarded, me?.couple]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!me) return;
    if (me.profile?.display_name && !f.name) set({ name: me.profile.display_name });
    if (me.profile?.partner_call_name && !f.call) set({ call: "custom", customCall: me.profile.partner_call_name });
    if (me.profile?.onboarded && me.couple) void navigate({ to: "/app", replace: true });
  }, [me]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading || !me) return <Shell><div className="grid flex-1 place-items-center"><FlameMark size={40} /></div></Shell>;
  const step = steps[Math.min(idx, steps.length - 1)];
  if (!step) return null;

  const callName = f.call === "custom" ? f.customCall.trim() : f.call ? t(`app.setup.call.${f.call}`) : (me.profile?.partner_call_name ?? "");
  const partner = callName || t("app.setup.call.ban");
  const back = idx > 0 ? () => { setErr(null); setIdx(idx - 1); } : undefined;
  const advance = () => { setErr(null); setIdx(idx + 1); };

  const saveProfile = async () => {
    setBusy(true);
    try {
      await updateProfile(me.userId, { display_name: f.name.trim(), birthday: f.birthday || null, avatar: f.avatar, partner_call_name: callName,
        dialect: f.dialect, tone: f.tone, age_confirmed: true, consent_at: new Date().toISOString(), onboarded: true,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Ho_Chi_Minh" });
      await invalidate();
      if (me.couple) void navigate({ to: "/app", replace: true }); else advance();
    } catch { setErr(t("app.error")); }
    setBusy(false);
  };

  const createCouple = async () => {
    setBusy(true);
    const { error } = await supabase.rpc("create_couple", { _start_date: f.start, _type: f.type, _my_city: f.myCity, _partner_city: f.partnerCity });
    setBusy(false);
    if (error) { setErr(/already/.test(error.message) ? t("app.pair.already") : t("app.error")); return; }
    await invalidate();
    void navigate({ to: "/pair" });
  };

  const upload = async (file: File) => {
    setBusy(true);
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `u-${me.userId}/avatar/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("photos").upload(path, file, { upsert: false, contentType: file.type });
    setBusy(false);
    if (error) { setErr(t("app.error")); return; }
    set({ avatar: `file:${path}` });
  };

  const common = { stepKey: step, tone: tones[idx % tones.length]!, progress: (idx + 1) / steps.length, onBack: back, busy };
  const L = (k: string, opts?: Record<string, string>) => t(`app.setup.${k}`, { partner, ...opts });
  const errLine = err && <p role="alert" className="mt-4 rounded-[18px] bg-ink px-4 py-3 text-[14px] font-bold text-cream">{err}</p>;

  switch (step) {
    case "name": return <StepScreen {...common} label={L("name.label")} question={L("name.q")} canNext={f.name.trim().length > 0} onNext={advance}>
      <input autoFocus className={stepInput} maxLength={40} placeholder={L("name.ph")} value={f.name} onChange={(e) => set({ name: e.target.value })} aria-label={L("name.ph")} />
    </StepScreen>;
    case "birthday": return <StepScreen {...common} label={L("birthday.label")} question={L("birthday.q")} note={L("birthday.note")} canNext={!!f.birthday} onNext={advance}>
      <input type="date" className={stepInput} max={new Date().toISOString().slice(0, 10)} value={f.birthday} onChange={(e) => set({ birthday: e.target.value })} aria-label={L("birthday.q")} />
    </StepScreen>;
    case "avatar": return <StepScreen {...common} label={L("avatar.label")} question={L("avatar.q")} canNext onNext={advance}>
      <div className="flex items-center gap-4"><Avatar value={f.avatar} url={avatarUrl} name={f.name} size={96} />
        <Pressable onClick={() => fileRef.current?.click()} className="inline-flex h-14 items-center gap-2 rounded-[18px] bg-ink px-5 type-button text-cream"><Upload strokeWidth={2.5} className="size-5" />{busy ? L("avatar.uploading") : L("avatar.upload")}</Pressable>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) void upload(file); }} />
      </div>
      <p className="mt-8 type-label">{L("avatar.pick")}</p>
      <div className="mt-3 grid grid-cols-3 gap-3">{geoAvatars.map((g) => <Pressable key={g} aria-pressed={f.avatar === g} aria-label={g} onClick={() => set({ avatar: g })}
        className={cn("grid place-items-center rounded-[20px] p-3", f.avatar === g ? "bg-ink" : "bg-current/10")}><Avatar value={g} size={64} /></Pressable>)}</div>
      {errLine}
    </StepScreen>;
    case "call": return <StepScreen {...common} label={L("call.label")} question={L("call.q")} canNext={f.call !== "" && (f.call !== "custom" || f.customCall.trim().length > 0)} onNext={advance}>
      <div className="grid grid-cols-2 gap-3">{calls.map((c) => <Option key={c} selected={f.call === c} onClick={() => set({ call: c })}>{L(`call.${c}`)}</Option>)}
        <Option selected={f.call === "custom"} onClick={() => set({ call: "custom" })}>{L("call.custom")}</Option></div>
      {f.call === "custom" && <input autoFocus className={cn(stepInput, "mt-4")} maxLength={24} placeholder={L("call.customPh")} value={f.customCall} onChange={(e) => set({ customCall: e.target.value })} aria-label={L("call.custom")} />}
    </StepScreen>;
    case "dialect": return <StepScreen {...common} label={L("dialect.label")} question={L("dialect.q")} canNext={!!f.dialect} onNext={advance}>
      <div className="space-y-3">{(["bac", "trung", "nam", "neutral"] as const).map((d) => <Option key={d} selected={f.dialect === d} onClick={() => set({ dialect: d })}>{L(`dialect.${d}`)}</Option>)}</div>
    </StepScreen>;
    case "tone": return <StepScreen {...common} label={L("tone.label")} question={L("tone.q")} canNext={!!f.tone} onNext={advance}>
      <div className="space-y-3">{(["sweet", "genz", "neutral"] as const).map((d) => <Option key={d} selected={f.tone === d} onClick={() => set({ tone: d })} sub={L(`tone.${d}Ex`)}>{L(`tone.${d}`)}</Option>)}</div>
    </StepScreen>;
    case "age": return <StepScreen {...common} label={L("age.label")} question={L("age.q")} note={L("age.note")} canNext={f.age} onNext={advance}>
      <Option selected={f.age} onClick={() => set({ age: !f.age })}>{L("age.yes")}</Option>
    </StepScreen>;
    case "consent": return <StepScreen {...common} label={L("consent.label")} question={L("consent.q")} note={L("consent.body")} canNext={f.consent} onNext={() => void saveProfile()} nextLabel={me.couple ? L("done") : undefined}>
      <Option selected={f.consent} onClick={() => set({ consent: !f.consent })}>{L("consent.yes")}</Option>{errLine}
    </StepScreen>;
    case "choice": return <StepScreen {...common} label={L("choice.label")} question={L("choice.q")}>
      <div className="space-y-3">
        <Option selected={false} onClick={advance}>{L("choice.create")}</Option>
        <Option selected={!!(typeof window !== "undefined" && sessionStorage.getItem(PENDING_CODE_KEY))} onClick={() => void navigate({ to: "/pair", search: { join: true } })}>{L("choice.join")}</Option>
      </div>
    </StepScreen>;
    case "start": return <StepScreen {...common} label={L("start.label")} question={L("start.q")} canNext={!!f.start} onNext={advance}>
      <input type="date" className={stepInput} max={new Date().toISOString().slice(0, 10)} value={f.start} onChange={(e) => set({ start: e.target.value })} aria-label={L("start.q")} />
    </StepScreen>;
    case "type": return <StepScreen {...common} label={L("type.label")} question={L("type.q")} canNext={!!f.type} onNext={advance}>
      <div className="space-y-3">{(["dating", "engaged", "married", "long_distance"] as const).map((d) => <Option key={d} selected={f.type === d} onClick={() => set({ type: d })}>{L(`type.${d}`)}</Option>)}</div>
    </StepScreen>;
    case "myCity": case "partnerCity": {
      const key = step;
      return <StepScreen {...common} label={L(`${key}.label`)} question={L(`${key}.q`)} canNext={!!f[key]} onNext={key === "myCity" ? advance : () => void createCouple()} nextLabel={key === "partnerCity" ? L("done") : undefined}>
        <div className="grid grid-cols-2 gap-3">{cities.map((c) => <Option key={c} selected={f[key] === c} onClick={() => set({ [key]: c })}>{L(`cities.${c}`)}</Option>)}</div>{errLine}
      </StepScreen>;
    }
  }
}
