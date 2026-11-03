import test from 'node:test';import assert from 'node:assert/strict';
import {parse} from '../netlify/functions/lib/adapters/oa.mjs';
import {validateRace,applyCalls} from '../netlify/functions/lib/normalize.mjs';
import {runRefresh} from '../netlify/functions/lib/refresh.mjs';
// Fixture built from the provider's published example structure (not a real 2026 governor payload).
const F=()=>({api:1,year:2026,office:'Governor',live:true,stale:false,counting:true,final:false,as_of:'2026-11-04T01:00:00+00:00',source:'state',
 counts:{races:2,called:{},not_called:2,reporting:0,with_precincts:2},
 races:{GA:{leader:'D',called:false,winner:'',pct_in:40.5,total:3000,uncontested:false,cands:[{n:'Keisha Lance Bottoms',p:'D',v:1600,pct:53.33,inc:false,w:false,b:''},{n:'Rick Jackson',p:'R',v:1400,pct:46.67,inc:false,w:false,b:''}]},
        MN:{leader:'D',called:false,winner:'',pct_in:null,total:0,uncontested:false,cands:[{n:'Amy Klobuchar',p:'D',v:0,pct:null},{n:'Lisa Demuth',p:'R',v:0,pct:null}]}}});
test('parses governor races keyed by state; leader is not a winner',()=>{
  const r=parse(F());assert.equal(r.length,2);const v=validateRace(r[0]);
  assert.equal(v.state,'GA');assert.equal(v.reportingPct,40.5);assert.equal(v.status,'counting');assert.equal(v.call,undefined);
  assert.match(v.sourceName,/Open America/)});
test('null pct and zero votes validate as not-yet-counting',()=>{const v=validateRace(parse(F())[1]);assert.equal(v.reportingPct,null);assert.ok(['pre_election','polls_open'].includes(v.status));assert.equal(v.candidates[0].pct,null)});
test('final flag never yields unofficial_final or a call',()=>{const f=F();f.final=true;f.races.GA.pct_in=100;const v=validateRace(parse(f)[0]);assert.equal(v.status,'counting');assert.equal(v.call,undefined)});
test('rejects wrong office/year/shape',()=>{let f=F();f.office='House';assert.throws(()=>parse(f));f=F();f.year=2024;assert.throws(()=>parse(f));assert.throws(()=>parse({x:1}))});
test('skips non-state keys (e.g. House-style keys) without failing',()=>{const f=F();f.races['TX-23']={cands:[{n:'x',p:'R',v:1}]};assert.equal(parse(f).length,2)});
test('one bad race does not drop the others; health reports it',async()=>{
  const m=new Map(),store={get:async k=>m.get(k)??null,setJSON:async(k,v)=>m.set(k,JSON.parse(JSON.stringify(v)))};
  const f=F();f.races.GA.cands[0].v=-5; // invalid
  const adapter={enabled:true,mod:{id:'OA',fetchRaces:async()=>parse(f)}};
  const r=await runRefresh({adapters:[adapter],store});const d=m.get('latest');
  assert.deepEqual(d.races.map(x=>x.state),['MN']);assert.equal(d.health.OA.ok,false);assert.match(d.health.OA.error,/GA/)});
test('Senate keys are states, House keys are state-district; other keys skipped',()=>{
  const s={api:1,year:2026,office:'Senate',races:{GA:{cands:[{n:'a',p:'D',v:1,pct:100}]},'GA-X':{cands:[{n:'b',p:'D',v:1}]}}};
  assert.deepEqual(parse(s,'Senate').map(r=>[r.state,r.office,r.district]),[['GA','US Senate',undefined]]);
  const h={api:1,year:2026,office:'House',races:{'TX-23':{cands:[{n:'c',p:'R',v:1,pct:100}]},TX:{cands:[{n:'d',p:'R',v:1}]}}};
  assert.deepEqual(parse(h,'House').map(r=>[r.state,r.office,r.district]),[['TX','US House','23']])});
test('fetchRaces survives one failing office, throws if all fail',async()=>{
  const {fetchRaces}=await import('../netlify/functions/lib/adapters/oa.mjs');
  const ok=o=>({ok:true,json:async()=>({api:1,year:2026,office:o,races:{}})});
  const f1=async u=>/office=Senate/.test(u)?{ok:false,status:500}:ok(/office=(\w+)/.exec(u)[1]);assert.deepEqual(await fetchRaces(f1),[]);
  await assert.rejects(()=>fetchRaces(async()=>({ok:false,status:500})),/OA/)});
