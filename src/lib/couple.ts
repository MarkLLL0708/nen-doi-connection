import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { applySpaceKind } from "@/lib/space";

export type Profile = Tables<"profiles">;
export type Couple = Tables<"couples">;
export type Member = Tables<"couple_members">;
export type TodayStatus = { date: string; local_hour: number; members: { user_id: string; question: boolean; photo: boolean; game: boolean }[] };

export type Me = {
  userId: string;
  profile: Profile | null;
  couple: Couple | null;
  members: Member[];
  partner: Profile | null;
  streak: Tables<"streaks"> | null;
};

export const meKey = ["me"] as const;

export async function fetchMe(): Promise<Me | null> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const userId = authData.user?.id;
  if (!userId) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (profileError) throw profileError;

  // Fetch only this user's memberships first, then scope partner lookup to that couple.
  const { data: myMemberships, error: membershipError } = await supabase
    .from("couple_members")
    .select("*")
    .eq("user_id", userId);
  if (membershipError) throw membershipError;

  const mine = myMemberships?.[0] ?? null;
  if (!mine) {
    return { userId, profile, couple: null, members: [], partner: null, streak: null };
  }

  const { data: members, error: membersError } = await supabase
    .from("couple_members")
    .select("*")
    .eq("couple_id", mine.couple_id);
  if (membersError) throw membersError;

  const { data: couple, error: coupleError } = await supabase
    .from("couples")
    .select("*")
    .eq("id", mine.couple_id)
    .maybeSingle();
  if (coupleError) throw coupleError;

  const partnerMember = members?.find((member) => member.user_id !== userId) ?? null;
  let partner: Profile | null = null;
  if (partnerMember) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", partnerMember.user_id)
      .maybeSingle();
    if (error) throw error;
    partner = data;
  }

  const { data: streak, error: streakError } = await supabase
    .from("streaks")
    .select("*")
    .eq("couple_id", mine.couple_id)
    .maybeSingle();
  if (streakError) throw streakError;

  return { userId, profile, couple, members: members ?? [], partner, streak };
}

export function useMe() {
  const query = useQuery({ queryKey: meKey, queryFn: fetchMe, staleTime: 10_000 });
  useEffect(() => { if (query.data?.couple) applySpaceKind(query.data.couple.kind === "friends" ? "friends" : "couple"); }, [query.data?.couple?.kind]);
  return query;
}

export function useInvalidateMe() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: meKey });
}

export async function updateProfile(userId: string, patch: Partial<Profile>) {
  const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
  if (error) throw error;
}

/** Signed URL for an uploaded avatar ("file:<path>"), refreshed hourly. */
export function useAvatarUrl(avatar: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!avatar?.startsWith("file:")) { setUrl(null); return; }
    let alive = true;
    void supabase.storage.from("photos").createSignedUrl(avatar.slice(5), 3600).then(({ data }) => { if (alive) setUrl(data?.signedUrl ?? null); }).catch(() => { if (alive) setUrl(null); });
    return () => { alive = false; };
  }, [avatar]);
  return url;
}

export function inviteLink(code: string) {
  return `${typeof window !== "undefined" ? window.location.origin : ""}/join?code=${encodeURIComponent(code)}`;
}

export const PENDING_CODE_KEY = "nendoi.pendingCode";
export const INTRO_SEEN_KEY = "nendoi.introSeen";
