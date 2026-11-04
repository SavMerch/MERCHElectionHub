import test from 'node:test';import assert from 'node:assert/strict';
import calls,{cleanCall} from '../netlify/functions/calls.mjs';import {runRefresh} from '../netlify/functions/lib/refresh.mjs';
const mem=()=>{const m=new Map();return {m,get:async k=>m.get(k)??null,setJSON:async(k,v)=>{m.set(k,v)}}};
test('cleanCall requires an apnews.com https source',()=>{
  assert.ok(cleanCall({state:'oh',winner:'X',party:'R',source:'https://apnews.com/projects/elections-2026/governor-results/'}));
  for(const src of ['http://apnews.com/x','https://evilapnews.com/x','https://example.com/apnews.com','']) assert.equal(cleanCall({state:'OH',winner:'X',source:src}),null)});
test('call endpoint: forbidden without token, stores call, refresh applies it as a labeled stub',async()=>{
  process.env.REFRESH_TOKEN='t';const st=mem();const mk=(q,b)=>new Request('https://x.test/api/calls?'+q,{method:'POST',body:JSON.stringify(b)});
  assert.equal((await calls(mk('token=no',{}),{},{store:st})).status,403);
  const b={state:'OH',office:'Governor',winner:'Test Winner',party:'R',source:'https://apnews.com/projects/elections-2026/governor-results/'};
  const r=await calls(mk('token=t',b),{},{store:st,refresh:o=>runRefresh({...o,adapters:[]})});assert.equal(r.status,200);
  const latest=st.m.get('latest');const race=latest.races.find(x=>x.state==='OH'&&x.office==='Governor');
  assert.equal(race.call.winner,'Test Winner');assert.match(race.call.calledBy,/AP/);assert.equal(race.call.status,'projected');
  assert.equal((await calls(mk('token=t',{...b,source:'https://example.com'}),{},{store:st})).status,400);
  await calls(mk('token=t',{state:'OH',office:'Governor',remove:true}),{},{store:st,refresh:o=>runRefresh({...o,adapters:[]})});
  assert.equal(st.m.get('latest').races.find(x=>x.state==='OH'),undefined)});
