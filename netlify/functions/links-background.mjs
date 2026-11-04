import {timingSafeEqual} from 'node:crypto';
import {pullLink} from './lib/linkpull.mjs';
import {runRefresh} from './lib/refresh.mjs';
export default async(req,ctx,deps={})=>{
  const tok=process.env.REFRESH_TOKEN||'',h=req.headers.get('x-links-token')||'';const a=Buffer.from(h),c=Buffer.from(tok);if(!tok||a.length!==c.length||!timingSafeEqual(a,c))return new Response('Forbidden',{status:403});
  const store=deps.store||(await import('@netlify/blobs')).getStore('wob');const {state,url}=await req.json();
  const links=(await store.get('state-links',{type:'json'}).catch(()=>null))||{};
  try{const out=await (deps.pull||pullLink)({state,url,fetchImpl:deps.fetch||fetch,resolve:deps.resolve,apiKey:process.env.ANTHROPIC_API_KEY});
    const lr=(await store.get('linked-results',{type:'json'}).catch(()=>null))||{};lr[state]=out.races;await store.setJSON('linked-results',lr);
    links[state]={url,status:'done',method:out.method,count:out.races.length,notes:(out.notes||[]).slice(0,5),usage:out.usage||null,finishedAt:Date.now()};await store.setJSON('state-links',links);
    await (deps.refresh||runRefresh)({store})}
  catch(e){links[state]={url,status:'error',error:String(e.message||e).slice(0,400),finishedAt:Date.now()};await store.setJSON('state-links',links)}
  return new Response('ok',{status:202})};
