import { createFileRoute, redirect } from "@tanstack/react-router";
import { PRODUCT_NAME } from "@/config/product";
import i18n from "@/i18n";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: PRODUCT_NAME },
    { name: "description", content: i18n.t("brandLine") },
    { property: "og:title", content: PRODUCT_NAME },
    { property: "og:description", content: i18n.t("brandLine") },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  beforeLoad: () => { throw redirect({ to: "/styleguide" }); },
});
