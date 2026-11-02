import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { ProductFrame, EvidenceNotice } from "@/components/ProductFrame";
type Phase = "idle" | "invalid" | "blocked";
export default function AnalysisIndex() {
 const [gameId,setGameId] = useState("");
 const [phase,setPhase] = useState<Phase>("idle");
 const valid = /^\d{8,12}$/.test(gameId.trim());
 function submit(e: React.FormEvent) {e.preventDefault();setPhase(valid ? "blocked" : "invalid");}
 return <ProductFrame><Helmet><title>Analyze Game — TotalsEngine</title><meta name="description" content="NBA totals analysis evidence gate; no unaudited predictions or bookmaker lines." /></Helmet>
  <div className="container max-w-4xl py-12 sm:py-16"><p className="text-xs uppercase tracking-widest text-primary">NBA / Total points</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Analyze Game</h1><p className="mt-4 max-w-2xl text-muted-foreground">Use an NBA game ID to initiate an evidence check. This interface does not guess fixtures, fabricate totals, or synthesize market lines.</p>
  <div className="mt-8"><EvidenceNotice/></div>
  <form onSubmit={submit} className="mt-8 rounded-xl border border-border bg-card p-6" noValidate>
    <label htmlFor="nba-game-id" className="block font-medium">NBA game ID</label>
    <p id="id-help" className="mt-1 text-sm text-muted-foreground">Enter an official numeric game identifier (8–12 digits). Game lookup is not connected yet.</p>
    <div className="mt-4 flex flex-col gap-3 sm:flex-row"><input id="nba-game-id" aria-describedby="id-help" inputMode="numeric" autoComplete="off" placeholder="Official game ID" value={gameId} onChange={e=>{setGameId(e.target.value);setPhase("idle");}} className="min-w-0 flex-1 rounded-md border border-input bg-background px-4 py-3 text-foreground"/><button className="rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground" type="submit">Analyze Game</button></div>
    {phase==="invalid" && <p role="alert" className="mt-3 text-sm text-destructive">Enter an 8–12 digit NBA game ID.</p>}
    {phase==="blocked" && <p role="status" className="mt-3 text-sm text-amber-500">Game {gameId.trim()} was not verified. Fixture lookup, evidence-backed predictions and bookmaker odds are not yet connected. No model output or betting decision is available.</p>}
  </form>
  <section className="mt-8 grid gap-4 sm:grid-cols-3" aria-label="Prediction evaluation fields">
  {[["Game and tipoff","UNAVAILABLE"],["Model total / uncertainty","NOT VERIFIED"],["Bookmaker total / odds","NOT CONNECTED"]].map(([k,v])=><div key={k} className="rounded-lg border border-border p-5"><p className="text-sm text-muted-foreground">{k}</p><strong className="mt-3 block text-lg">{v}</strong></div>)}</section>
  <div className="mt-8 rounded-lg border border-border p-5"><h2 className="font-semibold">Evidence required to unlock an analysis</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Verified fixture and scheduled tipoff → pre-game input cutoff → timestamped forecast and model artifact hash → uncertainty/calibration → timestamped licensed bookmaker line and price. Until then the decision is <strong>NO PLAY / NO CLAIM</strong>.</p></div>
  </div></ProductFrame>;
}
