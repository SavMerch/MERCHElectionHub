// Pure query layer for /.netlify/functions/election-results. Never invents data: a jurisdiction with no race
// in the cache is reported as "source_not_configured" (no adapter) or "no_results_published" (adapter ok, nothing yet).
export const AVAIL=['results_available','no_results_published','source_unavailable','source_not_configured'];
const STALE_MIN=30;
export function raceId(r){return `2026-${r.state}-${String(r.office).toUpperCase().replace(/[^A-Z0-9]+/g,'_')}${r.district?'-'+r.district:''}`}
export function buildResponse(latest,coverage,{state,office,race,now=new Date()}={}){
  latest=latest||{checkedAt:null,races:[],health:{}};
  const cov=(coverage&&coverage.jurisdictions)||{};
  const health=latest.health||{};
  const stale=latest.checkedAt?(+now-+new Date(latest.checkedAt))/60000>STALE_MIN:null;
  const states=new Set([...Object.keys(cov),...latest.races.map(r=>r.state)]);
  const races=latest.races.map(r=>({electionDate:'2026-11-03',jurisdiction:r.state,office:r.office,district:r.district||null,raceId:raceId(r),
    status:r.status,reportingPercent:r.reportingPct??null,lastUpdated:r.sourceUpdated||null,retrievedAt:latest.checkedAt,stale,
    source:{name:r.sourceName||null,url:r.sourceUrl||null,verified:false},
    call:r.call||null,
    candidates:r.candidates.map(c=>({name:c.name,party:c.party,votes:c.votes,percentage:c.pct,winner:!!(r.call&&r.call.winner===c.name)}))}));
  const jurisdictions={};
  for(const s of states){
    const rs=races.filter(r=>r.jurisdiction===s);
    const h=Object.entries(health).find(([k])=>k===s||k==='OA'||k==='CA'&&s==='CA');
    let availability;
    if(rs.some(r=>r.candidates.some(c=>(c.votes||0)>0)))availability='results_available';
    else if(rs.length)availability='no_results_published';
    else if(health[s]&&!health[s].ok)availability='source_unavailable';
    else availability='source_not_configured';
    jurisdictions[s]={availability,coverageStatus:(cov[s]&&cov[s].status)||null,races:rs.length,stale};
  }
  let out=races;
  if(state)out=out.filter(r=>r.jurisdiction===String(state).toUpperCase());
  if(office)out=out.filter(r=>r.office.toLowerCase()===String(office).toLowerCase());
  if(race)out=out.filter(r=>r.raceId===race);
  const js=state?Object.fromEntries(Object.entries(jurisdictions).filter(([k])=>k===String(state).toUpperCase())):jurisdictions;
  return{checkedAt:latest.checkedAt,stale,count:out.length,races:out,jurisdictions:js,sourceHealth:health};
}
