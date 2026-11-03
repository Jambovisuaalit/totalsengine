import { createHash } from 'node:crypto';
const aliases = Object.freeze({ GS:'GSW', NY:'NYK', SA:'SAS', NO:'NOP', UTAH:'UTA', WSH:'WAS', BRK:'BKN', PHL:'PHI' });
const canonical = code => aliases[code] || code;
const utc = v => typeof v === 'string' && /(?:Z|\+00:00)$/.test(v) && Number.isFinite(Date.parse(v)) ? new Date(v).toISOString() : null;
const sha256 = raw => createHash('sha256').update(raw).digest('hex');
const fail = message => { throw new Error(message); };
const isId = v => /^(0|[1-9]\d{0,15})$/.test(String(v));
export function compareSourceSnapshots(espnRaw, bdlRaw, capturedAtUTC) {
 if (!(espnRaw instanceof Uint8Array) || !(bdlRaw instanceof Uint8Array) ||
     !espnRaw.byteLength || !bdlRaw.byteLength || espnRaw.byteLength > 2000000 || bdlRaw.byteLength > 2000000 || !utc(capturedAtUTC)) fail('INVALID_SOURCE_RECEIPT');
 let espn, bdl;
 try { espn = JSON.parse(Buffer.from(espnRaw).toString('utf8')); bdl = JSON.parse(Buffer.from(bdlRaw).toString('utf8')); }
 catch { fail('INVALID_JSON'); }
 if (!Array.isArray(espn?.events) || !Array.isArray(bdl?.data)) fail('INVALID_SOURCE_SCHEMAS');
 if (bdl?.meta?.next_cursor != null) fail('BDL_PAGINATION_INCOMPLETE');
 const byExactMatch = new Map(), bdlIds = new Set();
 for (const g of bdl.data) {
  if (!isId(g?.id) || !utc(g.datetime) || !g.home_team || !g.visitor_team) fail('INVALID_BDL_GAME');
  const home = g.home_team.abbreviation, away = g.visitor_team.abbreviation;
  if (typeof home !== 'string' || typeof away !== 'string' || home === away) fail('INVALID_BDL_MATCHUP');
  const key = [away,home,utc(g.datetime)].join('|');
  if (byExactMatch.has(key) || bdlIds.has(String(g.id))) fail('AMBIGUOUS_BDL_GAME');
  bdlIds.add(String(g.id)); byExactMatch.set(key, String(g.id));
 }
 const matched=[], unmatchedESPN=[], seenESPN=new Set(), seenMatchups=new Set();
 for (const event of espn.events) {
  const id=event?.id, tipoff=utc(event?.date), competitors=event?.competitions?.[0]?.competitors;
  if (!isId(id) || !tipoff || !Array.isArray(competitors) || competitors.length !== 2) fail('INVALID_ESPN_GAME');
  const home=competitors.find(x=>x.homeAway==='home')?.team?.abbreviation;
  const away=competitors.find(x=>x.homeAway==='away')?.team?.abbreviation;
  if (typeof home !== 'string' || typeof away !== 'string' || !home || !away || home === away) fail('INVALID_ESPN_MATCHUP');
  const key=[canonical(away),canonical(home),tipoff].join('|');
  if (seenESPN.has(String(id)) || seenMatchups.has(key)) fail('AMBIGUOUS_ESPN_GAME');
  seenESPN.add(String(id)); seenMatchups.add(key);
  const bdlId=byExactMatch.get(key);
  if (bdlId) matched.push({espn_game_id:String(id),balldontlie_game_id:bdlId,away:canonical(away),home:canonical(home),scheduled_tipoff_utc:tipoff});
  else unmatchedESPN.push(String(id));
 }
 const used=new Set(matched.map(x=>x.balldontlie_game_id));
 return {status:'LOCAL_CROSS_PROVIDER_MATCH_ONLY',retrieved_at_host_utc:utc(capturedAtUTC),
 espn:{sha256:sha256(espnRaw),bytes:espnRaw.byteLength,games:espn.events.length},
 balldontlie:{sha256:sha256(bdlRaw),bytes:bdlRaw.byteLength,games:bdl.data.length},
 matched_count:matched.length,unmatched_espn_ids:unmatchedESPN,
 unmatched_balldontlie_ids:[...bdlIds].filter(id=>!used.has(id)),
 matched_game:matched.find(x=>x.espn_game_id==='401909922')??matched[0]??null,
 source_publication_time_verified:false,independent_timestamp_verified:false,
 immutable_archive_verified:false,commercial_rights_all_sources_verified:false,
 evaluation_eligible:false,publication_allowed:false,gate_status:'NO_GO'};
}