// POST /api/analyze?token=…  body {state,tab,cand}  -> starts a background research job (or returns a fresh cached result)
// GET  /api/analyze?state=&tab=&cand=               -> reads the stored result/status
import {timingSafeEqual} from 'node:crypto';
import {key,TABS,selfTest} from './lib/analyze.mjs';
const J=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json','cache-control':'no-store'}});
const eq=(a,b)=>{const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y)};
export const TTL=6*3600e3;
export default async(req,ctx,deps={})=>{
  const store=deps.store||(await import('@netlify/blobs')).getStore('wob');const u=new URL(req.url);
  if(req.method==='GET'&&u.searchParams.get('diag')){const tk=process.env.ANALYZE_TOKEN||process.env.REFRESH_TOKEN||'';if(!process.env.ANTHROPIC_API_KEY)return J({ok:false,error:'ANTHROPIC_API_KEY is not set (or the site was not redeployed after adding it).'});
    if(!tk||!eq(u.searchParams.get('token')||'',tk))return J({error:'forbidden'},403);return J(await selfTest({fetchImpl:deps.fetch||fetch,apiKey:process.env.ANTHROPIC_API_KEY}))}
  if(req.method==='GET'){const k=key(u.searchParams.get('state')||'',u.searchParams.get('tab')||'',u.searchParams.get('cand')||'');
    return J({configured:!!process.env.ANTHROPIC_API_KEY,result:await store.get(k,{type:'json'}).catch(()=>null)})}
  if(!process.env.ANTHROPIC_API_KEY)return J({error:'not_configured',message:'Set ANTHROPIC_API_KEY in Netlify to enable live analysis.'},503);
  const tok=process.env.ANALYZE_TOKEN||process.env.REFRESH_TOKEN||'';
  if(!tok||!eq(u.searchParams.get('token')||'',tok))return J({error:'forbidden',message:'Missing or wrong access token.'},403);
  let b;try{b=await req.json()}catch(e){return J({error:'bad_request'},400)}
  const state=String(b.state||'').toUpperCase(),tab=String(b.tab||''),cand=String(b.cand||'');
  if(!/^[A-Z]{2}$/.test(state)||!TABS[tab]||!/^[RDX]$/.test(cand))return J({error:'bad_request',message:'state, tab (Cabinet|Policy|Scenarios) and cand (R|D|X) required'},400);
  const k=key(state,tab,cand),prev=await store.get(k,{type:'json'}).catch(()=>null);
  if(prev&&prev.status==='running'&&Date.now()-prev.startedAt<10*60e3)return J({status:'running'},202);
  if(prev&&prev.status==='done'&&!b.force&&Date.now()-prev.finishedAt<TTL)return J({status:'done',cached:true,result:prev});
  const day='analysis-count/'+new Date().toISOString().slice(0,10),n=(await store.get(day,{type:'json'}).catch(()=>0))||0,max=+(process.env.ANALYZE_DAILY_MAX||20);
  if(n>=max)return J({error:'daily_cap',message:`Daily analysis limit (${max}) reached.`},429);
  await store.setJSON(day,n+1);
  await store.setJSON(k,{status:'running',startedAt:Date.now(),state,tab,cand});
  const bg=(deps.origin||u.origin)+'/.netlify/functions/analyze-background';
  let bgr;try{bgr=await (deps.fetch||fetch)(bg,{method:'POST',headers:{'content-type':'application/json','x-analyze-token':tok},body:JSON.stringify({state,tab,cand,known:String(b.known||'').slice(0,3000),candidate:b.candidate,stateName:b.stateName})})}catch(e){bgr=null}
  if(!bgr||bgr.status>=300){const m='Could not start the background job'+(bgr?' (HTTP '+bgr.status+')':'')+'. Check that analyze-background deployed (Netlify > Functions).';await store.setJSON(k,{status:'error',error:m,finishedAt:Date.now()});return J({error:'start_failed',message:m},502)}
  return J({status:'running'},202)};
