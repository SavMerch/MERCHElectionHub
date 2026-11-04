// Analyst-entered race calls sourced from AP. POST /api/calls?token=...  GET /api/calls
// A call is stored only with an https apnews.com source URL; the dashboard labels it "AP call, entered by analyst".
import {timingSafeEqual} from 'node:crypto';
import {runRefresh} from './lib/refresh.mjs';
const J=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json','cache-control':'no-store'}});
const eq=(a,b)=>{const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y)};
export function cleanCall(b){const state=String(b.state||'').toUpperCase(),office=String(b.office||'Governor').trim();let host='';try{const u=new URL(b.source);host=u.protocol==='https:'&&(u.hostname==='apnews.com'||u.hostname.endsWith('.apnews.com'))?u.hostname:''}catch(e){}
  if(!/^[A-Z]{2}$/.test(state)||!office||!String(b.winner||'').trim()||!host)return null;
  return {state,office,district:b.district?String(b.district):null,winner:String(b.winner).trim().slice(0,80),winnerParty:String(b.party||'').slice(0,10),status:b.status==='certified'?'certified':'projected',calledBy:'AP (entered by analyst)',source:b.source,calledAt:b.calledAt||new Date().toISOString()}}
export default async(req,ctx,deps={})=>{
  const store=deps.store||(await import('@netlify/blobs')).getStore('wob');
  if(req.method==='GET')return J({calls:(await store.get('analyst-calls',{type:'json'}).catch(()=>null))||[]});
  const tok=process.env.REFRESH_TOKEN||'',t=new URL(req.url).searchParams.get('token')||'';
  if(!tok||!eq(t,tok))return J({error:'forbidden',message:'Missing or wrong refresh token.'},403);
  let b;try{b=await req.json()}catch(e){return J({error:'bad_request'},400)}
  let list=(await store.get('analyst-calls',{type:'json'}).catch(()=>null))||[];
  if(b.remove){list=list.filter(c=>!(c.state===String(b.state).toUpperCase()&&c.office.toLowerCase()===String(b.office||'Governor').toLowerCase()&&String(c.district||'')===String(b.district||'')))}
  else{const c=cleanCall(b);if(!c)return J({error:'bad_call',message:'Need a state, winner and an https apnews.com source URL.'},400);
    list=list.filter(x=>!(x.state===c.state&&x.office.toLowerCase()===c.office.toLowerCase()&&String(x.district||'')===String(c.district||'')));list.push(c)}
  await store.setJSON('analyst-calls',list);
  const out=await (deps.refresh||runRefresh)({store});
  return J({ok:true,calls:list,checkedAt:out.checkedAt})};
