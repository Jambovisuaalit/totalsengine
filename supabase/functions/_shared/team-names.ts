/**
 * League-specific team name mappings.
 * Maps ESPN abbreviations and city names to full team names.
 */

const NHL_TEAMS: Record<string, string> = {
  // Abbreviations
  "ANA": "Anaheim Ducks", "BOS": "Boston Bruins", "BUF": "Buffalo Sabres",
  "CGY": "Calgary Flames", "CAR": "Carolina Hurricanes", "CHI": "Chicago Blackhawks",
  "COL": "Colorado Avalanche", "CBJ": "Columbus Blue Jackets", "DAL": "Dallas Stars",
  "DET": "Detroit Red Wings", "EDM": "Edmonton Oilers", "FLA": "Florida Panthers",
  "LA": "Los Angeles Kings", "MIN": "Minnesota Wild", "MTL": "Montreal Canadiens",
  "NSH": "Nashville Predators", "NJ": "New Jersey Devils", "NYI": "New York Islanders",
  "NYR": "New York Rangers", "OTT": "Ottawa Senators", "PHI": "Philadelphia Flyers",
  "PIT": "Pittsburgh Penguins", "SJ": "San Jose Sharks", "SEA": "Seattle Kraken",
  "STL": "St. Louis Blues", "TB": "Tampa Bay Lightning", "TOR": "Toronto Maple Leafs",
  "UTAH": "Utah Hockey Club", "VAN": "Vancouver Canucks", "VGK": "Vegas Golden Knights",
  "WSH": "Washington Capitals", "WPG": "Winnipeg Jets",
  // City names
  "Anaheim": "Anaheim Ducks", "Boston": "Boston Bruins", "Buffalo": "Buffalo Sabres",
  "Calgary": "Calgary Flames", "Carolina": "Carolina Hurricanes", "Chicago": "Chicago Blackhawks",
  "Colorado": "Colorado Avalanche", "Columbus": "Columbus Blue Jackets", "Dallas": "Dallas Stars",
  "Detroit": "Detroit Red Wings", "Edmonton": "Edmonton Oilers", "Florida": "Florida Panthers",
  "Los Angeles": "Los Angeles Kings", "Minnesota": "Minnesota Wild", "Montreal": "Montreal Canadiens",
  "Nashville": "Nashville Predators", "New Jersey": "New Jersey Devils",
  "New York": "New York Rangers", // Default NYR for ambiguous "New York"
  "Ottawa": "Ottawa Senators", "Philadelphia": "Philadelphia Flyers", "Pittsburgh": "Pittsburgh Penguins",
  "San Jose": "San Jose Sharks", "Seattle": "Seattle Kraken", "St. Louis": "St. Louis Blues",
  "Tampa Bay": "Tampa Bay Lightning", "Toronto": "Toronto Maple Leafs", "Utah": "Utah Hockey Club",
  "Vancouver": "Vancouver Canucks", "Vegas": "Vegas Golden Knights", "Washington": "Washington Capitals",
  "Winnipeg": "Winnipeg Jets",
};

