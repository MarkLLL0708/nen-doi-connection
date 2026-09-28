import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Phone-width column on desktop, full screen on phones. */
export function Shell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className="min-h-screen bg-page">
    <div className={cn("relative mx-auto flex min-h-screen max-w-[390px] flex-col overflow-x-clip bg-background text-foreground", className)}>{children}</div>
  </div>;
}
