import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

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
  const { data: u } = await supabase.auth.getUser();
  const userId = u.user?.id;
  if (!userId) return null;
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  const { data: members } = await supabase.from("couple_members").select("*");
  const mine = members?.find((m) => m.user_id === userId);
  let couple: Couple | null = null, partner: Profile | null = null, streak: Tables<"streaks"> | null = null;
  if (mine) {
    couple = (await supabase.from("couples").select("*").eq("id", mine.couple_id).maybeSingle()).data;
    const other = members!.find((m) => m.user_id !== userId);
    if (other) partner = (await supabase.from("profiles").select("*").eq("id", other.user_id).maybeSingle()).data;
    streak = (await supabase.from("streaks").select("*").eq("couple_id", mine.couple_id).maybeSingle()).data;
  }
  return { userId, profile, couple, members: members ?? [], partner, streak };
}

export function useMe() {
  return useQuery({ queryKey: meKey, queryFn: fetchMe, staleTime: 10_000 });
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
    void supabase.storage.from("photos").createSignedUrl(avatar.slice(5), 3600).then(({ data }) => { if (alive) setUrl(data?.signedUrl ?? null); });
    return () => { alive = false; };
  }, [avatar]);
  return url;
}

export function inviteLink(code: string) {
  return `${typeof window !== "undefined" ? window.location.origin : ""}/join?code=${code}`;
}

export const PENDING_CODE_KEY = "nendoi.pendingCode";
export const INTRO_SEEN_KEY = "nendoi.introSeen";
