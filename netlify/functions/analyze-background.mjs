// Background function (15 min). Runs the research and stores the validated result.
import {timingSafeEqual} from 'node:crypto';
import {key,buildPrompt,runAnalysis,assessPrompt,runAssess} from './lib/analyze.mjs';
export default async(req,ctx,deps={})=>{
  const tok=process.env.ANALYZE_TOKEN||process.env.REFRESH_TOKEN||'',h=req.headers.get('x-analyze-token')||'';
  const a=Buffer.from(h),c=Buffer.from(tok);if(!tok||a.length!==c.length||!timingSafeEqual(a,c))return new Response('Forbidden',{status:403});
  const store=deps.store||(await import('@netlify/blobs')).getStore('wob');const b=await req.json();const k=key(b.state,b.tab,b.cand);
  try{const res=b.tab==='Assess'?await runAssess({fetchImpl:deps.fetch||fetch,apiKey:process.env.ANTHROPIC_API_KEY,prompt:assessPrompt({state:b.state,stateName:b.stateName||b.state,known:b.known})}):await runAnalysis({fetchImpl:deps.fetch||fetch,apiKey:process.env.ANTHROPIC_API_KEY,prompt:buildPrompt({state:b.state,stateName:b.stateName||b.state,tab:b.tab,cand:b.candidate||{name:'the '+b.cand+' nominee',party:b.cand},known:b.known})});
    await store.setJSON(k,{...res,status:'done',state:b.state,tab:b.tab,cand:b.cand,finishedAt:Date.now(),generated:b.tab==='Assess'?'Model judgment without web search or sources; may be out of date; not verified by an analyst':'AI-generated from live web search; not verified by an analyst'})}
  catch(e){await store.setJSON(k,{status:'error',state:b.state,tab:b.tab,cand:b.cand,error:String(e.message||e).slice(0,300),finishedAt:Date.now()})}
  return new Response('ok',{status:202})};
