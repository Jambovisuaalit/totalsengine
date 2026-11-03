import test from "node:test";
import assert from "node:assert/strict";
import { filterAnalysisEdges } from "../src/lib/analysis-filter.mjs";
const rows = [
  { id: 1, league: "nba", market: "total", start_time: "2026-11-03T00:00:00Z" },
  { id: 2, league: "nhl", market: "total", start_time: "2026-11-03T23:59:59Z" },
  {
    id: 3,
    league: "nba",
    market: "winner",
    start_time: "2026-11-03T23:59:59-02:00",
  },
];
const sport = (league) => (league === "nba" ? "Basketball" : "Ice Hockey");
const ids = (filters) =>
  filterAnalysisEdges(rows, filters, sport).map((r) => r.id);

test("sport, league, market, UTC date and combined filters all apply", () => {
  assert.deepEqual(ids({ sport: "Basketball" }), [1, 3]);
  assert.deepEqual(ids({ league: "nhl" }), [2]);
  assert.deepEqual(ids({ market: "winner" }), [3]);
  assert.deepEqual(ids({ date: "2026-11-03" }), [1, 2]);
  assert.deepEqual(
    ids({
      sport: "Basketball",
      league: "nba",
      market: "total",
      date: "2026-11-03",
    }),
    [1],
  );
  assert.deepEqual(ids({ sport: "Ice Hockey", league: "nba" }), []);
  assert.deepEqual(ids({}), [1, 2, 3]);
});

test("invalid time does not accidentally match a selected UTC date", () => {
  assert.deepEqual(
    filterAnalysisEdges(
      [{ start_time: "invalid" }],
      { date: "2026-11-03" },
      sport,
    ),
    [],
  );
});
