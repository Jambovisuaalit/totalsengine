/**
 * Pre-Game data adapter
 * Currently returns mock data - designed for easy swap to real pipeline
 */

import {
  Sport,
  DailySlateData,
  MatchPageData,
  PregameEdge,
  LineMove,
  AvailabilityItem,
  MatchCard,
  SPORT_DISPLAY_NAMES,
} from '@/types/pregame';
import { format, parseISO } from 'date-fns';

// Mock edges by sport
const MOCK_EDGES: Record<Sport, PregameEdge[]> = {
  nba: [
    {
      id: 'nba-edge-1',
      market: 'Moneyline',
      selection: 'Boston Celtics',
      bookOdds: 1.85,
      fairOdds: 1.72,
      edge: 7.6,
      whyItMatters: 'Model shows 58% true probability vs 54% implied. Celtics 8-2 ATS at home this season.',
    },
    {
      id: 'nba-edge-2',
      market: 'Total Points',
      selection: 'Over 224.5',
      bookOdds: 1.91,
      fairOdds: 1.82,
      edge: 4.9,
      whyItMatters: 'Both teams rank top-10 in pace. Last 5 H2H averaged 231 points.',
    },
    {
      id: 'nba-edge-3',
      market: 'Spread',
      selection: 'Lakers +6.5',
      bookOdds: 1.90,
      fairOdds: 1.83,
      edge: 3.8,
      whyItMatters: 'Lakers covering at 67% rate as road dogs. Line moved from +5.5.',
    },
  ],
  tennis: [
    {
      id: 'tennis-edge-1',
      market: 'Match Winner',
      selection: 'Jannik Sinner',
      bookOdds: 1.65,
      fairOdds: 1.52,
      edge: 8.5,
      whyItMatters: 'Sinner 12-1 on hard courts this season. Opponent struggling with first serve.',
    },
    {
      id: 'tennis-edge-2',
      market: 'Total Games',
      selection: 'Over 22.5',
      bookOdds: 1.88,
      fairOdds: 1.78,
      edge: 5.6,
      whyItMatters: 'Both players hold serve at 85%+. Last 4 meetings averaged 26 games.',
    },
    {
      id: 'tennis-edge-3',
      market: 'Set Spread',
      selection: 'Alcaraz -1.5',
      bookOdds: 2.10,
      fairOdds: 1.95,
      edge: 7.7,
      whyItMatters: 'Alcaraz has won 8 of last 10 matches in straight sets.',
    },
  ],
  soccer: [
    {
      id: 'soccer-edge-1',
      market: '1X2',
      selection: 'Arsenal',
      bookOdds: 1.75,
      fairOdds: 1.62,
      edge: 8.0,
      whyItMatters: 'Arsenal unbeaten in 14 home PL matches. xG of 2.3 per game at Emirates.',
    },
    {
      id: 'soccer-edge-2',
      market: 'Both Teams to Score',
      selection: 'Yes',
      bookOdds: 1.72,
      fairOdds: 1.65,
      edge: 4.2,
      whyItMatters: 'BTTS hit in 7 of last 8 H2H meetings. Both defenses conceding 1.2+ per game.',
    },
    {
      id: 'soccer-edge-3',
      market: 'Over/Under',
      selection: 'Over 2.5',
      bookOdds: 1.80,
      fairOdds: 1.71,
      edge: 5.3,
      whyItMatters: 'Combined average of 3.4 goals per game this season.',
    },
  ],
  nhl: [
    {
      id: 'nhl-edge-1',
      market: 'Puck Line',
      selection: 'Oilers -1.5',
      bookOdds: 2.20,
      fairOdds: 2.02,
      edge: 8.9,
      whyItMatters: 'Oilers averaging 4.2 goals at home. Opponent on back-to-back.',
    },
  ],
  mlb: [
    {
      id: 'mlb-edge-1',
      market: 'Run Line',
      selection: 'Dodgers -1.5',
      bookOdds: 1.95,
      fairOdds: 1.82,
      edge: 7.1,
      whyItMatters: 'Dodgers ace on mound vs struggling offense. 2.1 ERA at home.',
    },
  ],
  nfl: [
    {
      id: 'nfl-edge-1',
      market: 'Spread',
      selection: 'Chiefs -3.5',
      bookOdds: 1.91,
      fairOdds: 1.80,
      edge: 6.1,
      whyItMatters: 'Chiefs 10-2 ATS as home favorites. Opponent missing starting LT.',
    },
  ],
};

