import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";

const navLinks = [
  { to: "/methodology", label: "Methodology" },
  { to: "/analysis", label: "Analysis" },
  { to: "/edge-detection", label: "Edge Detection" },
  { to: "/clv", label: "CLV" },
  { to: "/blog", label: "Blog" },
  { to: "/pricing", label: "Pricing" },
  { to: "/dashboard", label: "Dashboard" },
];

export const SiteHeader = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-border/60 sticky top-0 bg-background/95 backdrop-blur z-10">
      <div className="container py-3 sm:py-4 flex items-center justify-between">
        <Link to="/" className="text-base font-medium tracking-normal text-foreground">
          doctore
        </Link>
        
        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              activeClassName="text-foreground"
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Mobile hamburger menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-56 sm:w-64 pt-12">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className="text-base text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors py-3 px-2 rounded-md"
                  activeClassName="text-foreground bg-muted/50"
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};