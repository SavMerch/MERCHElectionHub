// Pull election results from a user-supplied link. Deterministic parser first (ENR CSV), then AI extraction with number verification.
import {lookup} from 'node:dns/promises';
import {parseEnrCsv} from './enrcsv.mjs';
import {validateRace} from './normalize.mjs';
const OFFICES=['Governor','US Senate','US House'];
export const dkey=d=>d==null||d===''?'':(/^\d+$/.test(String(d))?String(parseInt(d,10)):String(d).toLowerCase());
export const raceKey=r=>r.state+'|'+r.office+'|'+dkey(r.district);
const privateIp=ip=>/^(10\.|127\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1|fc|fd|fe80)/i.test(ip)||ip==='::';
export async function checkUrl(u,resolve=lookup){let x;try{x=new URL(u)}catch(e){throw new Error('Not a valid URL')}
  if(x.protocol!=='https:')throw new Error('Only https links are allowed');if(x.username||x.password)throw new Error('Links with credentials are not allowed');
  if(/^(localhost|.*\.local|.*\.internal)$/i.test(x.hostname)||/^[\d.]+$/.test(x.hostname)||x.hostname.includes(':'))throw new Error('Host not allowed');
  const a=await resolve(x.hostname,{all:true});if(!a.length||a.some(r=>privateIp(r.address)))throw new Error('Host not allowed');return x}
export async function safeFetch(url,{fetchImpl=fetch,resolve=lookup,maxBytes=8e6,hops=3}={}){let u=url;
  for(let i=0;i<=hops;i++){await checkUrl(u,resolve);const r=await fetchImpl(u,{redirect:'manual',headers:{'user-agent':'MerchAdvisory-ElectionHub/1.0','accept':'text/html,text/csv,application/json,application/pdf,text/plain'},signal:AbortSignal.timeout(20000)});
    if(r.status>=300&&r.status<400&&r.headers.get('location')){u=new URL(r.headers.get('location'),u).href;continue}
    if(!r.ok)throw new Error('The link returned HTTP '+r.status);
    const ct=(r.headers.get('content-type')||'').toLowerCase();if(!/(html|csv|json|plain|pdf|xml)/.test(ct)&&!/\.(csv|pdf|json|txt)(\?|$)/i.test(u))throw new Error('Unsupported content type: '+ct);
    const buf=Buffer.from(await r.arrayBuffer());if(buf.length>maxBytes)throw new Error('File is too large ('+Math.round(buf.length/1e6)+' MB)');return {buf,ct,url:u}}
  throw new Error('Too many redirects')}
export const htmlToText=h=>h.replace(/<(script|style)[\s\S]*?<\/\1>/gi,' ').replace(/<\/(tr|p|div|li|h\d|table)>/gi,'\n').replace(/<\/t[dh]>/gi,' | ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/[ \t]+/g,' ').replace(/\n\s*\n+/g,'\n').trim();
export function numbersIn(text){const s=new Set();for(const m of text.matchAll(/\d[\d,]*/g))s.add(m[0].replace(/,/g,''));return s}
export function extractPrompt(state){return `Extract 2026 general-election results for ${state} from the document. Only these offices: "Governor", "US Senate", "US House" (use "US House" with the district number as a string in "district"; null for statewide). Copy candidate names, parties and vote totals EXACTLY as printed; never compute, round, estimate or infer. Omit anything not shown. Do not state winners. If a figure is missing use null.
Return ONLY JSON: {"asOf":string|null,"races":[{"office":string,"district":string|null,"reportingPct":number|null,"candidates":[{"name":string,"party":string|null,"votes":number|null,"pct":number|null}]}]}. At most 60 races.`}
export function verifyRaces(raw,state,{text,meta,pdf}){const out=[],notes=[];const nums=text?numbersIn(text):null;
  for(const r of (raw&&raw.races)||[]){if(!OFFICES.includes(r.office)){notes.push('skipped office '+r.office);continue}
    let cands=(r.candidates||[]).filter(c=>c&&c.name);
    if(nums)cands=cands.filter(c=>c.votes==null||nums.has(String(Math.round(c.votes))));
    cands=cands.map(c=>({name:c.name,party:c.party,votes:c.votes,pct:null}));
    const tot=cands.reduce((a,c)=>a+(c.votes||0),0);if(tot>0)cands.forEach(c=>{c.pct=c.votes==null?null:Math.round(10000*c.votes/tot)/100});
    if(cands.length<2){notes.push('dropped '+r.office+(r.district?' '+r.district:'')+': fewer than two verified candidates');continue}
    try{const v=validateRace({state,office:r.office,district:r.office==='US House'?(r.district==null?null:String(r.district)):null,reportingPct:typeof r.reportingPct==='number'&&r.reportingPct>=0&&r.reportingPct<=100?r.reportingPct:null,candidates:cands,sourceName:meta.sourceName,sourceUrl:meta.sourceUrl,sourceUpdated:raw.asOf||null,final:false});
      v.linked=true;v.verified=!pdf;v.pctComputed=true;out.push(v)}catch(e){notes.push(e.message)}}
  return {races:out,notes}}
export async function pullLink({state,url,fetchImpl=fetch,resolve,apiKey,model=process.env.ANALYZE_MODEL||'claude-sonnet-5-5'}){
  const f=await safeFetch(url,{fetchImpl,resolve});const meta={state,sourceName:'Analyst-supplied link',sourceUrl:f.url};const isPdf=/pdf/.test(f.ct)||/\.pdf(\?|$)/i.test(f.url);
  if(!isPdf){const text0=f.buf.toString('utf8');
    try{const rs=parseEnrCsv(text0,meta);const races=rs.map(r=>{const v=validateRace({...r,state});v.linked=true;v.verified=true;return v});if(races.length)return {method:'csv-parser',races,notes:[]}}catch(e){}}
  if(!apiKey)throw new Error('This link is not in a format the built-in parser reads, and ANTHROPIC_API_KEY is not set for AI extraction.');
  let content,text=null;
  if(isPdf){content=[{type:'document',source:{type:'base64',media_type:'application/pdf',data:f.buf.toString('base64')}},{type:'text',text:extractPrompt(state)}]}
  else{const raw=f.buf.toString('utf8');text=/html/.test(f.ct)?htmlToText(raw):raw;if(text.length>150000)text=text.slice(0,150000);content=[{type:'text',text:extractPrompt(state)+'\n\nDOCUMENT:\n'+text}]}
  const r=await fetchImpl('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01'},body:JSON.stringify({model,max_tokens:12000,messages:[{role:'user',content}]})});
  if(!r.ok)throw new Error('Anthropic API '+r.status+': '+(await r.text()).slice(0,300));const j=await r.json();
  const t=(j.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('\n');const m=t.match(/\{[\s\S]*\}/);let raw;try{raw=JSON.parse(m&&m[0])}catch(e){throw new Error('Could not read the extraction output (it may have been cut off). Try a smaller page.')}
  const v=verifyRaces(raw,state,{text,meta,pdf:isPdf});if(!v.races.length)throw new Error('No verifiable Governor, Senate or House races found at that link. '+v.notes.slice(0,3).join('; '));
  return {method:isPdf?'ai-pdf (numbers not machine-verified)':'ai-text (numbers verified against page text)',races:v.races,notes:v.notes,usage:j.usage||null}}
