import test from 'node:test';import assert from 'node:assert/strict';
import {fetchRaces} from '../netlify/functions/lib/adapters/manual.mjs';import {validateRace} from '../netlify/functions/lib/normalize.mjs';
test('VI snapshot validates, sums to the report total, and is never a call',async()=>{
  const rs=await fetchRaces();const r=validateRace(rs.find(x=>x.state==='VI'));
  assert.equal(r.candidates.reduce((a,c)=>a+c.votes,0),18891);assert.equal(r.status,'counting');assert.match(r.sourceUrl,/^https:\/\/vivote\.gov\//);assert.equal(r.call,undefined);
  assert.ok(Math.abs(r.candidates.reduce((a,c)=>a+c.pct,0)-100)<0.1)});
