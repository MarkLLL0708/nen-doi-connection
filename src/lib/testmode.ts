// TEST MODE ONLY — see TEST_MODE_REMOVAL.md.
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/**
 * True only in the dev/preview build (Vite dev server). The published site is a production
 * build where import.meta.env.DEV is statically false, so every test-mode branch is removed.
 */
export const TEST_MODE_ENABLED = import.meta.env.DEV;

const SESS_KEY = "nendoi.test.sessions";
const WHO_KEY = "nendoi.test.who";
export const SAMPLE_PHOTOS_KEY = "nendoi.test.samplePhotos";
export const FAKE_HOUR_KEY = "nendoi.test.fakeHour";
export type Who = "A" | "B";

function load(): Partial<Record<Who, Session>> {
  try { return JSON.parse(localStorage.getItem(SESS_KEY) ?? "{}"); } catch { return {}; }
}
function save(who: Who, s: Session) {
  localStorage.setItem(SESS_KEY, JSON.stringify({ ...load(), [who]: s }));
  localStorage.setItem(WHO_KEY, who);
}
export function currentWho(): Who | null {
  if (!TEST_MODE_ENABLED) return null;
  try { return (localStorage.getItem(WHO_KEY) as Who | null) ?? null; } catch { return null; }
}

/** Switches to a test account using a stored real session, or asks the server for a fresh one. */
export async function switchTo(who: Who, fresh: () => Promise<{ tokenHash: string }>) {
  const { data: cur } = await supabase.auth.getSession();
  const was = currentWho();
  if (cur.session && was) save(was, cur.session);
  const stored = load()[who];
  if (stored) {
    const { data, error } = await supabase.auth.setSession({ access_token: stored.access_token, refresh_token: stored.refresh_token });
    if (!error && data.session) { save(who, data.session); return; }
  }
  const { tokenHash } = await fresh();
  const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" });
  if (error || !data.session) throw error ?? new Error("no session");
  save(who, data.session);
}

export function forgetTestSessions() {
  localStorage.removeItem(SESS_KEY); localStorage.removeItem(WHO_KEY);
}

export function testFlag(key: string): string | null {
  if (!TEST_MODE_ENABLED) return null;
  try { return localStorage.getItem(key); } catch { return null; }
}
