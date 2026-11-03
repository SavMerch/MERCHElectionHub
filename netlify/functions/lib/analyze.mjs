// "Conduct analysis": live, sourced research via the Anthropic Messages API + web_search tool.
// Output is AI-generated, labeled as such, and every item must cite a URL that the search tool actually returned.
export const TABS={Cabinet:'cabinet prospects and who a new governor would likely keep, replace or appoint',Policy:'policy positions and what they imply for the agencies and local governments',Scenarios:'the transition outlook, timing, priorities, first moves and risks'};
export const key=(s,t,c)=>`analysis/${s}-${t}-${c}`.toLowerCase();
export function buildPrompt({state,stateName,tab,cand,incumbent,known}){
  return `You are researching the ${new Date().getFullYear()} ${stateName} (${state}) governor's race for a transition-advisory dashboard.
Candidate: ${cand.name} (${cand.party}). Assume, for scenario purposes only, that this candidate wins. Do NOT claim or imply that anyone has won or will win.
Topic: ${TABS[tab]||tab}.
Already in the dashboard (verify, extend, or correct; do not repeat verbatim):\n${known||'(nothing)'}
Use web_search. Prefer news outlets, official state sites and campaign sites. Rules:
- Every finding must cite at least one https URL that your searches returned. No source = do not include it.
- Mark each finding label "reported" (a source states it) or "inference" (your reasoning from reported facts).
- Do not invent names. If a role has no identifiable prospect, put it in "gaps".
- Cabinet prospects must be real people tied to the candidate or the role by a cited source, with the basis stated.
Return ONLY JSON: {"summary":string,"findings":[{"heading":string,"text":string,"label":"reported"|"inference","sources":[url]}],"prospects":[{"role":string,"name":string,"basis":string,"label":"reported"|"inference","sources":[url]}],"gaps":[string]}`}
export function collectUrls(content){const s=new Set();const walk=x=>{if(!x||typeof x!=='object')return;if(Array.isArray(x))return x.forEach(walk);if(typeof x.url==='string'&&/^https:\/\//.test(x.url))s.add(x.url);Object.values(x).forEach(walk)};
  for(const b of content||[]){if(b.type==='web_search_tool_result'||b.type==='text')walk(b)}return s}
export function parseJson(text){const m=text.match(/\{[\s\S]*\}/);if(!m)return null;try{return JSON.parse(m[0])}catch(e){return null}}
export function validate(raw,allowed){const out={summary:String(raw&&raw.summary||'').slice(0,1500),findings:[],prospects:[],gaps:[],dropped:0};if(!raw)return out;
  const ok=a=>(Array.isArray(a)?a:[]).filter(u=>typeof u==='string'&&allowed.has(u));
  const lab=l=>l==='reported'?'reported':'inference';
  for(const f of raw.findings||[]){const s=ok(f.sources);if(!s.length||!f.text){out.dropped++;continue}out.findings.push({heading:String(f.heading||'').slice(0,120),text:String(f.text).slice(0,1200),label:lab(f.label),sources:s})}
  for(const p of raw.prospects||[]){const s=ok(p.sources);if(!s.length||!p.name||!p.role){out.dropped++;continue}out.prospects.push({role:String(p.role).slice(0,80),name:String(p.name).slice(0,80),basis:String(p.basis||'').slice(0,400),label:lab(p.label),sources:s})}
  out.gaps=(raw.gaps||[]).slice(0,20).map(g=>String(g).slice(0,200));
  if(/\b(has won|was elected|projected winner|will win)\b/i.test(JSON.stringify(out))){return {summary:'',findings:[],prospects:[],gaps:[],dropped:out.dropped+1,rejected:'result-claiming language'}}
  return out}
export async function runAnalysis({fetchImpl=fetch,apiKey,model=process.env.ANALYZE_MODEL||'claude-sonnet-5-5',searchTool=process.env.ANALYZE_SEARCH_TOOL||'web_search_20250305',prompt,maxTurns=5}){
  const messages=[{role:'user',content:prompt}];const urls=new Set();let text='';
  for(let i=0;i<maxTurns;i++){
    const r=await fetchImpl('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01'},
      body:JSON.stringify({model,max_tokens:4000,tools:[{type:searchTool,name:'web_search',max_uses:8}],messages})});
    if(!r.ok)throw new Error('Anthropic API '+r.status+': '+(await r.text()).slice(0,200));
    const j=await r.json();collectUrls(j.content).forEach(u=>urls.add(u));
    text=(j.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('\n');
    if(j.stop_reason==='pause_turn'){messages.push({role:'assistant',content:j.content});continue}
    break}
  return validate(parseJson(text),urls)}
