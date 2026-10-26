import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const DashboardHeader = () => {
  const { signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border/40">
      <div className="container py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
            DoctoreAI <span className="font-normal text-muted-foreground">— Active Plays</span>
          </h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] sm:text-xs gap-1.5 border-border/60 text-muted-foreground">
              <Activity className="w-3 h-3" />
              Live
            </Badge>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={signOut} aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};