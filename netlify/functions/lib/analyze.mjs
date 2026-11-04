// "Conduct analysis": live, sourced research via the Anthropic Messages API + web_search tool.
// Output is AI-generated, labeled as such, and every item must cite a URL that the search tool actually returned.
export const TABS={Cabinet:'cabinet prospects and who a new governor would likely keep, replace or appoint',Policy:'policy positions and what they imply for the agencies and local governments',Scenarios:'the transition outlook, timing, priorities, first moves and risks',Advisory:'disaster-recovery and public-sector advisory exposure (see the advisory brief below)',Transition:'transition opportunity scoring (see the scoring brief below)',Assess:'quick transition scoring from model judgment'};
const ADV=`Advisory brief: for this candidate, find what is on the record about FEMA Public Assistance and Hazard Mitigation, HUD CDBG-DR/CDBG-MIT, grant management and compliance, infrastructure and transportation funding, broadband and economic development, state emergency management leadership and readiness, and state procurement and professional-services practices. For each area give (a) verified commitments or statements, labeled "reported", and (b) what it likely means for a disaster-recovery and grants-management advisory firm (new demand, procurement changes, compliance risk, cost-share pressure on local governments), labeled "inference". Also note state-specific context that drives demand: recent disaster declarations, open recovery programs, pending state or local funding changes. Use findings headings that name the area. Put named people in prospects only if a source ties them to these functions.`;
export const key=(s,t,c)=>`analysis/${s}-${t}-${c}`.toLowerCase();
const TRN=`Scoring brief (state-level; do not favor either nominee and make no prediction of who wins): score three components of a Transition Opportunity Index from 0 to 100, where higher means MORE need for transition and advisory support.
- "leg": legislative friction. 0 = legislature firmly controlled by the party of both nominees; 100 = opposing-party supermajority or fragmentation that would block most of a new governor's agenda. Average across the two nominee scenarios.
- "cab": expected cabinet and agency-head turnover. 0 = nearly all appointed heads likely stay; 100 = near-total turnover likely. Use party change, how many agency heads are governor-appointed versus independently elected, Senate-confirmation rules, term limits and precedent from the last transition.
- "agency": agency and program exposure. Use open federal disaster declarations, open FEMA/HUD recovery programs, budget pressure, pending federal funding or procurement changes.
Each score needs a short rationale, a label ("reported" for facts, "inference" for judgment) and at least one source URL. Return JSON: {"summary":string,"scores":{"leg":{"score":number,"rationale":string,"label":string,"sources":[url]},"cab":{...},"agency":{...}},"findings":[...],"gaps":[...]}.`;
export function assessPrompt({state,stateName,known}){return `You are scoring the transition opportunity for ${stateName} (${state}) after the Nov. 3, 2026 governor election, for a government-transition advisory firm. Use your own knowledge and judgment; do NOT search. Be candid about what you are unsure of. Do not predict or claim who wins; score the structure of the situation across both major-party nominees.
Facts supplied by the dashboard (treat as given):\n${known||'(none)'}
Score each component 0-100, where higher means MORE need for transition and advisory support:
- exec: executive turnover (open seat = very high; incumbent running = low).
- party: party-control change (share of the nominees whose party differs from the current governor's).
- leg: legislative friction (opposing-party control or fragmentation versus the nominees).
- cab: expected cabinet and agency-head turnover (appointed vs independently elected heads, confirmation rules, precedent).
- agency: agency and program exposure (disaster recovery, federal grants, budget pressure, procurement).
Return ONLY JSON: {"summary":string,"scores":{"exec":{"score":number,"rationale":string,"confidence":"low"|"medium"|"high"},"party":{...},"leg":{...},"cab":{...},"agency":{...}},"caveats":[string]}. Keep each rationale to two sentences.`}
export function validateAssess(raw){const out={summary:String(raw&&raw.summary||'').slice(0,800),scores:{},caveats:[],unsourced:true,dropped:0};if(!raw||typeof raw.scores!=='object')return out;
  for(const k of ['exec','party','leg','cab','agency']){const x=raw.scores[k]||{},n=Number(x.score);if(Number.isFinite(n)&&n>=0&&n<=100&&x.rationale)out.scores[k]={score:Math.round(n),rationale:String(x.rationale).slice(0,500),label:'inference',confidence:['low','medium','high'].includes(x.confidence)?x.confidence:'low',sources:[]};else out.dropped++}
  out.caveats=(raw.caveats||[]).slice(0,6).map(c=>String(c).slice(0,200));return out}
