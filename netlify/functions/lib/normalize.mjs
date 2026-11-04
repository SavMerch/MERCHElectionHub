export const STATUSES=['pre_election','polls_open','counting','projected','unofficial_final','certified'];
const PARTY={republican:'R',rep:'R',gop:'R',r:'R',democratic:'D',democrat:'D',dem:'D',d:'D'};
export const party=p=>PARTY[String(p||'').trim().toLowerCase()]||(p?'O':null);
const num=v=>{if(v==null||v==='')return null;const n=Number(String(v).replace(/,/g,''));return Number.isFinite(n)?n:NaN};
export function normCandidate(c){
  const votes=num(c.votes),pct=num(c.pct);
  if(!c.name||typeof c.name!=='string')throw new Error('candidate missing name');
  if(Number.isNaN(votes)||(votes!=null&&votes<0))throw new Error('bad votes for '+c.name);
  if(Number.isNaN(pct)||(pct!=null&&(pct<0||pct>100)))throw new Error('bad pct for '+c.name);
  return{name:c.name.trim(),party:party(c.party),votes,pct};
}
// Status is derived conservatively. "projected"/"certified" ONLY come from a sourced call (see applyCalls).
export function deriveStatus({candidates,reportingPct,final},now=new Date(),electionDay='2026-11-03T12:00:00Z'){
  const any=candidates.some(c=>(c.votes||0)>0);
  if(!any)return +now<+new Date(electionDay)?'pre_election':'polls_open';
  return final===true&&reportingPct>=100?'unofficial_final':'counting';
}
export function validateRace(r){
  if(!/^[A-Z]{2}$/.test(r.state))throw new Error('bad state');
  if(!r.office)throw new Error('missing office');
  if(!Array.isArray(r.candidates)||!r.candidates.length)throw new Error('no candidates');
  const c=r.candidates.map(normCandidate);
  const rp=num(r.reportingPct);if(Number.isNaN(rp)||(rp!=null&&(rp<0||rp>100)))throw new Error('bad reportingPct');
  const out={state:r.state,office:r.office,district:r.district||null,candidates:c,reportingPct:rp,sourceName:r.sourceName||null,sourceUrl:r.sourceUrl||null,sourceUpdated:r.sourceUpdated||null};
  out.status=deriveStatus({candidates:c,reportingPct:rp,final:r.final});
  return out;
}
// Manual, sourced calls (data/calls.json). A call without an https source is ignored.
export function applyCalls(races,calls){
  for(const r of races){
    const dk=d=>d==null||d===''?'':String(parseInt(d,10)||d).toLowerCase();const c=(calls||[]).find(x=>x.state===r.state&&String(x.office).toLowerCase()===r.office.toLowerCase()&&dk(x.district)===dk(r.district));
    if(!c||!/^https:\/\//.test(c.source||'')||!['projected','certified'].includes(c.status)||!c.winner)continue;
    r.call={winner:c.winner,winnerParty:party(c.winnerParty),status:c.status,calledBy:c.calledBy||null,source:c.source,calledAt:c.calledAt||null};
    r.status=c.status;
  }
  return races;
}
