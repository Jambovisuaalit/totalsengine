/** All filters apply to the same fetched set. Dates are explicitly UTC. */
export function filterAnalysisEdges(edges, filters, sportFromLeague) {
  return edges.filter((edge) => {
    if (filters.sport && sportFromLeague(edge.league) !== filters.sport)
      return false;
    if (filters.league && edge.league !== filters.league) return false;
    if (filters.market && edge.market !== filters.market) return false;
    if (filters.date) {
      const time = Date.parse(edge.start_time);
      if (
        !Number.isFinite(time) ||
        new Date(time).toISOString().slice(0, 10) !== filters.date
      )
        return false;
    }
    return true;
  });
}
