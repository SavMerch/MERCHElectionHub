import test from 'node:test';import assert from 'node:assert/strict';
import {runRefresh} from '../netlify/functions/lib/refresh.mjs';
const mem=()=>{const m=new Map();return{m,get:async k=>m.get(k)??null,setJSON:async(k,v)=>m.set(k,JSON.parse(JSON.stringify(v)))}};
const ok={enabled:true,mod:{id:'XX',fetchRaces:async()=>[{state:'CA',office:'Governor',candidates:[{name:'A',party:'D',votes:5,pct:50},{name:'B',party:'R',votes:5,pct:50}],reportingPct:10}]}};
const bad={enabled:true,mod:{id:'XX',fetchRaces:async()=>{throw new Error('boom')}}};
test('persists, snapshots on change only, survives failure keeping last good data',async()=>{
  const s=mem();let r=await runRefresh({adapters:[ok],store:s});assert.ok(r.changed);
  assert.equal([...s.m.keys()].filter(k=>k.startsWith('history/')).length,1);
  r=await runRefresh({adapters:[ok],store:s,now:new Date(Date.now()+1000)});assert.ok(!r.changed);
  r=await runRefresh({adapters:[bad],store:s});const d=s.m.get('latest');
  assert.equal(d.races.length,1);assert.equal(d.health.XX.ok,false);});
