import { Instagram } from "lucide-react";
import { Link } from "react-router-dom";

export const SiteFooter = () => {
  return (
    <footer className="py-8 sm:py-10 border-t border-border/40">
      <div className="container">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {/* Brand - Full width on mobile */}
          <div className="col-span-2 sm:col-span-2 md:col-span-1 mb-2 sm:mb-0">
            <p className="text-sm font-medium tracking-normal text-foreground/70 mb-2 sm:mb-4">
              doctore
            </p>
            <p className="text-xs text-muted-foreground/50 leading-relaxed max-w-[24ch] sm:max-w-none">
              Betting intelligence focused on signal quality, not volume.
            </p>
          </div>
          
          {/* Platform */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2 sm:mb-3">Platform</h4>
            <nav className="flex flex-col gap-1.5 sm:gap-2 text-xs text-muted-foreground/60">
              <Link to="/methodology" className="hover:text-muted-foreground transition-colors py-0.5">Methodology</Link>
              <Link to="/clv" className="hover:text-muted-foreground transition-colors py-0.5">CLV Explained</Link>
              <Link to="/edge-detection" className="hover:text-muted-foreground transition-colors py-0.5">Edge Detection</Link>
              <Link to="/bankroll-management" className="hover:text-muted-foreground transition-colors py-0.5">Bankroll</Link>
              <Link to="/manifesto" className="hover:text-muted-foreground transition-colors py-0.5">Manifesto</Link>
            </nav>
          </div>
          
          {/* Resources */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2 sm:mb-3">Resources</h4>
            <nav className="flex flex-col gap-1.5 sm:gap-2 text-xs text-muted-foreground/60">
              <Link to="/blog" className="hover:text-muted-foreground transition-colors py-0.5">Blog</Link>
              <Link to="/performance" className="hover:text-muted-foreground transition-colors py-0.5">Performance</Link>
              <Link to="/pricing" className="hover:text-muted-foreground transition-colors py-0.5">Pricing</Link>
              <Link to="/dashboard" className="hover:text-muted-foreground transition-colors py-0.5">Dashboard</Link>
            </nav>
          </div>
          
          {/* Legal */}
          <div className="col-span-2 sm:col-span-1">
            <h4 className="text-xs font-medium text-muted-foreground mb-2 sm:mb-3">Legal</h4>
            <nav className="flex flex-row sm:flex-col gap-4 sm:gap-2 text-xs text-muted-foreground/60">
              <Link to="/terms" className="hover:text-muted-foreground transition-colors py-0.5">Terms</Link>
              <Link to="/responsible-gaming" className="hover:text-muted-foreground transition-colors py-0.5">Responsible Gaming</Link>
              <Link to="/affiliate-disclosure" className="hover:text-muted-foreground transition-colors py-0.5">Affiliate Disclosure</Link>
            </nav>
            <a 
              href="https://www.instagram.com/doctore_ai/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex mt-3 sm:mt-4 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              <Instagram className="h-4 w-4" />
            </a>
          </div>
        </div>
        
        <div className="pt-4 sm:pt-6 border-t border-border/20 text-xs text-muted-foreground/40 text-center sm:text-left">
          <p>© {new Date().getFullYear()} doctore. Informational tool, not betting advice.</p>
        </div>
      </div>
    </footer>
  );
};