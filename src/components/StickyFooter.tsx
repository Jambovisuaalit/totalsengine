import { Activity } from "lucide-react";

interface StickyFooterProps {
  totalRisk: number;
  playCount: number;
}

export const StickyFooter = ({ totalRisk, playCount }: StickyFooterProps) => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t border-border/40">
      <div className="container py-2 sm:py-2.5 px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-3 h-3 text-muted-foreground" />
            <div>
              <p className="text-xs sm:text-sm font-mono text-foreground">
                {playCount} {playCount === 1 ? "play" : "plays"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs sm:text-sm font-mono text-foreground">
              <span className="text-muted-foreground text-[10px] mr-1.5">Exposure</span>
              {totalRisk.toFixed(1)}u
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};