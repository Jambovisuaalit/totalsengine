import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SEOHead } from "@/components/SEOHead";
import { 
  Home, 
  LayoutDashboard, 
  Search, 
  BookOpen, 
  TrendingUp, 
  LineChart, 
  BarChart3,
  FileText,
  Scale,
  Shield,
  Calendar
} from "lucide-react";
import { format } from "date-fns";

const today = format(new Date(), "yyyy-MM-dd");

const sections = [
  {
    title: "Core",
    items: [
      { label: "Landing", to: "/", icon: Home },
      { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
      { label: "Analysis", to: "/analysis", icon: Search },
      { label: "Methodology", to: "/methodology", icon: BookOpen },
      { label: "Edge Detection", to: "/edge-detection", icon: TrendingUp },
      { label: "CLV", to: "/clv", icon: LineChart },
      { label: "Performance", to: "/performance", icon: BarChart3 },
    ],
  },
  {
    title: "Pre-Game Series",
    items: [
      { label: "NBA Daily Slate", to: `/blog/pregame/nba/${today}`, icon: Calendar },
      { label: "Tennis Daily Slate", to: `/blog/pregame/tennis/${today}`, icon: Calendar },
      { label: "Soccer Daily Slate", to: `/blog/pregame/soccer/${today}`, icon: Calendar },
      { label: "NHL Daily Slate", to: `/blog/pregame/nhl/${today}`, icon: Calendar },
      { label: "MLB Daily Slate", to: `/blog/pregame/mlb/${today}`, icon: Calendar },
      { label: "NFL Daily Slate", to: `/blog/pregame/nfl/${today}`, icon: Calendar },
    ],
  },
  {
    title: "Content",
    items: [
      { label: "Blog", to: "/blog", icon: FileText },
      { label: "What is CLV", to: "/blog/clv", icon: FileText, indent: true },
      { label: "Kelly Criterion", to: "/blog/kelly", icon: FileText, indent: true },
      { label: "Why bettors lose", to: "/blog/why-bettors-lose", icon: FileText, indent: true },
      { label: "Fewer bets", to: "/blog/fewer-bets", icon: FileText, indent: true },
      { label: "Betting vs investing", to: "/blog/betting-vs-investing", icon: FileText, indent: true },
      { label: "Match analysis example", to: "/blog/match-analysis-example", icon: FileText, indent: true },
    ],
  },
  {
    title: "Legal",
    items: [
      { label: "Terms", to: "/terms", icon: Scale },
      { label: "Responsible Gaming", to: "/responsible-gaming", icon: Shield },
      { label: "Affiliate Disclosure", to: "/affiliate-disclosure", icon: FileText },
    ],
  },
];

const Sitemap = () => {
  return (
    <>
      <SEOHead
        title="Sitemap – doctore"
        description="Navigate all pages on doctore: core features, blog articles, and legal information."
        canonical="/sitemap"
      />
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <main className="flex-1 container py-12 md:py-16">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">Sitemap</h1>

          <div className="grid gap-8 md:grid-cols-3">
            {sections.map((section) => (
              <div key={section.title} className="space-y-4">
                <h2 className="text-lg font-semibold text-muted-foreground uppercase tracking-wide">
                  {section.title}
                </h2>
                <ul className="space-y-2">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.to}>
                        <Link
                          to={item.to}
                          className={`flex items-center gap-2 text-foreground hover:text-primary transition-colors ${
                            item.indent ? "pl-6" : ""
                          }`}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </main>
        <SiteFooter />
      </div>
    </>
  );
};

export default Sitemap;