import { useParams } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SEOHead } from "@/components/SEOHead";
import { MatchPage } from "@/components/pregame/MatchPage";
import { useMatchPageData } from "@/hooks/useMatchPageData";
import { getTodayDate } from "@/lib/pregame-data";
import { isValidSport, isValidDateFormat, Sport } from "@/types/pregame";
import { Skeleton } from "@/components/ui/skeleton";
import NotFound from "./NotFound";
import { format, parseISO } from "date-fns";

const PregameMatchPage = () => {
  const { sport, league, match, date } = useParams<{
    sport: string;
    league: string;
    match: string;
    date: string;
  }>();

  // Validate required params
  if (!sport || !isValidSport(sport) || !league || !match) {
    return <NotFound />;
  }

  // Validate date format
  const resolvedDate = date || getTodayDate();
  if (!isValidDateFormat(resolvedDate)) {
    return <NotFound />;
  }

  const { data, isLoading, error } = useMatchPageData(
    sport as Sport,
    league,
    match,
    resolvedDate
  );

  if (error) {
    console.error("Error loading match page:", error);
  }

  // Build display date for SEO
  let displayDate = resolvedDate;
  try {
    displayDate = format(parseISO(resolvedDate), "MMMM d, yyyy");
  } catch {
    // Use raw date if parsing fails
  }

  // Parse team names from slug for SEO fallback
  const parseTeamNames = (slug: string) => {
    const parts = slug.split("-vs-");
    if (parts.length !== 2) return { home: "Home Team", away: "Away Team" };
    const formatName = (s: string) =>
      s
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    return { home: formatName(parts[0]), away: formatName(parts[1]) };
  };

  const { home: homeTeam, away: awayTeam } = data
    ? { home: data.homeTeam, away: data.awayTeam }
    : parseTeamNames(match);

  return (
    <>
      <SEOHead
        title={`${homeTeam} vs ${awayTeam} Pre-Game Analysis (${displayDate}) | Doctore`}
        description={`Pre-game analysis for ${awayTeam} at ${homeTeam}. Edge detection, market snapshot, availability updates, and betting insights for ${displayDate}.`}
        canonical={`/blog/pregame/${sport}/${league}/${match}/${resolvedDate}`}
      />
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <main className="flex-1 container py-8 md:py-12 max-w-4xl">
          {isLoading ? (
            <div className="space-y-6">
              <div>
                <Skeleton className="h-6 w-32 mb-4" />
                <Skeleton className="h-10 w-3/4 mb-2" />
                <Skeleton className="h-5 w-1/2" />
              </div>
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
              <div className="grid gap-4 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-40" />
                ))}
              </div>
            </div>
          ) : data ? (
            <MatchPage data={data} />
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Match data not available.</p>
            </div>
          )}
        </main>
        <SiteFooter />
      </div>
    </>
  );
};

export default PregameMatchPage;