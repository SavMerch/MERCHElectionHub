// Shared parser for the "ENR" Media CSV export used by NM and SD (same vendor platform; /resultsCSV.aspx). Header-driven, rejects anything else.
export function csvRows(text){
  const rows=[];let row=[],f='',q=false;
  for(let i=0;i<text.length;i++){const c=text[i];
    if(q){if(c==='"'){if(text[i+1]==='"'){f+='"';i++}else q=false}else f+=c}
    else if(c==='"')q=true;else if(c===','){row.push(f);f=''}
    else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(f);f='';if(row.some(x=>x!==''))rows.push(row);row=[]}
    else f+=c}
  if(f!==''||row.length){row.push(f);rows.push(row)}
  return rows;
}
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
export function parseEnrCsv(text,{state,sourceName,sourceUrl}){
  const rows=csvRows(String(text));
  if(!rows.length||rows[0][0]!=='RaceID'||!rows[0].includes('CandidateVotes'))throw new Error(state+': unrecognized CSV header');
  const h=Object.fromEntries(rows[0].map((n,i)=>[n,i]));
  const races=new Map();
  for(const r of rows.slice(1)){
    const name=clean(r[h.RaceName]);
    const office=/^(for )?governor/i.test(name)?'Governor':/^(for )?united states senator/i.test(name)?'US Senate':/^(for )?(united states representative|representative in congress)/i.test(name)?'US House':null;
    if(!office)continue;
    const d=/DISTRICT\s+0*(\d+)/i.exec(r[h.AreaNum]||'');
    const key=r[h.RaceID];
    if(!races.has(key)){
      const m=/(\d+)\s*\/\s*(\d+)/.exec(r[h.PrecinctsReporting]||'');
      const t=h.CurrentDateTime!=null?clean(r[h.CurrentDateTime]):'';
      races.set(key,{state,office,district:d?d[1]:undefined,sourceName,sourceUrl,sourceUpdated:t||null,
        reportingPct:m&&Number(m[2])>0?Math.round(Number(m[1])/Number(m[2])*10000)/100:null,candidates:[]})}
    const v=Number(r[h.CandidateVotes]);
    races.get(key).candidates.push({name:clean(r[h.CandidateName]),party:clean(r[h.PartyCode])||null,votes:Number.isFinite(v)?v:null,pct:null});
  }
  for(const race of races.values()){const tot=race.candidates.reduce((a,c)=>a+(c.votes||0),0);
    for(const c of race.candidates)c.pct=tot>0?Math.round(c.votes/tot*10000)/100:0}
  return[...races.values()];
}
export async function fetchCsvTypes(base,types,state,meta,fetchImpl=fetch){
  const out=[];
  for(const tt of types){
    const [t,map]=Array.isArray(tt)?tt:[tt,'CTY'];
    const r=await fetchImpl(`${base}resultsCSV.aspx?text=All&type=${t}&map=${map}`,{headers:{'user-agent':'WOB-Election-Hub/1.0 (+https://wobelectionhub.netlify.app)'},signal:AbortSignal.timeout(8000)});
    if(!r.ok)throw new Error(state+': HTTP '+r.status);
    out.push(...parseEnrCsv(await r.text(),meta));
  }
  return out;
}