export async function runAssess({fetchImpl=fetch,apiKey,model=process.env.ANALYZE_MODEL||'claude-sonnet-5-5',prompt}){
  const r=await fetchImpl('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01'},body:JSON.stringify({model,max_tokens:1800,messages:[{role:'user',content:prompt}]})});
  if(!r.ok)throw new Error('Anthropic API '+r.status+': '+(await r.text()).slice(0,300));const j=await r.json();
  const raw=parseJson((j.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('\n'));const out=validateAssess(raw);
  out.diag={searches:0,turns:1,inTokens:(j.usage&&j.usage.input_tokens)||0,outTokens:(j.usage&&j.usage.output_tokens)||0,urlsSeen:0,parsed:!!raw,model};return out}
export function buildPrompt({state,stateName,tab,cand,incumbent,known}){
  return `You are researching the ${new Date().getFullYear()} ${stateName} (${state}) governor's race for a transition-advisory dashboard.
${tab==='Transition'?'Scope: the whole state (both major-party nominees).':'Candidate: '+cand.name+' ('+cand.party+'). Assume, for scenario purposes only, that this candidate wins.'} Do NOT claim or imply that anyone has won or will win.
Topic: ${TABS[tab]||tab}.
Already in the dashboard (verify, extend, or correct; do not repeat verbatim):\n${known||'(nothing)'}
Use web_search. Prefer news outlets, official state sites and campaign sites. Rules:
- Every finding must cite at least one https URL that your searches returned. No source = do not include it.
- Mark each finding label "reported" (a source states it) or "inference" (your reasoning from reported facts).
- Do not invent names. If a role has no identifiable prospect, put it in "gaps".
- Cabinet prospects must be real people tied to the candidate or the role by a cited source, with the basis stated. For the Cabinet tab, these are strong candidates who may be considered (not announced appointees): for each key role give one "likely" plus 2-3 "alternate" candidates, setting rank to "likely", "alternate 1", "alternate 2" or "alternate 3".
${tab==='Advisory'?ADV+'\n':''}${tab==='Transition'?TRN+'\n':''}Keep the whole JSON under 5000 tokens: at most 8 findings, 8 prospects, short sentences. Put the JSON in one block and nothing after it.
Return ONLY JSON: {"summary":string,"findings":[{"heading":string,"text":string,"label":"reported"|"inference","sources":[url]}],"prospects":[{"role":string,"rank":string,"name":string,"basis":string,"label":"reported"|"inference","sources":[url]}],"gaps":[string]}`}
export function collectUrls(content){const s=new Set();const walk=x=>{if(!x||typeof x!=='object')return;if(Array.isArray(x))return x.forEach(walk);if(typeof x.url==='string'&&/^https:\/\//.test(x.url))s.add(x.url);Object.values(x).forEach(walk)};
  for(const b of content||[]){if(b.type==='web_search_tool_result'||b.type==='text')walk(b)}return s}
export function parseJson(text){const m=text.match(/\{[\s\S]*\}/);if(!m)return null;try{return JSON.parse(m[0])}catch(e){return null}}
const nu=u=>{try{const x=new URL(u);x.hash='';['utm_source','utm_medium','utm_campaign','utm_term','utm_content'].forEach(k=>x.searchParams.delete(k));return (x.hostname.replace(/^www\./,'')+x.pathname.replace(/\/+$/,'')+x.search).toLowerCase()}catch(e){return ''}};
export function matchUrl(u,allowed){if(typeof u!=='string'||!/^https:\/\//.test(u))return null;if(allowed.has(u))return u;const n=nu(u);for(const a of allowed)if(nu(a)===n)return a;return null}
export function validate(raw,allowed){const out={summary:String(raw&&raw.summary||'').slice(0,1500),findings:[],prospects:[],gaps:[],dropped:0};if(!raw)return out;
  const ok=a=>[...new Set((Array.isArray(a)?a:[]).map(u=>matchUrl(u,allowed)).filter(Boolean))];
  const lab=l=>l==='reported'?'reported':'inference';
  for(const f of raw.findings||[]){const s=ok(f.sources);if(!s.length||!f.text){out.dropped++;continue}out.findings.push({heading:String(f.heading||'').slice(0,120),text:String(f.text).slice(0,1200),label:lab(f.label),sources:s})}
  for(const p of raw.prospects||[]){const s=ok(p.sources);if(!s.length||!p.name||!p.role){out.dropped++;continue}out.prospects.push({role:String(p.role).slice(0,80),rank:String(p.rank||'').slice(0,20),name:String(p.name).slice(0,80),basis:String(p.basis||'').slice(0,400),label:lab(p.label),sources:s})}
  if(raw.scores&&typeof raw.scores==='object'){out.scores={};for(const k of ['leg','cab','agency']){const x=raw.scores[k]||{},sc=Number(x.score),sr=ok(x.sources);if(Number.isFinite(sc)&&sc>=0&&sc<=100&&sr.length&&x.rationale)out.scores[k]={score:Math.round(sc),rationale:String(x.rationale).slice(0,600),label:lab(x.label),sources:sr};else out.dropped++}}
  out.gaps=(raw.gaps||[]).slice(0,20).map(g=>String(g).slice(0,200));
  if(/\b(has won|was elected|projected winner|will win)\b/i.test(JSON.stringify(out))){return {summary:'',findings:[],prospects:[],gaps:[],dropped:out.dropped+1,rejected:'result-claiming language'}}
  return out}
export async function runAnalysis({fetchImpl=fetch,apiKey,model=process.env.ANALYZE_MODEL||'claude-sonnet-5-5',searchTool=process.env.ANALYZE_SEARCH_TOOL||'web_search_20250305',prompt,maxTurns=6}){
  const messages=[{role:'user',content:prompt}];const urls=new Set();let text='';const diag={turns:0,searches:0,inTokens:0,outTokens:0,stop:null,model};
  const call=async(body)=>{const r=await fetchImpl('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01'},body:JSON.stringify(body)});
    if(!r.ok)throw new Error('Anthropic API '+r.status+': '+(await r.text()).slice(0,300));const j=await r.json();diag.turns++;diag.inTokens+=(j.usage&&j.usage.input_tokens)||0;diag.outTokens+=(j.usage&&j.usage.output_tokens)||0;diag.searches+=(j.usage&&j.usage.server_tool_use&&j.usage.server_tool_use.web_search_requests)||0;diag.stop=j.stop_reason;return j};
  for(let i=0;i<maxTurns;i++){
    const j=await call({model,max_tokens:8000,tools:[{type:searchTool,name:'web_search',max_uses:8}],messages});
    collectUrls(j.content).forEach(u=>urls.add(u));
    const t=(j.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('\n');text=t||text;
    if(j.stop_reason==='pause_turn'){messages.push({role:'assistant',content:j.content});continue}
    break}
  let raw=parseJson(text);
  if(!raw){ // truncated or prose: ask once for JSON only, no tools
    const j=await call({model,max_tokens:6000,messages:[{role:'user',content:prompt+'\n\nHere are your research notes so far:\n'+text.slice(0,12000)+'\n\nNow output ONLY the JSON object described above, using only URLs that appear in the notes.'}]});
    collectUrls(j.content).forEach(u=>urls.add(u));raw=parseJson((j.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('\n'))}
  const out=validate(raw,urls);out.diag={...diag,urlsSeen:urls.size,parsed:!!raw};return out}
export async function selfTest({fetchImpl=fetch,apiKey,model=process.env.ANALYZE_MODEL||'claude-sonnet-5-5',searchTool=process.env.ANALYZE_SEARCH_TOOL||'web_search_20250305'}){
  const r=await fetchImpl('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01'},body:JSON.stringify({model,max_tokens:300,tools:[{type:searchTool,name:'web_search',max_uses:1}],messages:[{role:'user',content:'Search the web for "Kansas governor election 2026" and reply with one sentence.'}]})});
  const t=await r.text();let j=null;try{j=JSON.parse(t)}catch(e){}
  return {ok:r.ok,status:r.status,model,searchTool,searches:j&&j.usage&&j.usage.server_tool_use&&j.usage.server_tool_use.web_search_requests||0,stop:j&&j.stop_reason,error:r.ok?null:t.slice(0,400)}}
