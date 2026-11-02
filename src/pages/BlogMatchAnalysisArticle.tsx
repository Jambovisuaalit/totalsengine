import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MatchAnalysisArticleTemplate } from "@/components/MatchAnalysisArticleTemplate";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const BlogMatchAnalysisArticle = () => {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="container py-8 sm:py-12 max-w-3xl">
        <Link
          to="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>

        <MatchAnalysisArticleTemplate
          teamA="Boston Bruins"
          teamB="Toronto Maple Leafs"
          league="NHL"
          market="Moneyline"
          bookOdds="-115"
          fairOdds="-122"
          edgePercent={2.1}
          snapshotCount={8}
          spanHours={4}
          bookmaker="DraftKings"
          publishDate="2026-01-07"
        />
      </main>

      <SiteFooter />
    </div>
  );
};

export default BlogMatchAnalysisArticle;