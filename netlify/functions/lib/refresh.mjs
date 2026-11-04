import {createHash} from 'node:crypto';
import calls from '../../../data/calls.json' with {type:'json'};
import {ADAPTERS} from './adapters/index.mjs';
import {validateRace,applyCalls} from './normalize.mjs';
import {raceKey} from './linkpull.mjs';

export async function runRefresh({adapters=ADAPTERS,store,now=new Date()}={}){
  store=store||(await import('@netlify/blobs')).getStore('wob');
  const prev=(await store.get('latest',{type:'json'}))||{races:[],health:{}};
  const byKey=new Map(prev.races.filter(r=>!r.stub&&!r.linked).map(r=>[raceKey(r),r]));
  const health={...prev.health};
  for(const a of adapters.filter(x=>x.enabled)){
    const id=a.mod.id;
    try{
      const raw=await a.mod.fetchRaces();
      const errs=[];let n=0;
      for(const r of raw){try{const v=validateRace(r);v.ingestedAt=now.toISOString();delete v.call;byKey.set(raceKey(v),v);n++}catch(e){errs.push((r&&r.state||'?')+': '+e.message)}} // one bad race must not drop the rest
      health[id]={ok:errs.length===0,at:now.toISOString(),races:n,error:errs.length?errs.slice(0,5).join('; ').slice(0,300):null};
    }catch(e){health[id]={ok:false,at:now.toISOString(),error:String(e.message||e).slice(0,200)}} // keep last good data
  }
  const lr=(await store.get('linked-results',{type:'json'}).catch(()=>null))||{};
  for(const rs of Object.values(lr))for(const r of rs){const k=raceKey(r),ex=byKey.get(k);if(ex&&ex.candidates.some(c=>(c.votes||0)>0))continue;byKey.set(k,{...r,ingestedAt:now.toISOString()})} // official feed with votes wins; link fills gaps
  const extra=((await store.get('analyst-calls',{type:'json'}).catch(()=>null))||[]);
  const all=[...extra,...calls];
  for(const c of all){const k=raceKey(c);if(!byKey.has(k)&&/^https:\/\//.test(c.source||'')&&c.winner)byKey.set(k,{state:c.state,office:c.office,district:c.district||null,status:c.status,candidates:[{name:c.winner,party:c.winnerParty,votes:null,pct:null}],stub:true,ingestedAt:now.toISOString()})}
  const races=applyCalls([...byKey.values()],all);
  const out={checkedAt:now.toISOString(),races,health,calls:all.length};
  const hash=createHash('sha256').update(JSON.stringify({races:races.map(({ingestedAt,...r})=>r),health:Object.fromEntries(Object.entries(health).map(([k,v])=>[k,v.ok]))})).digest('hex');
  const changed=hash!==prev.hash;out.hash=hash;
  await store.setJSON('latest',out);
  if(changed)await store.setJSON('history/'+now.toISOString(),out); // snapshot only when data changed
  return{changed,health,checkedAt:out.checkedAt,races:races.length,calls:all.length};
}
