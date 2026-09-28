import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { COACH_DIALECTS, COACH_MAX_INPUT, COACH_TONES, COACH_USE_CASES, type CoachResult } from "@/config/coach";

const Input = z.object({
  text: z.string().trim().min(1).max(COACH_MAX_INPUT),
  useCase: z.enum(COACH_USE_CASES), tone: z.enum(COACH_TONES), dialect: z.enum(COACH_DIALECTS),
  partner: z.string().trim().max(40),
});

/** "Coach": screens for safety, checks the weekly limit, then asks the provider (mock for now). Pasted text is never stored unless the user turned history on. */
export const coachSuggest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }): Promise<CoachResult> => {
    const { needsSafety, shouldRefuse, provider } = await import("@/lib/coach.server");
    if (needsSafety(data.text)) return { kind: "safety" };
    if (shouldRefuse(data.text)) return { kind: "refuse" };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: remaining, error } = await supabaseAdmin.rpc("use_coach", { _user: context.userId, _consume: true });
    if (error) { if (/coach limit/.test(error.message)) return { kind: "limit" }; throw new Error("Could not check the weekly limit"); }
    const versions = await provider.suggest({ ...data, partner: data.partner || "người ấy" });
    const { data: p } = await context.supabase.from("profiles").select("save_coach_history").eq("id", context.userId).single();
    if (p?.save_coach_history) await context.supabase.from("coach_history").insert({ user_id: context.userId, use_case: data.useCase, tone: data.tone, dialect: data.dialect, input: data.text, output: versions });
    return { kind: "ok", versions, remaining: remaining as number };
  });

export const coachRemaining = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("use_coach", { _user: context.userId, _consume: false });
    if (error) throw new Error("Could not read the weekly limit");
    return { remaining: data as number };
  });
