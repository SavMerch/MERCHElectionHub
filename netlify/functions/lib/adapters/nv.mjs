// Nevada Secretary of State results site (silverstateelection.nv.gov). Static JSON release files, observed in the browser 2026-11-03:
// /results-config.json -> manifest.json -> overview (contests+choices) + per-contest county results. Unauthenticated, no CORS header.
// Pre-polls every county vote is null. Vote percentages are computed from source votes (the feed publishes none); no reporting % is published here.
export const id='NV';
const BASE='https://silverstateelection.nv.gov/';
export const url=BASE+'results-config.json';
const WANT=/^(governor|representative in congress|united states senator)/i;
export async function fetchRaces(fetchImpl=fetch){
  const get=async u=>{const r=await fetchImpl(u,{headers:{'user-agent':'WOB-Election-Hub/1.0 (+https://wobelectionhub.netlify.app)',accept:'application/json'},signal:AbortSignal.timeout(8000)});if(!r.ok)throw new Error('NV: HTTP '+r.status+' '+u);return r.json()};
  const cfg=await get(url);const mUrl=new URL(cfg.manifestUrl,BASE).href;const mf=await get(mUrl);
  const ov=await get(new URL(mf.overview.path,mUrl).href);
  const wanted=ov.contests.filter(c=>WANT.test(c.name));const results={};
  for(const c of wanted){const e=mf.contests.find(x=>x.contestId===c.id);if(e)results[c.id]=await get(new URL(e.results.path,mUrl).href)}
  return parse({manifest:mf,overview:ov,results});
}
export function parse({manifest,overview,results}){
  if(!overview||!Array.isArray(overview.contests))throw new Error('NV: unrecognized overview shape');
  const parties=Object.fromEntries((overview.parties||[]).map(p=>[p.id,p.abbreviation||p.label]));
  const out=[];
  for(const c of overview.contests.filter(c=>WANT.test(c.name))){
    const r=results&&results[c.id];if(!r||!Array.isArray(r.counties))continue;
    const sums={};let any=false;
    for(const co of r.counties)for(const ch of co.choices||[])if(ch.votes!=null){any=true;sums[ch.choiceId]=(sums[ch.choiceId]||0)+Number(ch.votes)}
    const total=Object.values(sums).reduce((a,b)=>a+b,0);
    const g=/governor/i.test(c.name)?'Governor':/senator/i.test(c.name)?'US Senate':'US House';
    const d=/District\s+(\d+)/i.exec(c.name);
    out.push({state:'NV',office:g,district:d?d[1]:undefined,sourceName:'Nevada Secretary of State',sourceUrl:BASE,
      sourceUpdated:(manifest&&manifest.generatedAtUtc)||null,reportingPct:null,
      candidates:c.choices.filter(x=>x.kind==='Candidate').map(x=>{const v=any?(sums[x.id]||0):null;
        return{name:x.candidate?x.candidate.displayName:x.label,party:parties[x.candidate&&x.candidate.partyId]||null,votes:v,pct:any&&total>0?Math.round(v/total*10000)/100:(any?0:null)}})});
  }
  return out;
}
