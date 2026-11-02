import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { ProductFrame, EvidenceNotice } from "@/components/ProductFrame";

type Fixture = {
  provider_game_id: string; league: string; game_date: string; scheduled_tipoff_utc: string;
  status: string; postponed: boolean; retrieved_at_utc: string; provider: string;
  home: {name:string; abbreviation:string}; away: {name:string; abbreviation:string};
};
type ApiResult = {
 fixture: Fixture; prediction: null;
 prediction_evidence: {status: string;reason: string};
 market: null; market_evidence: {status: string;reason: string};
};
export default function AnalysisIndex() {
 const [gameId,setGameId] = useState("");
 const [message,setMessage] = useState("");
 const [fixture,setFixture] = useState<Fixture | null>(null);
 const [loading,setLoading] = useState(false);
 async function submit(e: React.FormEvent) {
  e.preventDefault(); setFixture(null);
  if (!/^\d{1,12}$/.test(gameId.trim())) { setMessage("Enter a numeric BALLDONTLIE NBA provider game ID (up to 12 digits).");return; }
  setLoading(true); setMessage("");
  try {
    const response = await fetch(`/api/nba/game?id=${encodeURIComponent(gameId.trim())}`, {headers:{"Accept":"application/json"}, cache:"no-store"});
    const data = await response.json() as ApiResult & {error?: string};
    if (!response.ok || !data.fixture) {setMessage(data.error || "NBA source is not available.");return;}
    setFixture(data.fixture);
    setMessage("Verified provider fixture response received. Independent pre-game prediction evidence and bookmaker odds are not connected.");
  } catch {setMessage("Fixture lookup unavailable. No prediction or market conclusion is possible."); }
  finally {setLoading(false);}
 }
 return <ProductFrame><Helmet><title>Analyze Game — TotalsEngine</title><meta name="description" content="NBA totals analysis requires authenticated fixture data and independent prediction evidence." /></Helmet>
  <div className="container max-w-4xl py-12 sm:py-16"><p className="text-xs uppercase tracking-widest text-primary">NBA / Total points</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Analyze Game</h1>
  <p className="mt-4 max-w-2xl text-muted-foreground">Lookup a game using its BALLDONTLIE provider ID. Server-side credentials are required; forecasts and bookmaker lines remain disabled until their independent evidence gates pass.</p>
  <div className="mt-8"><EvidenceNotice/></div>
  <form onSubmit={submit} className="mt-8 rounded-xl border border-border bg-card p-6">
   <label htmlFor="nba-game-id" className="block font-medium">Provider NBA game ID</label>
   <p className="mt-1 text-sm text-muted-foreground">A provider ID is not interchangeable with an NBA.com or ESPN ID. Lookup is server-side only.</p>
   <div className="mt-4 flex flex-col gap-3 sm:flex-row"><input id="nba-game-id" inputMode="numeric" autoComplete="off" placeholder="BALLDONTLIE game ID" value={gameId} onChange={e=>{setGameId(e.target.value);setMessage("");setFixture(null);}} className="min-w-0 flex-1 rounded-md border border-input bg-background px-4 py-3 text-foreground" /><button type="submit" disabled={loading} className="rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground disabled:opacity-50">{loading?"Checking...":"Analyze Game"}</button></div>
   {message && <p role="status" className="mt-4 text-sm text-muted-foreground">{message}</p>}
  </form>
  {fixture && <section className="mt-8 rounded-xl border border-border p-6" aria-label="Source-verified fixture"><p className="text-xs uppercase tracking-wider text-primary">Fixture returned by {fixture.provider} · Not model-verified</p><h2 className="mt-3 text-2xl font-semibold">{fixture.away.name} @ {fixture.home.name}</h2><dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-muted-foreground">Scheduled tipoff (UTC)</dt><dd>{new Date(fixture.scheduled_tipoff_utc).toLocaleString("en-GB",{timeZone:"UTC",timeZoneName:"short"})}</dd></div><div><dt className="text-muted-foreground">Provider status</dt><dd>{fixture.status}{fixture.postponed?" · Postponed":""}</dd></div><div><dt className="text-muted-foreground">Provider game ID</dt><dd>{fixture.provider_game_id}</dd></div><div><dt className="text-muted-foreground">Retrieved (UTC)</dt><dd>{fixture.retrieved_at_utc}</dd></div></dl></section>}
  <section className="mt-8 grid gap-4 sm:grid-cols-3" aria-label="Analysis evidence fields">{[[ "Game and tipoff", fixture ? "SOURCE-REPORTED" : "NOT CONNECTED" ],["Model total / uncertainty","BLOCKED"],["Bookmaker total / odds","BLOCKED"]].map(([k,v])=><div key={k} className="rounded-lg border border-border p-5"><p className="text-sm text-muted-foreground">{k}</p><strong className="mt-3 block text-lg">{v}</strong></div>)}</section>
  <div className="mt-8 rounded-lg border border-border p-5"><h2 className="font-semibold">Evidence required to unlock analysis</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Authenticated fixture source → immutable pre-tipoff prediction record → independently verified timestamp, snapshot and artifact hash → uncertainty/calibration → properly licensed bookmaker line. Until then the decision remains <strong>NO PLAY / NO CLAIM</strong>.</p></div>
  </div></ProductFrame>;
}
