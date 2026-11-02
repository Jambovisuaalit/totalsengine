import { useSourcePerformance, useBlacklistedSources, useAddToBlacklist } from "@/hooks/useSourcePerformance";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, Ban, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const SourcePerformance = () => {
  const { data: sources, isLoading, error } = useSourcePerformance();
  const { data: blacklist } = useBlacklistedSources();
  const addToBlacklist = useAddToBlacklist();

  const isBlacklisted = (bookmaker: string, market: string) => {
    return blacklist?.some(
      (b) => b.bookmaker === bookmaker && (b.market === market || b.market === null)
    );
  };

  const handleBlacklist = (bookmaker: string, market: string) => {
    addToBlacklist.mutate(
      { bookmaker, market, reason: "Negative CLV performance" },
      {
        onSuccess: () => {
          toast.success(`${bookmaker} / ${market} added to blacklist`);
        },
        onError: () => {
          toast.error("Failed to add to blacklist");
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Source Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Source Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Failed to load source performance</p>
        </CardContent>
      </Card>
    );
  }

  if (!sources || sources.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Source Performance
          </CardTitle>
          <CardDescription>CLV analysis by bookmaker and market</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No CLV data available yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <BarChart3 className="w-4 h-4 text-muted-foreground" />
          Source Performance
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">CLV analysis by bookmaker and market</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Mobile: Cards */}
        <div className="md:hidden space-y-3">
          {sources.map((source, index) => {
            const blacklisted = isBlacklisted(source.bookmaker, source.market);
            const isGood = source.avg_clv > 0;
            const isBad = source.avg_clv <= -1;

            return (
              <div key={index} className={cn("p-3 rounded border border-border/60 bg-card", blacklisted && "opacity-50")}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium text-sm">{source.bookmaker}</div>
                    <div className="text-xs text-muted-foreground">{source.market}</div>
                  </div>
                  {blacklisted ? (
                    <Badge variant="destructive" className="gap-1 text-xs">
                      <Ban className="w-3 h-3" />
                      Blocked
                    </Badge>
                  ) : isGood ? (
                     <Badge variant="outline" className="gap-1 text-xs bg-accent text-accent-foreground">
                       Good
                     </Badge>
                   ) : isBad ? (
                     <Badge variant="outline" className="gap-1 text-xs bg-destructive/10 text-destructive">
                       Poor
                     </Badge>
                   ) : (
                     <Badge variant="outline" className="gap-1 text-xs bg-muted text-muted-foreground">
                       Review
                     </Badge>
                  )}
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{source.total_edges} edges</span>
                  <span className={cn("font-mono", isGood && "status-positive", isBad && "status-negative")}>
                    CLV: {source.avg_clv > 0 ? "+" : ""}{source.avg_clv}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop: Table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bookmaker</TableHead>
                <TableHead>Market</TableHead>
                <TableHead className="text-right">Edges</TableHead>
                <TableHead className="text-right">CLV Avg</TableHead>
                <TableHead className="text-right">Hit Rate</TableHead>
                <TableHead className="text-right">Status</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sources.map((source, index) => {
                const blacklisted = isBlacklisted(source.bookmaker, source.market);
                const isGood = source.avg_clv > 0;
                const isWarning = source.avg_clv <= 0 && source.avg_clv > -1;
                const isBad = source.avg_clv <= -1;

                return (
                  <TableRow key={index} className={cn(blacklisted && "opacity-50")}>
                    <TableCell className="font-medium">{source.bookmaker}</TableCell>
                    <TableCell>{source.market}</TableCell>
                    <TableCell className="text-right">{source.total_edges}</TableCell>
                    <TableCell className={cn(
                      "text-right font-mono",
                      isGood && "status-positive",
                      isBad && "status-negative"
                    )}>
                      {source.avg_clv > 0 ? "+" : ""}{source.avg_clv}%
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {source.hit_rate}%
                    </TableCell>
                    <TableCell className="text-right">
                      {blacklisted ? (
                        <Badge variant="destructive" className="gap-1">
                          <Ban className="w-3 h-3" />
                          Blocked
                        </Badge>
                      ) : isGood ? (
                        <Badge variant="outline" className="gap-1 bg-accent text-accent-foreground">
                          <CheckCircle className="w-3 h-3" />
                          Good
                        </Badge>
                      ) : isWarning ? (
                        <Badge variant="outline" className="gap-1 bg-muted text-muted-foreground">
                          <AlertTriangle className="w-3 h-3" />
                          Review
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 bg-destructive/10 text-destructive">
                          <AlertTriangle className="w-3 h-3" />
                          Poor
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {!blacklisted && isBad && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleBlacklist(source.bookmaker, source.market)}
                          disabled={addToBlacklist.isPending}
                        >
                          <Ban className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};