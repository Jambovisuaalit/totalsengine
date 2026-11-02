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
  ArrowLeft,
  TrendingUp,
  AlertTriangle,
  ExternalLink,
  CheckCircle,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { MatchPageData, SPORT_DISPLAY_NAMES } from "@/types/pregame";
import { buildAffiliateUrl } from "@/config/affiliates";
import { format, parseISO } from "date-fns";

interface MatchPageProps {
  data: MatchPageData;
}

export const MatchPage = ({ data }: MatchPageProps) => {
  const {
    sport,
    league,
    matchSlug,
    date,
    homeTeam,
    awayTeam,
    startTime,
    summary,
    marketSnapshot,
    availability,
    edges,
    trueProbability,
    fairOdds,
    edgePercent,
    bestPrices,
    riskNotes,
  } = data;

  const sportName = SPORT_DISPLAY_NAMES[sport];
  const displayDate = format(parseISO(date), "MMMM d, yyyy");

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "OUT":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "PROBABLE":
        return <CheckCircle className="h-4 w-4 text-status-positive" />;
      default:
        return <HelpCircle className="h-4 w-4 text-status-warning" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Back Link */}
      <Link
        to={`/blog/pregame/${sport}/${date}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {sportName} slate
      </Link>

      {/* Header */}
      <div>
        <Badge variant="outline" className="mb-3 uppercase">
          {league}
        </Badge>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          {homeTeam} vs {awayTeam} Pre-Game Analysis
        </h1>
        <p className="text-muted-foreground">
          {displayDate} • {format(parseISO(startTime), "h:mm a")}
        </p>
      </div>

      {/* 30-Second Summary */}
      <Card className="bg-muted/30 border-border/50">
        <CardContent className="py-4">
          <p className="text-foreground leading-relaxed">{summary}</p>
        </CardContent>
      </Card>

      {/* Market Snapshot */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Market Snapshot</h2>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Market</TableHead>
                <TableHead className="text-right">Open</TableHead>
                <TableHead className="text-right">Current</TableHead>
                <TableHead className="text-right">Movement</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Moneyline</TableCell>
                <TableCell className="text-right">
                  {marketSnapshot.moneyline.open.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  {marketSnapshot.moneyline.current.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={
                      marketSnapshot.moneyline.current < marketSnapshot.moneyline.open
                        ? "text-status-positive"
                        : "text-muted-foreground"
                    }
                  >
                    {(
                      ((marketSnapshot.moneyline.current - marketSnapshot.moneyline.open) /
                        marketSnapshot.moneyline.open) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </TableCell>
              </TableRow>
              {marketSnapshot.spread && (
                <TableRow>
                  <TableCell className="font-medium">Spread</TableCell>
                  <TableCell className="text-right">{marketSnapshot.spread.open}</TableCell>
                  <TableCell className="text-right">{marketSnapshot.spread.current}</TableCell>
                  <TableCell className="text-right text-muted-foreground">—</TableCell>
                </TableRow>
              )}
              {marketSnapshot.total && (
                <TableRow>
                  <TableCell className="font-medium">Total</TableCell>
                  <TableCell className="text-right">{marketSnapshot.total.open}</TableCell>
                  <TableCell className="text-right">{marketSnapshot.total.current}</TableCell>
                <TableCell className="text-right">
                    <span
                      className={
                        marketSnapshot.total.current > marketSnapshot.total.open
                          ? "text-status-positive"
                          : "text-status-negative"
                      }
                    >
                      {marketSnapshot.total.current > marketSnapshot.total.open ? "+" : ""}
                      {marketSnapshot.total.current - marketSnapshot.total.open}
                    </span>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </section>

      {/* Availability */}
      {availability.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-status-warning" />
            Availability
          </h2>
          <div className="space-y-2">
            {availability.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50"
              >
                {getStatusIcon(item.status)}
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
                <span className="font-medium">{item.player}</span>
                <span className="text-sm text-muted-foreground">({item.team})</span>
                {item.reason && (
                  <span className="text-sm text-muted-foreground/60">— {item.reason}</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Doctore Edges */}
      {edges.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Doctore Edge Detection
          </h2>
          <div className="space-y-4">
            {edges.map((edge) => (
              <Card key={edge.id} className="border-primary/20 bg-primary/5">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <Badge variant="default" className="mb-2">
                        +{edge.edge.toFixed(1)}% edge
                      </Badge>
                      <p className="font-medium">
                        {edge.market}: {edge.selection}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-muted-foreground">
                        Book: <span className="text-foreground">{edge.bookOdds.toFixed(2)}</span>
                      </p>
                      <p className="text-muted-foreground">
                        Fair: <span className="text-foreground">{edge.fairOdds.toFixed(2)}</span>
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    <strong>Why it matters:</strong> {edge.whyItMatters}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* True Probability Summary */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Model Output</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">True Probability</p>
              <p className="text-2xl font-bold text-primary">{trueProbability.toFixed(1)}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Fair Odds</p>
              <p className="text-2xl font-bold">{fairOdds.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Edge</p>
              <p className="text-2xl font-bold text-status-positive">+{edgePercent.toFixed(1)}%</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Best Price Table */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Best Prices Right Now</h2>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sportsbook</TableHead>
                <TableHead className="text-right">Odds</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bestPrices.map((price, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">
                    {price.bookmaker}
                    {price.isPrimary && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Best
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono">{price.odds.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant={price.isPrimary ? "default" : "outline"} asChild>
                      <a
                        href={buildAffiliateUrl(price.bookmaker.toLowerCase(), {
                          src: "match-page",
                          sport,
                          date,
                          match: matchSlug,
                          placement: price.isPrimary ? "primary-cta" : "secondary-cta",
                        })}
                      >
                        {price.isPrimary ? "Get Odds" : "View"}
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </section>

      {/* Risk Notes */}
      {riskNotes.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">Risk Notes</h2>
          <Card className="bg-status-warning/5 border-status-warning/20">
            <CardContent className="py-4">
              <p className="text-sm font-medium text-status-warning mb-3">
                What can break this edge:
              </p>
              <ul className="space-y-2">
                {riskNotes.map((note, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <AlertTriangle className="h-4 w-4 text-status-warning mt-0.5 flex-shrink-0" />
                    {note}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Trust Links */}
      <section className="py-6 border-t border-border/40">
        <div className="flex flex-wrap gap-4 text-sm">
          <Link
            to={`/blog/pregame/${sport}/${date}`}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to today's slate
          </Link>
          <Link to="/methodology" className="text-muted-foreground hover:text-foreground transition-colors">
            Read methodology
          </Link>
          <Link to="/clv" className="text-muted-foreground hover:text-foreground transition-colors">
            CLV explained
          </Link>
        </div>
      </section>

      {/* Disclosure */}
      <div className="py-6 px-6 bg-muted/30 rounded-lg border border-border/50">
        <p className="text-xs text-muted-foreground/80 mb-2">
          <strong>Disclosure:</strong> This analysis is for informational purposes only and does not
          constitute betting advice. Affiliate links may earn commission—this does not affect your
          odds or prices.
        </p>
        <div className="flex gap-4 text-xs">
          <Link to="/affiliate-disclosure" className="text-muted-foreground hover:text-foreground underline">
            Affiliate Disclosure
          </Link>
          <Link to="/responsible-gaming" className="text-muted-foreground hover:text-foreground underline">
            Responsible Gaming
          </Link>
        </div>
        <p className="text-xs text-muted-foreground/60 mt-2">18+ only. Gamble responsibly.</p>
      </div>
    </div>
  );
};