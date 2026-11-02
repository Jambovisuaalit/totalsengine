import { useParams } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SEOHead } from "@/components/SEOHead";
import { DailySlateHub } from "@/components/pregame/DailySlateHub";
import { useDailySlateData } from "@/hooks/useDailySlateData";
import { getTodayDate } from "@/lib/pregame-data";
import { isValidSport, isValidDateFormat, SPORT_DISPLAY_NAMES, Sport } from "@/types/pregame";
import { Skeleton } from "@/components/ui/skeleton";
import NotFound from "./NotFound";

const PregameDailySlate = () => {
  const { sport, date } = useParams<{ sport: string; date: string }>();

  // Validate sport
  if (!sport || !isValidSport(sport)) {
    return <NotFound />;
  }

  // Validate date format
  const resolvedDate = date || getTodayDate();
  if (!isValidDateFormat(resolvedDate)) {
    return <NotFound />;
  }

  const { data, isLoading, error } = useDailySlateData(sport as Sport, resolvedDate);
  const sportName = SPORT_DISPLAY_NAMES[sport as Sport];

  if (error) {
    console.error("Error loading daily slate:", error);
  }

  return (
    <>
      <SEOHead
        title={`${sportName} Pre-Game Slate — ${resolvedDate} | Doctore`}
        description={`Today's ${sportName.toLowerCase()} matchups with edge detection, line movements, and injury updates. Pre-game analysis for ${resolvedDate}.`}
        canonical={`/blog/pregame/${sport}/${resolvedDate}`}
      />
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <main className="flex-1 container py-8 md:py-12 max-w-4xl">
          {isLoading ? (
            <div className="space-y-8">
              <div>
                <Skeleton className="h-10 w-3/4 mb-2" />
                <Skeleton className="h-5 w-1/2" />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-40" />
                ))}
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-28" />
                ))}
              </div>
            </div>
          ) : data ? (
            <DailySlateHub data={data} />
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No data available for this date.</p>
            </div>
          )}
        </main>
        <SiteFooter />
      </div>
    </>
  );
};

export default PregameDailySlate;