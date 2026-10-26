import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useEdgesPublic, EdgeFilters } from "@/hooks/useEdgesPublic";
import { AnalysisCard } from "@/components/analysis/AnalysisCard";
import { AnalysisFilters } from "@/components/analysis/AnalysisFilters";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, BookOpen } from "lucide-react";
export default function AnalysisIndex() {
  const [filters, setFilters] = useState<EdgeFilters>({});
  const { data: edges = [], isLoading, error } = useEdgesPublic();

  // Apply client-side filtering for sport (since it's derived from league)
  const filteredEdges = edges.filter((edge) => {
    if (filters.league && edge.league !== filters.league) return false;
    if (filters.market && edge.market !== filters.market) return false;
    // Date filtering is done server-side
    return true;
  });

  return (
    <>
      <Helmet>
        <title>Market Analysis | Doctore</title>
        <meta
          name="description"
          content="Educational market analysis highlighting pricing discrepancies and model-derived fair values. Informational only."
        />
        <link rel="canonical" href="https://doctore.lovable.app/analysis" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Market Analysis | Doctore" />
        <meta property="og:description" content="Educational market analysis highlighting pricing discrepancies and model-derived fair values." />
        <meta property="og:url" content="https://doctore.lovable.app/analysis" />
        <meta property="og:image" content="https://doctore.lovable.app/og/analysis.png" />
        <meta property="og:site_name" content="Doctore" />
        
        {/* Twitter/X */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Market Analysis | Doctore" />
        <meta name="twitter:description" content="Educational market analysis. Informational only." />
        <meta name="twitter:image" content="https://doctore.lovable.app/og/analysis.png" />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />

        <main className="flex-1 container max-w-7xl mx-auto px-4 py-8 sm:py-12">
          {/* Page Header */}
          <div className="space-y-4 mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Market Analysis
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Explore current market signals where offered odds differ from model-derived 
              fair values. Each analysis provides educational context on pricing discrepancies.
            </p>
            <Link 
              to="/methodology" 
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <BookOpen className="h-4 w-4" />
              Learn how we identify edges →
            </Link>
          </div>

          {/* Filters */}
          <div className="mb-8">
            <AnalysisFilters
              edges={edges}
              filters={filters}
              onFiltersChange={setFilters}
            />
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-[300px] w-full rounded-lg" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h2 className="text-xl font-semibold mb-2">Unable to load analyses</h2>
              <p className="text-muted-foreground">
                Please try again later or contact support if the issue persists.
              </p>
            </div>
          ) : filteredEdges.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No analyses available</h2>
              <p className="text-muted-foreground max-w-md">
                {Object.values(filters).some(Boolean)
                  ? "No market signals match your current filters. Try adjusting or clearing filters."
                  : "There are currently no actionable market signals. Check back later for new analyses."}
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-6">
                Showing {filteredEdges.length} {filteredEdges.length === 1 ? "analysis" : "analyses"}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEdges.map((edge) => (
                  <AnalysisCard key={edge.id} edge={edge} />
                ))}
              </div>
            </>
          )}
        </main>

        <SiteFooter />
      </div>
    </>
  );
}