/**
 * Pre-Game Analysis type definitions
 * Used for Daily Slate Hub and Match Page templates
 */

// Sport enum for type safety
export type Sport = 'nba' | 'tennis' | 'soccer' | 'nhl' | 'mlb' | 'nfl';

// All valid sports array for validation
export const VALID_SPORTS: Sport[] = ['nba', 'tennis', 'soccer', 'nhl', 'mlb', 'nfl'];

// Sport display names
export const SPORT_DISPLAY_NAMES: Record<Sport, string> = {
  nba: 'NBA',
  tennis: 'Tennis',
  soccer: 'Soccer',
  nhl: 'NHL',
  mlb: 'MLB',
  nfl: 'NFL',
};

// League examples per sport
export type League = string; // e.g., 'nba', 'atp', 'wta', 'epl', 'ucl'

// Edge item for display
export interface PregameEdge {
  id: string;
  market: string;
  selection: string;
  bookOdds: number;
  fairOdds: number;
  edge: number;
  whyItMatters: string;
}

// Line move data
export interface LineMove {
  matchSlug: string;
  homeTeam: string;
  awayTeam: string;
  market: string;
  openLine: number;
  currentLine: number;
  movementPercent: number;
}

// Injury/availability item
export interface AvailabilityItem {
  player: string;
  team: string;
  status: 'OUT' | 'QUESTIONABLE' | 'PROBABLE' | 'GTD';
  reason?: string;
  source?: string;
  timestamp?: string;
}

// Match card for slate hub
export interface MatchCard {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: League;
  startTime: string;
  matchSlug: string;
  topEdge?: number;
  hasEdges: boolean;
}

// Daily Slate Hub data structure
export interface DailySlateData {
  sport: Sport;
  date: string;
  displayDate: string;
  topEdges: PregameEdge[];
  biggestLineMoves: LineMove[];
  availability: AvailabilityItem[];
  matches: MatchCard[];
}

// Best price item for match page
export interface BestPrice {
  bookmaker: string;
  odds: number;
  isPrimary: boolean;
}

// Match page data structure
export interface MatchPageData {
  sport: Sport;
  league: League;
  matchSlug: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  summary: string;
  marketSnapshot: {
    moneyline: { open: number; current: number };
    spread?: { open: string; current: string };
    total?: { open: number; current: number };
  };
  availability: AvailabilityItem[];
  edges: PregameEdge[];
  trueProbability: number;
  fairOdds: number;
  edgePercent: number;
  bestPrices: BestPrice[];
  riskNotes: string[];
}

// Affiliate partner config
export interface PartnerConfig {
  id: string;
  name: string;
  baseUrl: string;
  referralParam?: string;
}

// Helper to validate sport
export function isValidSport(sport: string): sport is Sport {
  return VALID_SPORTS.includes(sport as Sport);
}

// Helper to validate date format YYYY-MM-DD
export function isValidDateFormat(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

// Helper to generate match slug
export function generateMatchSlug(homeTeam: string, awayTeam: string): string {
  const slugify = (str: string) =>
    str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  return `${slugify(homeTeam)}-vs-${slugify(awayTeam)}`;
}