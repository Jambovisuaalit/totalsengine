import { useActionablePlays } from "@/hooks/useActionablePlays";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Target, Clock } from "lucide-react";

export const ActionablePlays = () => {
  const { data: plays, isLoading, error } = useActionablePlays();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Target className="w-4 h-4 text-muted-foreground" />
            Actionable Plays
          </CardTitle>
          <CardDescription>Confirmed edges meeting stability criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Target className="w-4 h-4 text-muted-foreground" />
            Actionable Plays
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Failed to load actionable plays</p>
        </CardContent>
      </Card>
    );
  }

  if (!plays || plays.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Target className="w-4 h-4 text-muted-foreground" />
            Actionable Plays
          </CardTitle>
          <CardDescription>Confirmed edges meeting stability criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 text-muted-foreground">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-4 opacity-30" />
            <p className="text-sm">No actionable edges at this time</p>
            <p className="text-xs mt-2 opacity-70">Edges require ≥3 confirmations over 30+ minutes</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatSpan = (minutes: number | null) => {
    if (!minutes) return "";
    if (minutes < 60) return `${Math.round(minutes)}m`;
    return `${Math.round(minutes / 60 * 10) / 10}h`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <Target className="w-4 h-4 text-muted-foreground" />
          Actionable Plays
          <Badge variant="secondary" className="ml-auto text-xs font-normal">
            {plays.length} {plays.length === 1 ? "play" : "plays"}
          </Badge>
        </CardTitle>
        <CardDescription>Confirmed edges meeting stability criteria</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {plays.map((play) => {
            const stakePercent = (play.stake_fraction || 0) * 100;
            
            return (
              <div
                key={play.id}
                className="p-3 sm:p-4 rounded border border-border/60 bg-card transition-all duration-200 hover:border-border hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3 sm:gap-4">
                  <div className="space-y-1.5 sm:space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-xs sm:text-sm text-foreground truncate">
                        {play.game.away_team} @ {play.game.home_team}
                      </span>
                      <Badge variant="outline" className="text-[10px] sm:text-xs font-normal text-muted-foreground">
                        {play.game.league}
                      </Badge>
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground truncate">
                      {play.market} · {play.selection} · {play.bookmaker}
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4 mt-2 sm:mt-3">
                      <div className="text-[10px] sm:text-xs text-muted-foreground">
                        <span className="font-mono text-foreground">{Number(play.execution_odds).toFixed(2)}</span>
                      </div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground">
                        <span>Fair </span>
                        <span className="font-mono text-foreground">{Number(play.fair_odds).toFixed(2)}</span>
                      </div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground">
                        <span className="font-mono text-foreground">+{Number(play.edge_percent).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-1 sm:space-y-2 flex-shrink-0">
                    <div className="text-base sm:text-lg font-mono font-semibold text-foreground">
                      {stakePercent.toFixed(2)}%
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">of bankroll</div>
                    <div className="flex items-center justify-end gap-1 text-[10px] sm:text-xs text-muted-foreground/70 mt-1 sm:mt-2">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{play.snapshot_count}x</span>
                      <Clock className="w-3 h-3 ml-1" />
                      <span>{formatSpan(play.confirm_span_minutes)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};