const NBA_TEAMS: Record<string, string> = {
  // Abbreviations
  "ATL": "Atlanta Hawks", "BOS": "Boston Celtics", "BKN": "Brooklyn Nets",
  "CHA": "Charlotte Hornets", "CHI": "Chicago Bulls", "CLE": "Cleveland Cavaliers",
  "DAL": "Dallas Mavericks", "DEN": "Denver Nuggets", "DET": "Detroit Pistons",
  "GS": "Golden State Warriors", "GSW": "Golden State Warriors",
  "HOU": "Houston Rockets", "IND": "Indiana Pacers", "LAC": "LA Clippers",
  "LAL": "Los Angeles Lakers", "MEM": "Memphis Grizzlies", "MIA": "Miami Heat",
  "MIL": "Milwaukee Bucks", "MIN": "Minnesota Timberwolves", "NO": "New Orleans Pelicans",
  "NOP": "New Orleans Pelicans", "NY": "New York Knicks", "NYK": "New York Knicks",
  "OKC": "Oklahoma City Thunder", "ORL": "Orlando Magic", "PHI": "Philadelphia 76ers",
  "PHX": "Phoenix Suns", "POR": "Portland Trail Blazers", "SAC": "Sacramento Kings",
  "SA": "San Antonio Spurs", "SAS": "San Antonio Spurs", "TOR": "Toronto Raptors",
  "UTAH": "Utah Jazz", "UTA": "Utah Jazz", "WAS": "Washington Wizards",
  // City names
  "Atlanta": "Atlanta Hawks", "Boston": "Boston Celtics", "Brooklyn": "Brooklyn Nets",
  "Charlotte": "Charlotte Hornets", "Chicago": "Chicago Bulls", "Cleveland": "Cleveland Cavaliers",
  "Dallas": "Dallas Mavericks", "Denver": "Denver Nuggets", "Detroit": "Detroit Pistons",
  "Golden State": "Golden State Warriors", "Houston": "Houston Rockets", "Indiana": "Indiana Pacers",
  "LA": "LA Clippers", "Los Angeles": "Los Angeles Lakers",
  "Memphis": "Memphis Grizzlies", "Miami": "Miami Heat", "Milwaukee": "Milwaukee Bucks",
  "Minnesota": "Minnesota Timberwolves", "New Orleans": "New Orleans Pelicans",
  "New York": "New York Knicks", "Oklahoma City": "Oklahoma City Thunder",
  "Orlando": "Orlando Magic", "Philadelphia": "Philadelphia 76ers", "Phoenix": "Phoenix Suns",
  "Portland": "Portland Trail Blazers", "Sacramento": "Sacramento Kings",
  "San Antonio": "San Antonio Spurs", "Toronto": "Toronto Raptors", "Utah": "Utah Jazz",
  "Washington": "Washington Wizards",
};

const NFL_TEAMS: Record<string, string> = {
  "ARI": "Arizona Cardinals", "ATL": "Atlanta Falcons", "BAL": "Baltimore Ravens",
  "BUF": "Buffalo Bills", "CAR": "Carolina Panthers", "CHI": "Chicago Bears",
  "CIN": "Cincinnati Bengals", "CLE": "Cleveland Browns", "DAL": "Dallas Cowboys",
  "DEN": "Denver Broncos", "DET": "Detroit Lions", "GB": "Green Bay Packers",
  "HOU": "Houston Texans", "IND": "Indianapolis Colts", "JAX": "Jacksonville Jaguars",
  "KC": "Kansas City Chiefs", "LV": "Las Vegas Raiders", "LAC": "Los Angeles Chargers",
  "LAR": "Los Angeles Rams", "MIA": "Miami Dolphins", "MIN": "Minnesota Vikings",
  "NE": "New England Patriots", "NO": "New Orleans Saints", "NYG": "New York Giants",
  "NYJ": "New York Jets", "PHI": "Philadelphia Eagles", "PIT": "Pittsburgh Steelers",
  "SF": "San Francisco 49ers", "SEA": "Seattle Seahawks", "TB": "Tampa Bay Buccaneers",
  "TEN": "Tennessee Titans", "WAS": "Washington Commanders",
  // City names
  "Arizona": "Arizona Cardinals", "Atlanta": "Atlanta Falcons", "Baltimore": "Baltimore Ravens",
  "Buffalo": "Buffalo Bills", "Carolina": "Carolina Panthers", "Chicago": "Chicago Bears",
  "Cincinnati": "Cincinnati Bengals", "Cleveland": "Cleveland Browns", "Dallas": "Dallas Cowboys",
  "Denver": "Denver Broncos", "Detroit": "Detroit Lions", "Green Bay": "Green Bay Packers",
  "Houston": "Houston Texans", "Indianapolis": "Indianapolis Colts", "Jacksonville": "Jacksonville Jaguars",
  "Kansas City": "Kansas City Chiefs", "Las Vegas": "Las Vegas Raiders",
  "Los Angeles": "Los Angeles Rams", "Miami": "Miami Dolphins", "Minnesota": "Minnesota Vikings",
  "New England": "New England Patriots", "New Orleans": "New Orleans Saints",
  "New York": "New York Giants", "Philadelphia": "Philadelphia Eagles",
  "Pittsburgh": "Pittsburgh Steelers", "San Francisco": "San Francisco 49ers",
  "Seattle": "Seattle Seahawks", "Tampa Bay": "Tampa Bay Buccaneers",
  "Tennessee": "Tennessee Titans", "Washington": "Washington Commanders",
};

