// California SOS Election Night feed: https://api.sos.ca.gov/returns/governor
// Response shape confirmed from a real sample (2026-11-03):
// {raceTitle,"Reporting":"0% (0 of 23,860) precincts reporting","ReportingTime":"November 2, 2026, 6:28 p.m.",
//  candidates:[{Name,Party:"Dem"|"Rep",Votes:"0",Percent:"0.0",incumbent}]}
// Not yet seen: a response with votes, a final/certified flag, or other parties. Unrecognized shapes throw (never published).
export const id='CA';
export const url='https://api.sos.ca.gov/returns/governor';
export async function fetchRaces(fetchImpl=fetch){
  const res=await fetchImpl(url,{headers:{accept:'application/json'}});
  if(!res.ok)throw new Error('CA feed HTTP '+res.status);
  return parse(await res.json());
}
export function parse(j){
  const root=Array.isArray(j)?j[0]:j;
  if(!root||!Array.isArray(root.candidates))throw new Error('CA: unrecognized response shape');
  if(!/governor/i.test(String(root.raceTitle||'')))throw new Error('CA: not the governor race: '+root.raceTitle);
  const m=/^\s*([\d.]+)\s*%/.exec(String(root.Reporting||''));
  return[{state:'CA',office:'Governor',sourceName:'California Secretary of State',sourceUrl:'https://electionresults.sos.ca.gov/',
    sourceUpdated:root.ReportingTime||null, // raw text from the feed (Pacific time as published); not converted
    reportingPct:m?Number(m[1]):null,
    candidates:root.candidates.map(c=>({name:c.Name,party:c.Party,votes:c.Votes,pct:c.Percent}))}];
}
