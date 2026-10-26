import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Methodology from "./pages/Methodology";
import Performance from "./pages/Performance";
import Pricing from "./pages/Pricing";
import CLV from "./pages/CLV";
import BankrollManagement from "./pages/BankrollManagement";
import EdgeDetection from "./pages/EdgeDetection";
import ResponsibleGaming from "./pages/ResponsibleGaming";
import Terms from "./pages/Terms";
import Sitemap from "./pages/Sitemap";
import NotFound from "./pages/NotFound";
import AnalysisIndex from "./pages/AnalysisIndex";
import AnalysisDetail from "./pages/AnalysisDetail";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Lazy load blog routes to reduce initial bundle size
const Blog = lazy(() => import("./pages/Blog"));
const BlogFewerBets = lazy(() => import("./pages/BlogFewerBets"));
const BlogCLV = lazy(() => import("./pages/BlogCLV"));
const BlogKelly = lazy(() => import("./pages/BlogKelly"));
const BlogWhyLose = lazy(() => import("./pages/BlogWhyLose"));
const BlogBettingVsInvesting = lazy(() => import("./pages/BlogBettingVsInvesting"));
const BlogExpectedValue = lazy(() => import("./pages/BlogExpectedValue"));
const BlogLineShopping = lazy(() => import("./pages/BlogLineShopping"));
const BlogMatchAnalysisExample = lazy(() => import("./pages/BlogMatchAnalysisExample"));
const BlogMarketExplainerExample = lazy(() => import("./pages/BlogMarketExplainerExample"));
const BlogMatchAnalysisArticle = lazy(() => import("./pages/BlogMatchAnalysisArticle"));
const AffiliateRedirect = lazy(() => import("./pages/AffiliateRedirect"));
const AffiliateDisclosure = lazy(() => import("./pages/AffiliateDisclosure"));
const PregameDailySlate = lazy(() => import("./pages/PregameDailySlate"));
const PregameMatchPage = lazy(() => import("./pages/PregameMatchPage"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Manifesto = lazy(() => import("./pages/Manifesto"));
const BlogDataDrivenStrategy = lazy(() => import("./pages/BlogDataDrivenStrategy"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 3 * 60 * 1000, // 3 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Loading fallback for lazy-loaded routes
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="animate-pulse text-muted-foreground">Loading...</div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<Suspense fallback={<PageLoader />}><ResetPassword /></Suspense>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/methodology" element={<Methodology />} />
          <Route path="/clv" element={<CLV />} />
          <Route path="/bankroll-management" element={<BankrollManagement />} />
          <Route path="/edge-detection" element={<EdgeDetection />} />
          <Route path="/responsible-gaming" element={<ResponsibleGaming />} />
          <Route path="/performance" element={<Performance />} />
          <Route path="/pricing" element={<Pricing />} />
          {/* Lazy-loaded blog routes */}
          <Route path="/blog" element={<Suspense fallback={<PageLoader />}><Blog /></Suspense>} />
          <Route path="/blog/fewer-bets" element={<Suspense fallback={<PageLoader />}><BlogFewerBets /></Suspense>} />
          <Route path="/blog/what-is-clv" element={<Suspense fallback={<PageLoader />}><BlogCLV /></Suspense>} />
          <Route path="/blog/kelly-criterion" element={<Suspense fallback={<PageLoader />}><BlogKelly /></Suspense>} />
          <Route path="/blog/why-bettors-lose" element={<Suspense fallback={<PageLoader />}><BlogWhyLose /></Suspense>} />
          <Route path="/blog/betting-vs-investing" element={<Suspense fallback={<PageLoader />}><BlogBettingVsInvesting /></Suspense>} />
          <Route path="/blog/expected-value" element={<Suspense fallback={<PageLoader />}><BlogExpectedValue /></Suspense>} />
          <Route path="/blog/line-shopping" element={<Suspense fallback={<PageLoader />}><BlogLineShopping /></Suspense>} />
          <Route path="/blog/match-analysis-example" element={<Suspense fallback={<PageLoader />}><BlogMatchAnalysisExample /></Suspense>} />
          <Route path="/blog/vig-explained" element={<Suspense fallback={<PageLoader />}><BlogMarketExplainerExample /></Suspense>} />
          <Route path="/blog/match-analysis" element={<Suspense fallback={<PageLoader />}><BlogMatchAnalysisArticle /></Suspense>} />
          <Route path="/blog/data-driven-betting-strategy" element={<Suspense fallback={<PageLoader />}><BlogDataDrivenStrategy /></Suspense>} />
          <Route path="/analysis" element={<AnalysisIndex />} />
          <Route path="/analysis/:id" element={<AnalysisDetail />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/manifesto" element={<Suspense fallback={<PageLoader />}><Manifesto /></Suspense>} />
          <Route path="/sitemap" element={<Sitemap />} />
          {/* Pre-Game routes */}
          <Route path="/go/:partner" element={<Suspense fallback={<PageLoader />}><AffiliateRedirect /></Suspense>} />
          <Route path="/affiliate-disclosure" element={<Suspense fallback={<PageLoader />}><AffiliateDisclosure /></Suspense>} />
          <Route path="/blog/pregame/:sport/:date" element={<Suspense fallback={<PageLoader />}><PregameDailySlate /></Suspense>} />
          <Route path="/blog/pregame/:sport/:league/:match/:date" element={<Suspense fallback={<PageLoader />}><PregameMatchPage /></Suspense>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;