// Mock line moves
const MOCK_LINE_MOVES: Record<Sport, LineMove[]> = {
  nba: [
    {
      matchSlug: 'celtics-vs-lakers',
      homeTeam: 'Boston Celtics',
      awayTeam: 'Los Angeles Lakers',
      market: 'Spread',
      openLine: -5.5,
      currentLine: -6.5,
      movementPercent: 18.2,
    },
    {
      matchSlug: 'warriors-vs-bucks',
      homeTeam: 'Golden State Warriors',
      awayTeam: 'Milwaukee Bucks',
      market: 'Total',
      openLine: 228.5,
      currentLine: 225.5,
      movementPercent: -1.3,
    },
  ],
  tennis: [
    {
      matchSlug: 'sinner-vs-djokovic',
      homeTeam: 'Jannik Sinner',
      awayTeam: 'Novak Djokovic',
      market: 'Match Winner',
      openLine: 1.75,
      currentLine: 1.65,
      movementPercent: -5.7,
    },
  ],
  soccer: [
    {
      matchSlug: 'arsenal-vs-chelsea',
      homeTeam: 'Arsenal',
      awayTeam: 'Chelsea',
      market: '1X2 Home',
      openLine: 1.85,
      currentLine: 1.75,
      movementPercent: -5.4,
    },
  ],
  nhl: [],
  mlb: [],
  nfl: [],
};

// Mock availability
const MOCK_AVAILABILITY: Record<Sport, AvailabilityItem[]> = {
  nba: [
    { player: 'Jaylen Brown', team: 'Boston Celtics', status: 'PROBABLE', reason: 'Knee soreness' },
    { player: 'Anthony Davis', team: 'Los Angeles Lakers', status: 'QUESTIONABLE', reason: 'Back tightness' },
    { player: 'Giannis Antetokounmpo', team: 'Milwaukee Bucks', status: 'OUT', reason: 'Hamstring strain' },
  ],
  tennis: [
    { player: 'Rafael Nadal', team: 'Spain', status: 'OUT', reason: 'Hip injury' },
  ],
  soccer: [
    { player: 'Bukayo Saka', team: 'Arsenal', status: 'PROBABLE', reason: 'Thigh tightness' },
    { player: 'Reece James', team: 'Chelsea', status: 'OUT', reason: 'Knee injury' },
  ],
  nhl: [],
  mlb: [],
  nfl: [],
};

// Mock matches
const MOCK_MATCHES: Record<Sport, MatchCard[]> = {
  nba: [
    {
      id: 'nba-match-1',
      homeTeam: 'Boston Celtics',
      awayTeam: 'Los Angeles Lakers',
      league: 'nba',
      startTime: '2025-01-22T19:30:00Z',
      matchSlug: 'celtics-vs-lakers',
      topEdge: 7.6,
      hasEdges: true,
    },
    {
      id: 'nba-match-2',
      homeTeam: 'Golden State Warriors',
      awayTeam: 'Milwaukee Bucks',
      league: 'nba',
      startTime: '2025-01-22T22:00:00Z',
      matchSlug: 'warriors-vs-bucks',
      topEdge: 4.9,
      hasEdges: true,
    },
    {
      id: 'nba-match-3',
      homeTeam: 'Miami Heat',
      awayTeam: 'Phoenix Suns',
      league: 'nba',
      startTime: '2025-01-22T19:00:00Z',
      matchSlug: 'heat-vs-suns',
      hasEdges: false,
    },
  ],
  tennis: [
    {
      id: 'tennis-match-1',
      homeTeam: 'Jannik Sinner',
      awayTeam: 'Novak Djokovic',
      league: 'atp',
      startTime: '2025-01-22T14:00:00Z',
      matchSlug: 'sinner-vs-djokovic',
      topEdge: 8.5,
      hasEdges: true,
    },
    {
      id: 'tennis-match-2',
      homeTeam: 'Carlos Alcaraz',
      awayTeam: 'Daniil Medvedev',
      league: 'atp',
      startTime: '2025-01-22T16:30:00Z',
      matchSlug: 'alcaraz-vs-medvedev',
      topEdge: 7.7,
      hasEdges: true,
    },
  ],
  soccer: [
    {
      id: 'soccer-match-1',
      homeTeam: 'Arsenal',
      awayTeam: 'Chelsea',
      league: 'epl',
      startTime: '2025-01-22T15:00:00Z',
      matchSlug: 'arsenal-vs-chelsea',
      topEdge: 8.0,
      hasEdges: true,
    },
    {
      id: 'soccer-match-2',
      homeTeam: 'Real Madrid',
      awayTeam: 'Barcelona',
      league: 'laliga',
      startTime: '2025-01-22T20:00:00Z',
      matchSlug: 'real-madrid-vs-barcelona',
      topEdge: 5.3,
      hasEdges: true,
    },
  ],
  nhl: [
    {
      id: 'nhl-match-1',
      homeTeam: 'Edmonton Oilers',
      awayTeam: 'Toronto Maple Leafs',
      league: 'nhl',
      startTime: '2025-01-22T21:00:00Z',
      matchSlug: 'oilers-vs-maple-leafs',
      topEdge: 8.9,
      hasEdges: true,
    },
  ],
  mlb: [
    {
      id: 'mlb-match-1',
      homeTeam: 'Los Angeles Dodgers',
      awayTeam: 'New York Yankees',
      league: 'mlb',
      startTime: '2025-01-22T19:10:00Z',
      matchSlug: 'dodgers-vs-yankees',
      topEdge: 7.1,
      hasEdges: true,
    },
  ],
  nfl: [
    {
      id: 'nfl-match-1',
      homeTeam: 'Kansas City Chiefs',
      awayTeam: 'Buffalo Bills',
      league: 'nfl',
      startTime: '2025-01-22T20:15:00Z',
      matchSlug: 'chiefs-vs-bills',
      topEdge: 6.1,
      hasEdges: true,
    },
  ],
};

