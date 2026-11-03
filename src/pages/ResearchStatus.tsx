import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";

export default function ResearchStatus({
  unavailable = false,
}: {
  unavailable?: boolean;
}) {
  const title = unavailable
    ? "Page unavailable"
    : "Research and evidence status";
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SEOHead
        title={`${title} | TotalsEngine`}
        description="NBA totals research: separate collection, settlement and independently verified evidence."
        noindex={unavailable}
      />
      <div className="mx-auto max-w-3xl px-5 py-16">
        <Link to="/" className="underline">
          TotalsEngine / Home
        </Link>
        <h1 className="mt-8 text-3xl font-semibold">{title}</h1>
        {unavailable ? (
          <p className="mt-6">
            This route is not part of the current TotalsEngine research release.
            Legacy analysis, accounts and paid-product pages are unavailable
            while migration is pending.
          </p>
        ) : (
          <>
            <p className="mt-6">
              TotalsEngine estimates NBA full-game points, including overtime,
              and compares frozen pregame forecasts with final results. It does
              not offer betting recommendations or paid subscriptions.
            </p>
            <h2 className="mt-8 text-xl font-semibold">
              Three separate evidence levels
            </h2>
            <ol className="mt-4 list-decimal space-y-3 pl-6">
              <li>
                Retrospective experiments test candidate models on historical
                results. They do not count as recorded prospective predictions.
              </li>
              <li>
                Forward paper collection records rolling-baseline forecasts and
                provisional error metrics. GitHub host timestamps and hashes
                alone do not establish independent provenance.
              </li>
              <li>
                Independent evaluation requires verified source availability,
                rights, game identity, an original pre-tipoff forecast, trusted
                timestamp, immutable archive and final-score evidence.
              </li>
            </ol>
            <p className="mt-6">
              Independent admission remains blocked pending evidence. No
              verified accuracy, market edge or ROI is claimed.
            </p>
            <a
              className="mt-8 inline-block underline"
              href="https://github.com/Jambovisuaalit/totalsengine/blob/main/docs/PROJECT_STATUS.md"
            >
              Read the current project status and release gates
            </a>
          </>
        )}
      </div>
    </main>
  );
}
