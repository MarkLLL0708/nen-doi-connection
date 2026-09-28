import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FlameMark } from "@/components/visual";
import { INTRO_SEEN_KEY } from "@/lib/couple";
import i18n from "@/i18n";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: i18n.t("app.meta.introTitle") },
    { name: "description", content: i18n.t("app.meta.introDesc") },
    { property: "og:title", content: i18n.t("app.meta.introTitle") },
    { property: "og:description", content: i18n.t("app.meta.introDesc") },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Entry,
});

/** Session-aware entry: signed in -> app, otherwise intro (once) then sign-in. */
function Entry() {
  const navigate = useNavigate();
  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: "/app", replace: true });
      else void navigate({ to: localStorage.getItem(INTRO_SEEN_KEY) ? "/auth" : "/intro", replace: true });
    });
  }, [navigate]);
  return <div className="grid min-h-dvh place-items-center bg-background"><FlameMark size={40} /></div>;
}
