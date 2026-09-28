// TEST MODE ONLY — see TEST_MODE_REMOVAL.md. Every call returns 403 unless the TEST_MODE secret is "true".
import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { z } from "zod";

const ACCOUNTS = {
  A: { email: "thu-a@nendoi-test.example.com", name: "Thử A", call: "Bé B", city: "Hà Nội" },
  B: { email: "thu-b@nendoi-test.example.com", name: "Thử B", call: "Bé A", city: "TP.HCM" },
} as const;
type Who = keyof typeof ACCOUNTS;

function gate() {
  if (process.env["TEST_MODE"] !== "true") { setResponseStatus(403); throw new Error("Test mode is off"); }
}
async function admin() {
  return (await import("@/integrations/supabase/client.server")).supabaseAdmin;
}

/** Makes sure the test user exists (email pre-confirmed) and is flagged; returns its id. */
async function ensureUser(who: Who): Promise<string> {
  const a = await admin();
  const acc = ACCOUNTS[who];
  const created = await a.auth.admin.createUser({ email: acc.email, email_confirm: true, user_metadata: { full_name: acc.name } });
  let id = created.data.user?.id;
  if (!id) {
    const { data } = await a.auth.admin.listUsers({ perPage: 1000 });
    id = data.users.find((u) => u.email === acc.email)?.id;
  }
  if (!id) throw new Error("Could not create test user");
  await a.from("profiles").upsert({ id, is_test_account: true }, { onConflict: "id" });
  const { data: p } = await a.from("profiles").select("is_test_account").eq("id", id).single();
  if (!p?.is_test_account) throw new Error("Not a test account");
  return id;
}

async function testCouple(ids: string[]) {
  const a = await admin();
  const { data } = await a.from("couple_members").select("couple_id,user_id").in("user_id", ids);
  return data ?? [];
}

/** Returns a one-time token the browser exchanges for a real session of the test account. */
export const testSignIn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ who: z.enum(["A", "B"]) }).parse(d))
  .handler(async ({ data }) => {
    gate();
    await ensureUser(data.who);
    const a = await admin();
    const { data: link, error } = await a.auth.admin.generateLink({ type: "magiclink", email: ACCOUNTS[data.who].email });
    if (error || !link.properties?.hashed_token) throw new Error("Could not sign in test account");
    return { tokenHash: link.properties.hashed_token };
  });

export const testStatus = createServerFn({ method: "GET" }).handler(async () => {
  gate();
  return { ok: true };
});

export const testSetupCouple = createServerFn({ method: "POST" }).handler(async () => {
  gate();
  const a = await admin();
  const idA = await ensureUser("A"), idB = await ensureUser("B");
  const members = await testCouple([idA, idB]);
  const cA = members.find((m) => m.user_id === idA)?.couple_id, cB = members.find((m) => m.user_id === idB)?.couple_id;
  if (cA && cA === cB) return { created: false };
  if (cA || cB) throw new Error("A test account is already in another couple. Clear test data first.");
  const now = new Date();
  for (const who of ["A", "B"] as const) {
    const acc = ACCOUNTS[who];
    await a.from("profiles").update({ display_name: acc.name, partner_call_name: acc.call, dialect: "neutral", tone: "neutral", avatar: who === "A" ? "geo:1" : "geo:2",
      age_confirmed: true, consent_at: now.toISOString(), onboarded: true, timezone: "Asia/Ho_Chi_Minh" }).eq("id", who === "A" ? idA : idB);
  }
  const start = new Date(now.getTime() - 412 * 86400000).toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
  const { data: c, error } = await a.from("couples").insert({ start_date: start, relationship_type: "dating", partner_city: ACCOUNTS.B.city, timezone: "Asia/Ho_Chi_Minh", created_by: idA }).select("id").single();
  if (error || !c) throw new Error("Could not create couple");
  await a.from("couple_members").insert([{ couple_id: c.id, user_id: idA, city: ACCOUNTS.A.city }, { couple_id: c.id, user_id: idB, city: ACCOUNTS.B.city }]);
  await a.from("streaks").insert({ couple_id: c.id });
  await a.from("subscriptions").insert({ couple_id: c.id });
  return { created: true };
});

async function removePhotos(paths: string[]) {
  if (paths.length) await (await admin()).storage.from("photos").remove(paths);
}

export const testClearToday = createServerFn({ method: "POST" }).handler(async () => {
  gate();
  const a = await admin();
  const ids = [await ensureUser("A"), await ensureUser("B")];
  const cid = (await testCouple(ids))[0]?.couple_id;
  if (!cid) return { cleared: false };
  const day = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
  const { data: ans } = await a.from("question_answers").select("id").eq("couple_id", cid).eq("answer_date", day);
  if (ans?.length) await a.from("answer_reactions").delete().in("answer_id", ans.map((x) => x.id));
  await a.from("answer_replies").delete().eq("couple_id", cid).eq("answer_date", day);
  await a.from("question_answers").delete().eq("couple_id", cid).eq("answer_date", day);
  const { data: ph } = await a.from("photo_posts").select("storage_path").eq("couple_id", cid).eq("post_date", day);
  await removePhotos((ph ?? []).map((p) => p.storage_path));
  await a.from("photo_posts").delete().eq("couple_id", cid).eq("post_date", day);
  const { data: ses } = await a.from("game_sessions").select("id").eq("couple_id", cid).eq("played_on", day);
  if (ses?.length) {
    await a.from("game_responses").delete().in("session_id", ses.map((s) => s.id));
    await a.from("game_sessions").delete().in("id", ses.map((s) => s.id));
  }
  // Undo today's streak step so the day can be replayed.
  const { data: st } = await a.from("streaks").select("current,last_completed").eq("couple_id", cid).single();
  if (st?.last_completed === day) {
    const prev = new Date(Date.parse(day) - 86400000).toISOString().slice(0, 10);
    await a.from("streaks").update({ current: Math.max(0, st.current - 1), last_completed: st.current > 1 ? prev : null }).eq("couple_id", cid);
  }
  return { cleared: true };
});

export const testClearAll = createServerFn({ method: "POST" }).handler(async () => {
  gate();
  const a = await admin();
  const ids = [await ensureUser("A"), await ensureUser("B")];
  const cids = [...new Set((await testCouple(ids)).map((m) => m.couple_id))];
  for (const cid of cids) {
    const { data: ph } = await a.from("photo_posts").select("storage_path").eq("couple_id", cid);
    const { data: mem } = await a.from("memories").select("storage_path").eq("couple_id", cid);
    await removePhotos([...(ph ?? []), ...(mem ?? [])].map((p) => p.storage_path).filter((p): p is string => !!p));
    for (const t of ["answer_reactions", "answer_replies", "question_answers", "photo_posts", "game_responses", "game_sessions", "date_swipes", "shared_date_list",
      "memories", "occasions", "pack_consents", "couple_questions", "streak_freezes", "streaks", "subscriptions", "invites", "couple_members"] as const) {
      await a.from(t).delete().eq("couple_id", cid);
    }
    await a.from("couples").delete().eq("id", cid);
  }
  await a.from("profiles").update({ onboarded: false, partner_call_name: null }).in("id", ids);
  return { cleared: cids.length };
});
