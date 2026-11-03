// Source-discovery probe. Runs from Netlify's network (the build sandbox has no outbound access to state sites).
// It does NOT assert that anything is verified: it reports HTTP status, content type, vendor hints and data links so a human
// (or the next adapter) can decide. URLs below are CANDIDATES from general knowledge, not confirmed endpoints.
const OFFICIAL={
 AL:['https://www.sos.alabama.gov/alabama-votes/election-results'],
 AK:['https://www.elections.alaska.gov/results/','https://www.elections.alaska.gov/results/26GENR/'],
 HI:['https://elections.hawaii.gov/election-results/'],
 IL:['https://elections.il.gov/'],
 KS:['https://www.sos.ks.gov/elections/'],
 ME:['https://www.maine.gov/sos/cec/elec/results/index.html'],
 MD:['https://elections.maryland.gov/'],
 MA:['https://electionstats.state.ma.us/'],
 NE:['https://electionresults.nebraska.gov/','https://sos.nebraska.gov/elections'],
 NV:['https://silverstateelection.nv.gov/'],
 NH:['https://nh.electionstats.com/','https://www.sos.nh.gov/elections'],
 NM:['https://electionresults.sos.nm.gov/'],
 NY:['https://www.elections.ny.gov/'],
 OH:['https://liveresults.ohiosos.gov/'],
 OK:['https://results.okelections.us/'],
 OR:['https://results.oregonvotes.gov/'],
 SD:['https://electionresults.sd.gov/'],
 TN:['https://tnelectionresults.tn.gov/','https://sos.tn.gov/elections'],
 WI:['https://elections.wi.gov/elections-voting/results'],
 WY:['https://wyoelections.wyo.gov/','https://sos.wyo.gov/Elections/'],
 VI:['https://vivote.gov/'],
 GU:['https://gec.guam.gov/'],
 MP:['https://www.votecnmi.gov.mp/'],
};
const STATES=Object.keys(OFFICIAL);
export const TARGETS=[
 ...STATES.flatMap(s=>OFFICIAL[s].map((url,i)=>({state:s,kind:i?'official-alt':'official',url}))),
 ...STATES.filter(s=>!['VI','GU','MP'].includes(s)).map(s=>({state:s,kind:'clarity-pattern',url:`https://results.enr.clarityelections.com/${s}/`})),
 ...['Governor','Senate','House'].map(o=>({state:'*',kind:'open-america',url:`https://openamerica.io/elections/results.json?year=2026&office=${o}`})),
 {state:'*',kind:'civicapi',url:'https://civicapi.org/api/v2/'},
];
const VENDORS=[['Clarity/Civix',/clarityelections|civixsystems/i],['Scytl',/scytl/i],['ElectionStats',/electionstats/i],['Enhanced Voting',/enhancedvoting/i],['ArcGIS',/arcgis|esri\.com/i],['Tableau',/tableau/i],['PowerBI',/powerbi/i],['Hart/Verity',/hartintercivic|verity/i],['Dominion',/dominionvoting|democracysuite/i],['JS single-page app',/ng-version|__NEXT_DATA__|id=["']root["']|id=["']app["']/i],['WordPress',/wp-content/i],['Drupal',/drupal/i]];
export const vendorHints=(t)=>VENDORS.filter(([,r])=>r.test(t)).map(([n])=>n);
export function dataLinks(text,base){
  const set=new Set();const re=/(?:https?:\/\/|\/)[^"'\s<>()\\]+?\.(?:json|csv|xml|txt|zip|xlsx?)(?:\?[^"'\s<>()\\]*)?/gi;let m;
  while((m=re.exec(text))&&set.size<25){try{set.add(new URL(m[0],base).href)}catch(e){}}
  return[...set];
}
export function analyze(t,status,headers,text){
  const ct=(headers.get?headers.get('content-type'):headers['content-type'])||'';
  const r={state:t.state,kind:t.kind,url:t.url,status,contentType:ct.split(';')[0],bytes:text.length};
  if(/json/i.test(ct)||/^\s*[\[{]/.test(text)){try{const j=JSON.parse(text);r.format='json';r.jsonKeys=Object.keys(Array.isArray(j)?(j[0]||{}):j).slice(0,12)}catch(e){r.format='json-unparseable'}}
  else if(/csv/i.test(ct))r.format='csv',r.firstLine=text.split('\n')[0].slice(0,160);
  else if(/xml/i.test(ct))r.format='xml';
  else r.format=/html/i.test(ct)||/<html/i.test(text)?'html':'other';
  r.vendors=vendorHints(text);r.dataLinks=dataLinks(text,t.url);
  r.mentions2026=/2026/.test(text);
  r.snippet=text.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,200);
  return r;
}
export async function probeOne(t,fetchImpl=fetch,timeoutMs=6000){
  const t0=Date.now();
  try{
    const res=await fetchImpl(t.url,{redirect:'follow',signal:AbortSignal.timeout(timeoutMs),headers:{'user-agent':'WOB-Election-Hub-probe/1.0','accept':'application/json,text/html,*/*'}});
    const text=(await res.text()).slice(0,400000);
    const r=analyze(t,res.status,res.headers,text);r.finalUrl=res.url;r.cors=res.headers.get('access-control-allow-origin')||null;r.ms=Date.now()-t0;return r;
  }catch(e){return{state:t.state,kind:t.kind,url:t.url,status:0,error:String(e.name==='TimeoutError'?'timeout':e.message).slice(0,120),ms:Date.now()-t0}}
}
export const classify=r=>r.status===0?'UNREACHABLE':r.status>=400?'HTTP '+r.status:(r.format==='json'||r.format==='csv'||r.format==='xml')?'DATA ENDPOINT RESPONDS (check content)':'PAGE ONLY (find data source)';
export function formatText(results,detail=false){
  return results.map(r=>{
    const head=`${r.state} | ${r.kind} | ${classify(r)} | ${r.contentType||'-'} | vendors:${(r.vendors||[]).join(',')||'-'} | links:${(r.dataLinks||[]).length} | 2026:${r.mentions2026?'y':'n'} | ${r.url}${r.error?' | '+r.error:''}`;
    return detail?head+'\n   '+JSON.stringify({finalUrl:r.finalUrl,cors:r.cors,jsonKeys:r.jsonKeys,firstLine:r.firstLine,links:r.dataLinks,snippet:r.snippet}):head;
  }).join('\n');
}
