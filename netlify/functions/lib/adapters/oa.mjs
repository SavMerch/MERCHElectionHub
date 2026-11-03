// Open America election-night results (free, no key): https://openamerica.io/elections/api/
// One request returns every governor race in the feeds it carries. Coverage (22 states listed by the provider;
// 15 of them have a 2026 governor race): AR AZ CO CT FL GA IA ID MI MN PA RI SC TX VT. Other states are absent.
// The feed never calls races (it exposes only the vote leader), and its `final` flag means "all precincts in",
// not certified, so this adapter never produces projected/certified/unofficial_final.
// Shape follows the provider's published example; no real 2026 governor payload has been seen yet.
// Attribution required: "official state election offices via Open America (openamerica.io)" and the as_of time.
export const id='OA';
export const url='https://openamerica.io/elections/results.json?year=2026&office=Governor';
const OFFICES=[['Governor','Governor'],['Senate','US Senate'],['House','US House']];
// Verified 2026-11-03 in the browser: all three office endpoints return HTTP 200, api:1, year 2026, CORS *, with races:{} until results flow.
// Governor's per-race shape follows the provider's documented example; Senate/House race shapes have NOT been seen (empty so far), so
// those parsers accept only keys that look like a state (Senate) or state-district (House) and skip everything else.
// One office failing does not drop the others; it throws only if every office fails.
export async function fetchRaces(fetchImpl=fetch){
  const out=[],errs=[];
  for(const [q,label] of OFFICES){
    try{
      const res=await fetchImpl(`https://openamerica.io/elections/results.json?year=2026&office=${q}`,{headers:{accept:'application/json','user-agent':'WOB-Election-Hub/1.0 (election dashboard; contact via site owner)'},signal:AbortSignal.timeout(8000)});
      if(!res.ok)throw new Error('HTTP '+res.status);
      out.push(...parse(await res.json(),q));
    }catch(e){errs.push(label+': '+e.message)}
  }
  if(errs.length===OFFICES.length)throw new Error('OA: '+errs.join('; '));
  return out;
}
export function parse(j,officeQ='Governor'){
  if(!j||typeof j!=='object'||j.api!==1||!j.races||typeof j.races!=='object')throw new Error('OA: unrecognized response shape');
  if(String(j.office||'').toLowerCase()!==officeQ.toLowerCase())throw new Error('OA: wrong office echoed: '+j.office);
  if(Number(j.year)!==2026)throw new Error('OA: wrong year echoed: '+j.year);
  const out=[];
  for(const [key,r] of Object.entries(j.races)){
    const m=officeQ==='House'?/^([A-Z]{2})-(\d+)$/.exec(key):/^([A-Z]{2})$/.exec(key);
    if(!m||!r||!Array.isArray(r.cands))continue; // skip anything that doesn't look like this office's key
    out.push({state:m[1],district:m[2],office:officeQ==='Governor'?'Governor':officeQ==='Senate'?'US Senate':'US House',sourceName:'Official state election offices via Open America (openamerica.io)',
      sourceUrl:'https://openamerica.io/elections/api/',sourceUpdated:j.as_of||null,
      reportingPct:r.pct_in??null,
      candidates:r.cands.map(c=>({name:c.n,party:c.p,votes:c.v,pct:c.pct}))});
  }
  return out;
}
