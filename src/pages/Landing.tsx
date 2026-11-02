import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight, ShieldCheck, Activity, Database } from "lucide-react";
import { ProductFrame, EvidenceNotice } from "@/components/ProductFrame";
const steps = [
 {number:"01",title:"Analyze Game",description:"Enter a verifiable NBA game identifier and inspect the evidence requirements."},
 {number:"02",title:"Review Prediction",description:"Only display model totals after a pre-game forecast, version and input cutoff are independently evidenced."},
 {number:"03",title:"Evaluate Market Edge",description:"Compare against authentic timestamped bookmaker lines only when licensed odds and calibrated probabilities are available."},
];
export default function Landing(){
 return <ProductFrame><Helmet><title>TotalsEngine — NBA Game Totals Research</title><meta name="description" content="Evidence-led NBA totals predictions and market comparison, currently a research prototype." /></Helmet>
  <div className="container max-w-6xl py-16 sm:py-24">
   <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"><span className="h-2 w-2 rounded-full bg-amber-400"/>NBA TOTALS · RESEARCH PROTOTYPE</div>
   <h1 className="max-w-4xl text-5xl sm:text-7xl font-semibold tracking-tight leading-[1.05]">Read the game.<br/><span className="text-primary">Respect the line.</span></h1>
   <p className="mt-7 max-w-2xl text-lg text-muted-foreground leading-relaxed">TotalsEngine is a transparent workflow for NBA Over/Under analysis. Forecast evidence comes first. Market comparison follows only when valid odds are available.</p>
   <div className="mt-8 flex flex-wrap gap-3"><Link to="/analysis" className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground hover:opacity-90">Analyze Game <ArrowRight size={18}/></Link><Link to="/methodology" className="inline-flex items-center rounded-md border border-border px-6 py-3 font-medium hover:bg-muted">Review methodology</Link></div>
   <div className="mt-12"><EvidenceNotice/></div>
   <section className="mt-20" aria-labelledby="workflow"><h2 id="workflow" className="text-2xl font-semibold">One analysis workflow</h2><div className="mt-6 grid gap-4 md:grid-cols-3">{steps.map(s=><div key={s.number} className="rounded-xl border border-border bg-card p-6"><div className="text-xs tracking-widest text-primary">{s.number}</div><h3 className="mt-4 text-xl font-semibold">{s.title}</h3><p className="mt-3 text-sm text-muted-foreground leading-relaxed">{s.description}</p></div>)}</div></section>
   <section className="mt-20 grid gap-6 rounded-xl border border-border p-6 md:grid-cols-3" aria-label="Research gates"><div><Database className="mb-3 text-primary" size={22}/><h3 className="font-semibold">Game data</h3><p className="mt-2 text-sm text-muted-foreground">Historical games and feature timestamps require integrity checks.</p></div><div><Activity className="mb-3 text-primary" size={22}/><h3 className="font-semibold">Prediction quality</h3><p className="mt-2 text-sm text-muted-foreground">MAE/RMSE and calibration need chronological evaluation and source provenance.</p></div><div><ShieldCheck className="mb-3 text-primary" size={22}/><h3 className="font-semibold">Market integrity</h3><p className="mt-2 text-sm text-muted-foreground">No fabricated odds, projected ROI or implied betting edge.</p></div></section>
  </div></ProductFrame>;
}
