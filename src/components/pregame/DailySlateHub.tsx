import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Clock,
} from "lucide-react";
import { DailySlateData, SPORT_DISPLAY_NAMES } from "@/types/pregame";
import { buildAffiliateUrl, DEFAULT_PARTNER } from "@/config/affiliates";
import { format, parseISO } from "date-fns";

interface DailySlateHubProps {
  data: DailySlateData;
}

export const DailySlateHub = ({ data }: DailySlateHubProps) => {
  const { sport, date, displayDate, topEdges, biggestLineMoves, availability, matches } = data;
  const sportName = SPORT_DISPLAY_NAMES[sport];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          {sportName} Pre-Game Slate — {displayDate}
        </h1>
        <p className="text-muted-foreground">
          Today's {sportName.toLowerCase()} matchups with edge detection analysis and market movements.
        </p>
      </div>

      {/* Top 3 Edges Today */}
      {topEdges.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Top 3 Edges Today
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {topEdges.map((edge) => (
              <Card key={edge.id} className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="default" className="text-xs">
                      +{edge.edge.toFixed(1)}% edge
                    </Badge>
                    <span className="text-xs text-muted-foreground">{edge.market}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="font-medium mb-1">{edge.selection}</p>
                  <div className="text-xs text-muted-foreground mb-3">
                    <span>Book: {edge.bookOdds.toFixed(2)}</span>
                    <span className="mx-2">•</span>
                    <span>Fair: {edge.fairOdds.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground/80 leading-relaxed">
                    {edge.whyItMatters}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Biggest Line Moves */}
      {biggestLineMoves.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-status-warning" />
            Biggest Line Moves
          </h2>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Match</TableHead>
                  <TableHead>Market</TableHead>
                  <TableHead className="text-right">Open</TableHead>
                  <TableHead className="text-right">Current</TableHead>
                  <TableHead className="text-right">Move</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {biggestLineMoves.map((move) => (
                  <TableRow key={move.matchSlug}>
                    <TableCell className="font-medium">
                      {move.awayTeam} @ {move.homeTeam}
                    </TableCell>
                    <TableCell>{move.market}</TableCell>
                    <TableCell className="text-right">{move.openLine}</TableCell>
                    <TableCell className="text-right">{move.currentLine}</TableCell>
                    <TableCell className="text-right">
                      <span className={move.movementPercent > 0 ? "text-status-positive" : "text-status-negative"}>
                        {move.movementPercent > 0 ? "+" : ""}
                        {move.movementPercent.toFixed(1)}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </section>
      )}

      {/* Injury / Availability Watchlist */}
      {availability.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-status-warning" />
            Injury / Availability Watchlist
          </h2>
          <div className="flex flex-wrap gap-3">
            {availability.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg border border-border/50"
              >
                <Badge
                  variant={
                    item.status === "OUT"
                      ? "destructive"
                      : item.status === "QUESTIONABLE"
                      ? "secondary"
                      : "outline"
                  }
                  className="text-xs"
                >
                  {item.status}
                </Badge>
                <span className="text-sm font-medium">{item.player}</span>
                <span className="text-xs text-muted-foreground">({item.team})</span>
                {item.reason && (
                  <span className="text-xs text-muted-foreground/60">— {item.reason}</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* All Matchups */}
      <section>
        <h2 className="text-lg font-semibold mb-4">All Matchups</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {matches.map((match) => (
            <Link
              key={match.id}
              to={`/blog/pregame/${sport}/${match.league}/${match.matchSlug}/${date}`}
            >
              <Card className="h-full hover:border-primary/40 transition-colors group">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-xs uppercase">
                      {match.league}
                    </Badge>
                    {match.hasEdges && match.topEdge && (
                      <Badge variant="default" className="text-xs">
                        +{match.topEdge.toFixed(1)}%
                      </Badge>
                    )}
                  </div>
                  <p className="font-medium mb-1">
                    {match.awayTeam} @ {match.homeTeam}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {format(parseISO(match.startTime), "h:mm a")}
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
                    View analysis
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust Links */}
      <section className="py-6 border-t border-border/40">
        <div className="flex flex-wrap gap-4 text-sm">
          <Link to="/methodology" className="text-muted-foreground hover:text-foreground transition-colors">
            Methodology
          </Link>
          <Link to="/clv" className="text-muted-foreground hover:text-foreground transition-colors">
            CLV Explained
          </Link>
          <Link to="/responsible-gaming" className="text-muted-foreground hover:text-foreground transition-colors">
            Responsible Gaming
          </Link>
          <Link to="/affiliate-disclosure" className="text-muted-foreground hover:text-foreground transition-colors">
            Affiliate Disclosure
          </Link>
        </div>
      </section>

      {/* Affiliate CTA */}
      <section className="py-6 px-6 bg-muted/30 rounded-lg border border-border/50">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-medium mb-1">Ready to place a wager?</p>
            <p className="text-sm text-muted-foreground">
              Compare odds across top sportsbooks.
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild>
              <a
                href={buildAffiliateUrl(DEFAULT_PARTNER, {
                  src: "slate-cta",
                  sport,
                  date,
                  placement: "primary",
                })}
              >
                Get Best Odds
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a
                href={buildAffiliateUrl("cloudbet", {
                  src: "slate-cta",
                  sport,
                  date,
                  placement: "secondary",
                })}
              >
                Compare Odds
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Disclosure */}
      <p className="text-xs text-muted-foreground/60 text-center">
        Affiliate links may earn commission.{" "}
        <Link to="/affiliate-disclosure" className="underline hover:text-muted-foreground">
          Learn more
        </Link>
        . 18+ only. Gamble responsibly.
      </p>
    </div>
  );
};