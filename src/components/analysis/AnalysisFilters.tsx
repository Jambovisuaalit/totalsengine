import { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { EdgePublic, EdgeFilters } from "@/hooks/useEdgesPublic";
import { getLeagueDisplayName, getSportFromLeague } from "@/lib/analysis-helpers";

interface AnalysisFiltersProps {
  edges: EdgePublic[];
  filters: EdgeFilters;
  onFiltersChange: (filters: EdgeFilters) => void;
}

export function AnalysisFilters({ edges, filters, onFiltersChange }: AnalysisFiltersProps) {
  // Extract unique values for filter options
  const filterOptions = useMemo(() => {
    const sports = new Set<string>();
    const leagues = new Set<string>();
    const markets = new Set<string>();

    edges.forEach((edge) => {
      sports.add(getSportFromLeague(edge.league));
      leagues.add(edge.league);
      markets.add(edge.market);
    });

    return {
      sports: Array.from(sports).sort(),
      leagues: Array.from(leagues).sort(),
      markets: Array.from(markets).sort(),
    };
  }, [edges]);

  const handleFilterChange = (key: keyof EdgeFilters, value: string | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value === "all" ? undefined : value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sport Filter */}
        <div className="space-y-2">
          <Label htmlFor="sport-filter">Sport</Label>
          <Select
            value={filters.sport || "all"}
            onValueChange={(value) => handleFilterChange("sport", value)}
          >
            <SelectTrigger id="sport-filter">
              <SelectValue placeholder="All sports" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sports</SelectItem>
              {filterOptions.sports.map((sport) => (
                <SelectItem key={sport} value={sport}>
                  {sport}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* League Filter */}
        <div className="space-y-2">
          <Label htmlFor="league-filter">League</Label>
          <Select
            value={filters.league || "all"}
            onValueChange={(value) => handleFilterChange("league", value)}
          >
            <SelectTrigger id="league-filter">
              <SelectValue placeholder="All leagues" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All leagues</SelectItem>
              {filterOptions.leagues.map((league) => (
                <SelectItem key={league} value={league}>
                  {getLeagueDisplayName(league)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Market Filter */}
        <div className="space-y-2">
          <Label htmlFor="market-filter">Market</Label>
          <Select
            value={filters.market || "all"}
            onValueChange={(value) => handleFilterChange("market", value)}
          >
            <SelectTrigger id="market-filter">
              <SelectValue placeholder="All markets" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All markets</SelectItem>
              {filterOptions.markets.map((market) => (
                <SelectItem key={market} value={market}>
                  {market}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Filter */}
        <div className="space-y-2">
          <Label htmlFor="date-filter">Date</Label>
          <Input
            id="date-filter"
            type="date"
            value={filters.date || ""}
            onChange={(e) => handleFilterChange("date", e.target.value || undefined)}
          />
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}