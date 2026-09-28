import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Logo, PrimaryButton, SlideUp } from "@/components/visual";
import { Shell } from "@/components/app/Shell";
import { PENDING_CODE_KEY } from "@/lib/couple";
import i18n from "@/i18n";

export const Route = createFileRoute("/join")({
  validateSearch: z.object({ code: z.string().max(12).optional() }),
  head: () => ({ meta: [
    { title: i18n.t("app.meta.joinTitle") },
    { name: "description", content: i18n.t("app.meta.joinDesc") },
    { property: "og:title", content: i18n.t("app.meta.joinTitle") },
    { property: "og:description", content: i18n.t("app.meta.joinDesc") },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Join,
});

function Join() {
  const { t } = useTranslation();
  const { code } = Route.useSearch();
  const navigate = useNavigate();
  const accept = async () => {
    if (code) sessionStorage.setItem(PENDING_CODE_KEY, code.toUpperCase());
    const { data } = await supabase.auth.getSession();
    void navigate({ to: data.session ? "/app" : "/auth" });
  };
  return <Shell className="grain block-ember">
    <div className="relative z-[2] flex flex-1 flex-col px-5 pb-8 pt-6">
      <Logo onBlock />
      <div className="flex flex-1 flex-col justify-end pb-10">
        <p className="type-label">{t("app.join.label")}</p>
        <h1 className="mt-4 type-display"><SlideUp>{t("app.join.title")}</SlideUp></h1>
        {code && <p className="mt-4 type-body">{t("app.join.body", { code: code.toUpperCase() })}</p>}
      </div>
      <PrimaryButton onClick={() => void accept()}>{t("app.join.cta")}</PrimaryButton>
    </div>
  </Shell>;
}