/**
 * Safely parse a date string, returning null if invalid
 */
function safeParseDate(dateStr: string): Date | null {
  try {
    const parsed = parseISO(dateStr);
    // Check if the date is valid
    if (isNaN(parsed.getTime())) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Get daily slate data for a sport and date
 */
export function getDailySlateData(sport: Sport, date: string): DailySlateData {
  const parsedDate = safeParseDate(date);
  const displayDate = parsedDate 
    ? format(parsedDate, 'EEEE, MMMM d, yyyy')
    : date; // Fallback to raw date string if parsing fails

  return {
    sport,
    date,
    displayDate,
    topEdges: MOCK_EDGES[sport]?.slice(0, 3) || [],
    biggestLineMoves: MOCK_LINE_MOVES[sport] || [],
    availability: MOCK_AVAILABILITY[sport] || [],
    matches: MOCK_MATCHES[sport] || [],
  };
}

/**
 * Get match page data
 */
export function getMatchPageData(
  sport: Sport,
  league: string,
  matchSlug: string,
  date: string
): MatchPageData | null {
  // Find the match in our mock data
  const matches = MOCK_MATCHES[sport] || [];
  const match = matches.find((m) => m.matchSlug === matchSlug);

  if (!match) {
    // Return a default match for demo purposes
    const [home, away] = matchSlug.split('-vs-').map((t) =>
      t
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    );

    return {
      sport,
      league,
      matchSlug,
      date,
      homeTeam: home || 'Home Team',
      awayTeam: away || 'Away Team',
      startTime: `${date}T19:00:00Z`,
      summary: `Analysis of ${away || 'Away Team'} at ${home || 'Home Team'}. Our model has identified potential value in this matchup based on recent form and market inefficiencies.`,
      marketSnapshot: {
        moneyline: { open: 1.85, current: 1.80 },
        spread: { open: '-3.5', current: '-4.5' },
        total: { open: 215.5, current: 218.5 },
      },
      availability: MOCK_AVAILABILITY[sport]?.slice(0, 2) || [],
      edges: MOCK_EDGES[sport]?.slice(0, 3) || [],
      trueProbability: 56.2,
      fairOdds: 1.78,
      edgePercent: 6.5,
      bestPrices: [
        { bookmaker: 'Stake', odds: 1.85, isPrimary: true },
        { bookmaker: 'Cloudbet', odds: 1.82, isPrimary: false },
      ],
      riskNotes: [
        'Key player status uncertain - monitor injury reports',
        'Back-to-back game for home team may impact performance',
        'Recent H2H favors underdog in close games',
      ],
    };
  }

  // Build full match data from the found match
  const edges = MOCK_EDGES[sport] || [];

  return {
    sport,
    league: match.league,
    matchSlug: match.matchSlug,
    date,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    startTime: match.startTime,
    summary: `${match.awayTeam} travels to face ${match.homeTeam} in a ${SPORT_DISPLAY_NAMES[sport]} matchup. Our model has identified potential value based on recent performance metrics and market pricing inefficiencies.`,
    marketSnapshot: {
      moneyline: { open: 1.85, current: 1.80 },
      spread: { open: '-3.5', current: '-4.5' },
      total: { open: 215.5, current: 218.5 },
    },
    availability: MOCK_AVAILABILITY[sport]?.filter(
      (a) => a.team === match.homeTeam || a.team === match.awayTeam
    ) || [],
    edges: edges.slice(0, 3),
    trueProbability: 56.2,
    fairOdds: 1.78,
    edgePercent: match.topEdge || 5.0,
    bestPrices: [
      { bookmaker: 'Stake', odds: 1.85, isPrimary: true },
      { bookmaker: 'Cloudbet', odds: 1.82, isPrimary: false },
    ],
    riskNotes: [
      'Key player status uncertain - monitor injury reports before tip-off',
      'Recent schedule could impact team fatigue levels',
      'Historical H2H data shows variance in similar matchups',
    ],
  };
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDate(): string {
  return format(new Date(), 'yyyy-MM-dd');
}