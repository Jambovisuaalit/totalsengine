import { Link, NavLink } from "react-router-dom";
const links = [
  { to: "/", label: "Overview", end: true },
  { to: "/analysis", label: "Analyze Game" },
  { to: "/methodology", label: "Methodology" },
  { to: "/performance", label: "Validation Status" },
];
export function SiteHeader() {
  return <header className="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur">
    <div className="container flex min-h-16 flex-wrap items-center justify-between gap-3 py-3">
      <Link to="/" className="text-lg font-bold tracking-tight">TOTALS<span className="text-primary">ENGINE</span></Link>
      <nav aria-label="Primary navigation" className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        {links.map(({to,label,end}) => <NavLink key={to} to={to} end={end} className={({isActive}) => isActive ? "font-medium text-foreground underline underline-offset-8" : "text-muted-foreground hover:text-foreground"}>{label}</NavLink>)}
      </nav>
    </div>
  </header>;
}
