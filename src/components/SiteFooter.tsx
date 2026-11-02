import { Link } from "react-router-dom";
export function SiteFooter() {
 return <footer className="border-t border-border/60 py-8">
  <div className="container flex flex-wrap justify-between gap-4 text-sm text-muted-foreground">
   <div><strong className="text-foreground">TotalsEngine</strong><p className="mt-1 max-w-lg">NBA totals research prototype. No live picks, verified historical performance, or executable market edges are offered.</p></div>
   <nav aria-label="Footer navigation" className="flex gap-4"><Link to="/methodology">Methodology</Link><Link to="/performance">Validation status</Link></nav>
  </div>
 </footer>;
}
