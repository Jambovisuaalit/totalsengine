import { useParams, Link } from "react-router-dom";
import { useEdgePublicById } from "@/hooks/useEdgesPublic";
import { AnalysisArticle } from "@/components/analysis/AnalysisArticle";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function AnalysisDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: edge, isLoading, error } = useEdgePublicById(id || "");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <main className="flex-1 container max-w-7xl mx-auto px-4 py-8 sm:py-12">
        {/* Back Navigation */}
        <nav className="mb-8">
          <Button asChild variant="ghost" size="sm">
            <Link to="/analysis" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to all analyses
            </Link>
          </Button>
        </nav>

        {/* Content */}
        {isLoading ? (
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-[200px] w-full rounded-lg" />
            <Skeleton className="h-[150px] w-full rounded-lg" />
            <Skeleton className="h-[150px] w-full rounded-lg" />
          </div>
        ) : error || !edge ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h1 className="text-2xl font-semibold mb-2">Analysis not found</h1>
            <p className="text-muted-foreground mb-6 max-w-md">
              This analysis may have expired or been removed. Market signals are 
              time-sensitive and are removed after the event starts.
            </p>
            <Button asChild>
              <Link to="/analysis">View all analyses</Link>
            </Button>
          </div>
        ) : (
          <AnalysisArticle edge={edge} />
        )}
      </main>

      <SiteFooter />
    </div>
  );
}