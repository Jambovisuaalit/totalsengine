/**
 * Shared team name matching utilities for fuzzy matching
 * between different data sources (ESPN, Pinnacle, Cloudbet, Odds API).
 *
 * Used by: fetch-betfair-odds, fetch-cloudbet-odds, fetch-execution-odds, run-decision-engine
 */

/** Normalize team name for fuzzy matching */
export const normalizeTeam = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z\s]/g, "")
    .trim();

export interface TeamKeywords {
  last: string;
  full: string;
}

/** Extract keywords from team name for matching */
export const getTeamKeywords = (name: string): TeamKeywords => {
  const normalized = normalizeTeam(name);
  const words = normalized.split(/\s+/);
  return { last: words[words.length - 1], full: normalized };
};

/** Check if two team keyword sets match (fuzzy) */
export const teamsMatch = (team1: TeamKeywords, team2: TeamKeywords): boolean =>
  team1.last === team2.last ||
  team1.full.includes(team2.last) ||
  team2.full.includes(team1.last);

/** Find a matching game from DB games array */
export function findMatchingGame<T extends { home_team: string; away_team: string }>(
  sourceName: string,
  sourceHome: string,
  sourceAway: string,
  dbGames: T[] | null,
): T | undefined {
  if (!dbGames) return undefined;

  const srcHome = getTeamKeywords(sourceName === "reversed" ? sourceAway : sourceHome);
  const srcAway = getTeamKeywords(sourceName === "reversed" ? sourceHome : sourceAway);

  return dbGames.find((g) => {
    const dbHome = getTeamKeywords(g.home_team);
    const dbAway = getTeamKeywords(g.away_team);
    return (
      (teamsMatch(dbHome, srcHome) && teamsMatch(dbAway, srcAway)) ||
      (teamsMatch(dbHome, srcAway) && teamsMatch(dbAway, srcHome))
    );
  });
}