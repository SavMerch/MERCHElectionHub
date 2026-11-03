// Ohio Secretary of State "Ohio Decides" ENR. JSON API observed in the browser on 2026-11-03 (liveresults.ohiosos.gov/Api/v1/Contest/*).
// Undocumented but public and unauthenticated; no CORS header (server-side fetch only). Pre-election it returns 2026 candidates with 0 votes.
export const id='OH';
const BASE='https://liveresults.ohiosos.gov';
export const url=BASE+'/Api/v1/Contest/GetContestDetailsObject';
const CONTESTS=[['Governor and Lieutenant Governor','Governor'],['U.S. Senator','US Senate'],['Representative to Congress','US House']];
export async function fetchRaces(fetchImpl=fetch){
  const ua={'user-agent':'WOB-Election-Hub/1.0 (+https://wobelectionhub.netlify.app)','accept':'application/json'};
  const out=[];
  for(const [name,office] of CONTESTS){
    const r=await fetchImpl(`${url}?contestName=${encodeURIComponent(name)}`,{headers:ua,signal:AbortSignal.timeout(8000)});
    if(!r.ok)throw new Error('OH: HTTP '+r.status+' for '+name);
    out.push(...parse(await r.json(),office));
  }
  return out;
}
export function parse(j,office){
  if(!j||!Array.isArray(j.contestList))throw new Error('OH: unrecognized response shape');
  let pct=null;
  const st=(j.contestStatistics&&j.contestStatistics.allStatistics||[]).find(s=>/Election Day Precincts Reporting/i.test(s.name));
  const m=st&&/\(([\d.]+)%\)/.exec(String(st.value));if(m)pct=Number(m[1]);
  return j.contestList.map(c=>{
    if(!Array.isArray(c.candidatesRunning))throw new Error('OH: no candidates in '+c.name);
    const d=/District\s+(\d+)/i.exec(c.name||'');
    return{state:'OH',office,district:d?d[1]:undefined,sourceName:'Ohio Secretary of State (Ohio Decides)',sourceUrl:BASE+'/',sourceUpdated:null,
      reportingPct:pct, // statewide Election Day precinct %, as published by the source; absentee counts report separately
      candidates:c.candidatesRunning.filter(x=>!x.isWriteIn||x.vCount>0).map(x=>({name:x.primaryCandidate,party:x.candidateParty,votes:x.vCount,pct:x.votePercentageNum}))};
  });
}
