// Hawaii Office of Elections text file "summary.txt" (tab-delimited). Format taken from the published 2026 PRIMARY file on 2026-11-03.
// The GENERAL file was still a placeholder ("Information will be posted at a later date."), so the general format is ASSUMED to match the primary.
// The general file's URL is not confirmed: set HI_RESULTS_URL to the summary.txt link shown under "General Election November 3, 2026 > Text Files" at
// https://elections.hawaii.gov/election-results/ once it is posted. Placeholder text is rejected rather than parsed.
export const id='HI';
export const url=process.env.HI_RESULTS_URL||'https://elections.hawaii.gov/wp-content/results/Placeholders/summary.txt';
export async function fetchRaces(fetchImpl=fetch){
  const r=await fetchImpl(url,{headers:{'user-agent':'WOB-Election-Hub/1.0 (+https://wobelectionhub.netlify.app)'},signal:AbortSignal.timeout(8000)});
  if(!r.ok)throw new Error('HI: HTTP '+r.status);
  return parse(await r.text());
}
const strip=s=>String(s||'').replace(/^"|"$/g,'').trim();
export function parse(text){
  const lines=String(text).split(/\r?\n/);
  const hi=lines.findIndex(l=>/^#Contest ID\t/.test(l));
  if(hi<0)throw new Error('HI: summary file not posted or unrecognized format');
  const h=Object.fromEntries(lines[hi].replace(/^#/,'').split('\t').map((n,i)=>[n.trim(),i]));
  for(const k of ['Contest ID','Contest Title','Total Precincts','Counted Precincts','Candidate Name','Total Votes'])if(!(k in h))throw new Error('HI: missing column '+k);
  const races=new Map();
  for(const l of lines.slice(hi+1)){
    if(!l.trim()||l.startsWith('#'))continue;
    const c=l.split('\t');const title=strip(c[h['Contest Title']]);
    const office=/^governor/i.test(title)?'Governor':/^u\.?s\.? senator/i.test(title)?'US Senate':/^u\.?s\.? representative/i.test(title)?'US House':null;
    if(!office)continue;
    const d=/Dist\.?\s+(I{1,3}|IV|V)\b/i.exec(title);const map={I:'1',II:'2'};
    const key=c[h['Contest ID']];
    if(!races.has(key)){const tp=Number(c[h['Total Precincts']]),cp=Number(c[h['Counted Precincts']]);
      races.set(key,{state:'HI',office,district:d?(map[d[1].toUpperCase()]||d[1]):undefined,sourceName:'Hawaii Office of Elections',sourceUrl:'https://elections.hawaii.gov/election-results/',sourceUpdated:null,
        reportingPct:tp>0&&Number.isFinite(cp)?Math.round(cp/tp*10000)/100:null,candidates:[]})}
    const v=Number(c[h['Total Votes']]);
    races.get(key).candidates.push({name:strip(c[h['Candidate Name']]),party:strip(c[h['Candidate Party']])||null,votes:Number.isFinite(v)?v:null,pct:null});
  }
  for(const r of races.values()){const t=r.candidates.reduce((a,x)=>a+(x.votes||0),0);for(const x of r.candidates)x.pct=t>0?Math.round(x.votes/t*10000)/100:0}
  return[...races.values()];
}
