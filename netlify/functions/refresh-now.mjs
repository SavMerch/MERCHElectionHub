import {timingSafeEqual} from 'node:crypto';
import {runRefresh} from './lib/refresh.mjs';
export default async(req)=>{
  const t=new URL(req.url).searchParams.get('token')||'',k=process.env.REFRESH_TOKEN||'';
  const a=Buffer.from(t),b=Buffer.from(k);
  if(!k||a.length!==b.length||!timingSafeEqual(a,b))return new Response('Forbidden',{status:403});
  return new Response(JSON.stringify(await runRefresh()),{headers:{'content-type':'application/json'}});
};
