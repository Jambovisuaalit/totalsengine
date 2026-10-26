import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, CheckCircle, Clock, Info, TrendingDown, TrendingUp } from "lucide-react";
import { EdgePublic } from "@/hooks/useEdgesPublic";
import { useOGImage } from "@/hooks/useOGImage";
import {
  formatOdds,
  formatProbability,
  formatEdge,
  formatConfidence,
  formatMatchDate,
  formatISODate,
  formatTimeToStart,
  getLeagueDisplayName,
  getEdgeBadgeVariant,
} from "@/lib/analysis-helpers";

interface AnalysisArticleProps {
  edge: EdgePublic;
}

export function AnalysisArticle({ edge }: AnalysisArticleProps) {
  const title = `${edge.away_team} vs ${edge.home_team} — Market Analysis (${getLeagueDisplayName(edge.league)})`;
  const description = `Informational analysis of a pricing discrepancy in the ${edge.market} market. No recommendations. Educational use only.`;
  const canonicalUrl = `https://doctore.lovable.app/analysis/${edge.id}`;
  const hoursToStart = edge.meta?.hours_to_start ?? 0;

  // Dynamic OG image generation
  const { imageUrl: ogImageUrl } = useOGImage({
    edgeId: edge.id!,
    homeTeam: edge.home_team!,
    awayTeam: edge.away_team!,
    league: edge.league!,
    market: edge.market!,
    edge: edge.edge!,
  });

  // Generate risk notes based on meta flags
  const riskNotes = [];
  if (hoursToStart < 1) {
    riskNotes.push({
      type: "warning",
      text: "Match starting soon - odds may move rapidly",
    });
  }
  if (edge.edge_trend && edge.edge_trend < 0) {
    riskNotes.push({
      type: "warning",
      text: "Edge trending downward in recent observations",
    });
  }
  if (edge.confidence < 3) {
    riskNotes.push({
      type: "info",
      text: "Limited confirmation snapshots - signal may be less reliable",
    });
  }
  if (hoursToStart > 48) {
    riskNotes.push({
      type: "info",
      text: "Distant start time - lineup changes and news may affect analysis",
    });
  }

  // Generate invalidation triggers
  const invalidationTriggers = [
    `Odds move to ${formatOdds(edge.fair_odds)} or lower (edge eliminated)`,
    "Official lineup announcements with key absences",
    "Weather or venue changes affecting match conditions",
    `Less than 30 minutes to start without refreshed data`,
  ];

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: description,
    datePublished: formatISODate(edge.first_seen_at),
    dateModified: formatISODate(edge.updated_at),
    author: {
      "@type": "Organization",
      name: "Doctore",
    },
    publisher: {
      "@type": "Organization",
      name: "Doctore",
      url: "https://doctore.lovable.app",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
  };

  return (
    <>
      <Helmet>
        <title>{title} | Doctore</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Open Graph */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:site_name" content="Doctore" />
        
        {/* Twitter/X */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImageUrl} />
        
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
      </Helmet>

      <article className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <header className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{getLeagueDisplayName(edge.league)}</Badge>
            <span>·</span>
            <time dateTime={edge.start_time}>{formatMatchDate(edge.start_time)}</time>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTimeToStart(hoursToStart)} to start
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
            {title}
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed">
            This analysis examines a pricing discrepancy identified in the {edge.market} market 
            for the upcoming {edge.away_team} @ {edge.home_team} matchup. The content is 
            informational and does not constitute advice.
          </p>
        </header>

        <Separator />

        {/* Metrics Snapshot Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Analysis Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Market</TableCell>
                  <TableCell className="text-right">{edge.market}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Selection</TableCell>
                  <TableCell className="text-right">{edge.selection}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Offered Odds</TableCell>
                  <TableCell className="text-right font-mono">{formatOdds(edge.book_odds)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Fair Odds (Model)</TableCell>
                  <TableCell className="text-right font-mono text-primary">{formatOdds(edge.fair_odds)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Model Probability</TableCell>
                  <TableCell className="text-right">{formatProbability(edge.model_prob)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Edge</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={getEdgeBadgeVariant(edge.edge)}>{formatEdge(edge.edge)}</Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Confidence</TableCell>
                  <TableCell className="text-right">
                    {formatConfidence(edge.confidence)} ({edge.confidence} snapshots)
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Source</TableCell>
                  <TableCell className="text-right">{edge.bookmaker}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Why Flagged Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Why This Was Flagged
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {(edge.reasons || []).map((reason, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                  <span className="text-muted-foreground">{reason}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Risk Notes Section */}
        {riskNotes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Risk Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {riskNotes.map((note, index) => (
                  <li key={index} className="flex items-start gap-3">
                    {note.type === "warning" ? (
                      <TrendingDown className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                    ) : (
                      <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                    )}
                    <span className="text-muted-foreground">{note.text}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Invalidation Triggers Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Invalidation Triggers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              This analysis should be considered invalidated if any of the following occur:
            </p>
            <ul className="space-y-2">
              {invalidationTriggers.map((trigger, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-orange-500 shrink-0">•</span>
                  <span className="text-muted-foreground">{trigger}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Model Info Block */}
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted-foreground">
              <div>
                <span className="font-medium text-foreground">First observed:</span>{" "}
                {formatMatchDate(edge.first_seen_at)}
              </div>
              <div>
                <span className="font-medium text-foreground">Last updated:</span>{" "}
                {formatMatchDate(edge.updated_at)}
              </div>
              <div>
                <span className="font-medium text-foreground">Confirmation span:</span>{" "}
                {edge.confirm_span_minutes ? `${Math.round(edge.confirm_span_minutes)} min` : "N/A"}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Disclaimer Footer */}
        <footer className="p-6 rounded-lg bg-muted/50 border border-border space-y-4">
          <h2 className="text-lg font-semibold">Disclaimer</h2>
          <div className="text-sm text-muted-foreground space-y-3">
            <p>
              This analysis is provided for informational and educational purposes only. 
              It does not constitute advice or a recommendation to engage in any activity.
            </p>
            <p>
              Market signals and pricing discrepancies are observations only. Past patterns 
              do not guarantee future outcomes. All decisions are the sole responsibility 
              of the reader.
            </p>
            <p>
              The authors and publishers of this content are not responsible for any 
              decisions made based on this information.
            </p>
          </div>
          <p className="text-sm italic text-center pt-4 border-t border-border">
            This analysis is informational only and does not constitute advice.
          </p>
        </footer>
      </article>
    </>
  );
}