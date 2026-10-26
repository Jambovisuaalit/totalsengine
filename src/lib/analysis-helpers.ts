/**
 * Formatting helpers for analysis pages
 * Avoids betting terminology per compliance requirements
 */

/**
 * Format decimal odds to display string
 */
export function formatOdds(odds: number): string {
  return odds.toFixed(2);
}

/**
 * Convert decimal odds to implied probability percentage
 */
export function oddsToImpliedProbability(odds: number): number {
  if (odds <= 0) return 0;
  return (1 / odds) * 100;
}

/**
 * Format probability as percentage string
 */
export function formatProbability(prob: number): string {
  return `${prob.toFixed(1)}%`;
}

/**
 * Format edge as percentage string with sign
 */
export function formatEdge(edge: number): string {
  const sign = edge > 0 ? '+' : '';
  return `${sign}${edge.toFixed(2)}%`;
}

/**
 * Format confidence level based on snapshot count
 */
export function formatConfidence(snapshots: number): string {
  if (snapshots >= 5) return 'High';
  if (snapshots >= 3) return 'Moderate';
  if (snapshots >= 2) return 'Low';
  return 'Minimal';
}

/**
 * Format time to start as human readable string
 */
export function formatTimeToStart(hoursToStart: number): string {
  if (hoursToStart < 0) return 'Started';
  if (hoursToStart < 1) return `${Math.round(hoursToStart * 60)} min`;
  if (hoursToStart < 24) return `${Math.round(hoursToStart)} hr`;
  return `${Math.round(hoursToStart / 24)} days`;
}

/**
 * Format date for display
 */
export function formatMatchDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Format ISO date for SEO
 */
export function formatISODate(dateString: string): string {
  return new Date(dateString).toISOString();
}

/**
 * Generate slug from edge data
 */
export function generateAnalysisSlug(
  homeTeam: string,
  awayTeam: string,
  market: string
): string {
  const slugify = (str: string) =>
    str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  return `${slugify(awayTeam)}-at-${slugify(homeTeam)}-${slugify(market)}`;
}

/**
 * Get badge variant based on edge value
 */
export function getEdgeBadgeVariant(edge: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (edge >= 5) return 'default';
  if (edge >= 3) return 'secondary';
  return 'outline';
}

/**
 * Get league display name
 */
export function getLeagueDisplayName(league: string): string {
  const leagueMap: Record<string, string> = {
    'soccer_epl': 'Premier League',
    'soccer_spain_la_liga': 'La Liga',
    'soccer_germany_bundesliga': 'Bundesliga',
    'soccer_italy_serie_a': 'Serie A',
    'soccer_france_ligue_one': 'Ligue 1',
    'basketball_nba': 'NBA',
    'americanfootball_nfl': 'NFL',
    'baseball_mlb': 'MLB',
    'icehockey_nhl': 'NHL',
  };
  return leagueMap[league] || league.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Get sport from league
 */
export function getSportFromLeague(league: string): string {
  if (league.startsWith('soccer')) return 'Soccer';
  if (league.startsWith('basketball')) return 'Basketball';
  if (league.startsWith('americanfootball')) return 'American Football';
  if (league.startsWith('baseball')) return 'Baseball';
  if (league.startsWith('icehockey')) return 'Ice Hockey';
  if (league.startsWith('tennis')) return 'Tennis';
  return 'Sports';
}