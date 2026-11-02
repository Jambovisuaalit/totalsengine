import type { ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
export function ProductFrame({children}: {children: ReactNode}) {
 return <div className="min-h-screen flex flex-col bg-background text-foreground"><SiteHeader/><main className="flex-1">{children}</main><SiteFooter/></div>;
}
export function EvidenceNotice() {
 return <div role="status" className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-muted-foreground">
  <strong className="text-foreground">Research status: NOT VERIFIED.</strong> This prototype has no authenticated, independently evidenced pre-game forecasts or licensed, timestamped bookmaker odds. No betting recommendation is available.
 </div>;
}