const MLB_TEAMS: Record<string, string> = {
  "ARI": "Arizona Diamondbacks", "ATL": "Atlanta Braves", "BAL": "Baltimore Orioles",
  "BOS": "Boston Red Sox", "CHC": "Chicago Cubs", "CHW": "Chicago White Sox",
  "CIN": "Cincinnati Reds", "CLE": "Cleveland Guardians", "COL": "Colorado Rockies",
  "DET": "Detroit Tigers", "HOU": "Houston Astros", "KC": "Kansas City Royals",
  "LAA": "Los Angeles Angels", "LAD": "Los Angeles Dodgers", "MIA": "Miami Marlins",
  "MIL": "Milwaukee Brewers", "MIN": "Minnesota Twins", "NYM": "New York Mets",
  "NYY": "New York Yankees", "OAK": "Oakland Athletics", "PHI": "Philadelphia Phillies",
  "PIT": "Pittsburgh Pirates", "SD": "San Diego Padres", "SF": "San Francisco Giants",
  "SEA": "Seattle Mariners", "STL": "St. Louis Cardinals", "TB": "Tampa Bay Rays",
  "TEX": "Texas Rangers", "TOR": "Toronto Blue Jays", "WAS": "Washington Nationals",
  // City names
  "Arizona": "Arizona Diamondbacks", "Atlanta": "Atlanta Braves", "Baltimore": "Baltimore Orioles",
  "Boston": "Boston Red Sox", "Chicago": "Chicago Cubs", "Cincinnati": "Cincinnati Reds",
  "Cleveland": "Cleveland Guardians", "Colorado": "Colorado Rockies", "Detroit": "Detroit Tigers",
  "Houston": "Houston Astros", "Kansas City": "Kansas City Royals",
  "Los Angeles": "Los Angeles Dodgers", "Miami": "Miami Marlins", "Milwaukee": "Milwaukee Brewers",
  "Minnesota": "Minnesota Twins", "New York": "New York Yankees",
  "Oakland": "Oakland Athletics", "Philadelphia": "Philadelphia Phillies",
  "Pittsburgh": "Pittsburgh Pirates", "San Diego": "San Diego Padres",
  "San Francisco": "San Francisco Giants", "Seattle": "Seattle Mariners",
  "St. Louis": "St. Louis Cardinals", "Tampa Bay": "Tampa Bay Rays",
  "Texas": "Texas Rangers", "Toronto": "Toronto Blue Jays", "Washington": "Washington Nationals",
};

const LEAGUE_TEAMS: Record<string, Record<string, string>> = {
  nhl: NHL_TEAMS,
  nba: NBA_TEAMS,
  nfl: NFL_TEAMS,
  mlb: MLB_TEAMS,
};

/**
 * Resolve a team name/abbreviation to its full name for a given league.
 * Falls back to the raw name if no mapping is found.
 */
export function resolveTeamName(raw: string, league: string): string {
  const map = LEAGUE_TEAMS[league.toLowerCase()];
  if (!map) return raw;
  return map[raw] || raw;
}