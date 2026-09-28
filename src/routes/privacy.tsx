import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, legalHead } from "@/components/landing/LegalPage";
import i18n from "@/i18n";

export const Route = createFileRoute("/privacy")({
  head: () => legalHead("privacy", (k) => i18n.t(k)),
  component: () => <LegalPage page="privacy" />,
});
