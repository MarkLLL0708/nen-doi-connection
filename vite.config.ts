// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    // One copy of React, always: dedupe in resolution and pre-bundle React up front so a
    // mid-session dependency re-scan never loads a second copy.
    resolve: { dedupe: ["react", "react-dom", "@tanstack/react-router", "@tanstack/react-query"] },
    optimizeDeps: { include: ["react", "react-dom", "react-dom/client", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-router", "@tanstack/react-query", "lucide-react", "motion/react", "react-i18next", "i18next", "@radix-ui/react-dialog", "@tanstack/router-core", "@tanstack/router-core/isServer", "@tanstack/router-core/ssr/client", "seroval", "@supabase/supabase-js", "zod"] },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
