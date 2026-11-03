import {timingSafeEqual} from 'node:crypto';
import {TARGETS,probeOne,formatText} from './lib/probe.mjs';
// /api/probe?token=...[&state=NV][&format=json][&detail=1]  (hardcoded candidate list only; no user-supplied URLs)
export default async(req)=>{
  const q=new URL(req.url).searchParams,t=q.get('token')||'',k=process.env.REFRESH_TOKEN||'';
  const a=Buffer.from(t),b=Buffer.from(k);
  if(!k||a.length!==b.length||!timingSafeEqual(a,b))return new Response('Forbidden',{status:403});
  const st=(q.get('state')||'').toUpperCase();
  const list=TARGETS.filter(x=>!st||x.state===st||x.state==='*'&&st==='*');
  const results=await Promise.all(list.map(x=>probeOne(x)));
  const body=q.get('format')==='json'?JSON.stringify(results,null,1):formatText(results,q.get('detail')==='1'||!!st);
  return new Response(body,{headers:{'content-type':q.get('format')==='json'?'application/json':'text/plain; charset=utf-8','cache-control':'no-store'}});
};
