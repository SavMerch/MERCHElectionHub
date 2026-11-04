// POST /api/links?token=…  {state,url}  or {state,refresh:true} or {state,remove:true}  -> starts a pull (background)
// GET  /api/links                       -> saved links and last pull status
import {timingSafeEqual} from 'node:crypto';
const J=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json','cache-control':'no-store'}});
const eq=(a,b)=>{const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y)};
export default async(req,ctx,deps={})=>{
  const store=deps.store||(await import('@netlify/blobs')).getStore('wob');const u=new URL(req.url);
  const links=(await store.get('state-links',{type:'json'}).catch(()=>null))||{};
  if(req.method==='GET')return J({links});
  const tok=process.env.REFRESH_TOKEN||'';if(!tok||!eq(u.searchParams.get('token')||'',tok))return J({error:'forbidden',message:'Missing or wrong refresh token.'},403);
  let b;try{b=await req.json()}catch(e){return J({error:'bad_request'},400)}
  const st=String(b.state||'').toUpperCase();if(!/^[A-Z]{2}$/.test(st))return J({error:'bad_request',message:'state required'},400);
  if(b.remove){delete links[st];await store.setJSON('state-links',links);const lr=(await store.get('linked-results',{type:'json'}).catch(()=>null))||{};delete lr[st];await store.setJSON('linked-results',lr);
    await (deps.refresh?deps.refresh({store}):(await import('./lib/refresh.mjs')).runRefresh({store}));return J({ok:true,links})}
  const url=b.refresh&&links[st]?links[st].url:String(b.url||'').trim();
  if(!/^https:\/\//.test(url))return J({error:'bad_url',message:'Enter a full https:// link.'},400);
  links[st]={url,status:'running',startedAt:Date.now()};await store.setJSON('state-links',links);
  let r;try{r=await (deps.fetch||fetch)((deps.origin||u.origin)+'/.netlify/functions/links-background',{method:'POST',headers:{'content-type':'application/json','x-links-token':tok},body:JSON.stringify({state:st,url})})}catch(e){r=null}
  if(!r||r.status>=300){links[st]={url,status:'error',error:'Could not start the pull job. Check that links-background deployed.',finishedAt:Date.now()};await store.setJSON('state-links',links);return J({error:'start_failed',message:links[st].error},502)}
  return J({status:'running'},202)};
