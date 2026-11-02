import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, TrendingUp } from "lucide-react";
import { EdgePublic } from "@/hooks/useEdgesPublic";
import {
  formatOdds,
  formatProbability,
  formatEdge,
  formatConfidence,
  formatMatchDate,
  getLeagueDisplayName,
  getEdgeBadgeVariant,
} from "@/lib/analysis-helpers";

interface AnalysisCardProps {
  edge: EdgePublic;
}

export function AnalysisCard({ edge }: AnalysisCardProps) {
  const hoursToStart = edge.meta?.hours_to_start ?? 0;
  
  return (
    <Card className="group hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {getLeagueDisplayName(edge.league)}
            </p>
            <h3 className="font-semibold text-lg leading-tight">
              {edge.away_team} @ {edge.home_team}
            </h3>
          </div>
          <Badge variant={getEdgeBadgeVariant(edge.edge)}>
            {formatEdge(edge.edge)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Time & Market */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{formatMatchDate(edge.start_time)}</span>
          </div>
        </div>

        {/* Market & Selection */}
        <div className="p-3 rounded-md bg-muted/50 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Market</span>
            <span className="font-medium">{edge.market}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Selection</span>
            <span className="font-medium">{edge.selection}</span>
          </div>
        </div>

        {/* Odds Comparison */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-md bg-muted/30 text-center">
            <p className="text-xs text-muted-foreground mb-1">Offered Odds</p>
            <p className="text-lg font-bold">{formatOdds(edge.book_odds)}</p>
          </div>
          <div className="p-3 rounded-md bg-primary/10 text-center">
            <p className="text-xs text-muted-foreground mb-1">Fair Odds</p>
            <p className="text-lg font-bold text-primary">{formatOdds(edge.fair_odds)}</p>
          </div>
        </div>

        {/* Model Probability & Confidence */}
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Model probability:</span>
            <span className="font-medium">{formatProbability(edge.model_prob)}</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {formatConfidence(edge.confidence)} confidence
          </Badge>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <Button asChild variant="ghost" className="w-full group-hover:bg-primary/5">
          <Link to={`/analysis/${edge.id}`} className="flex items-center justify-center gap-2">
            Open Analysis
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}