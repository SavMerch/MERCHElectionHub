import test from 'node:test';import assert from 'node:assert/strict';
import {buildResponse} from '../netlify/functions/lib/query.mjs';
import cov from '../data/coverage.json' with {type:'json'};
const J='NV,OH,AL,AK,HI,IL,KS,ME,MD,MA,NE,NH,NM,NY,OK,OR,SD,TN,WI,WY,VI,GU,MP'.split(',');
test('all 23 listed; none claimed VERIFIED LIVE; only inspected ones are READY',()=>{for(const s of J){assert.ok(cov.jurisdictions[s],s);assert.notEqual(cov.jurisdictions[s].status,'VERIFIED LIVE')}
  const ready=J.filter(s=>cov.jurisdictions[s].status==='VERIFIED READY').sort();assert.deepEqual(ready,['NE','NM','NV','OH','SD'])});
test('empty cache: every jurisdiction source_not_configured, no races invented',()=>{
  const r=buildResponse(null,cov);assert.equal(r.count,0);for(const s of J)assert.equal(r.jurisdictions[s].availability,'source_not_configured')});
const latest={checkedAt:'2026-11-03T23:00:00Z',health:{},races:[
 {state:'OH',office:'Governor',status:'counting',reportingPct:null,candidates:[{name:'A',party:'D',votes:10,pct:50},{name:'B',party:'R',votes:10,pct:50}]},
 {state:'NV',office:'Governor',status:'pre_election',candidates:[{name:'C',party:'D',votes:0,pct:0}]}]};
test('filters and availability',()=>{
  const r=buildResponse(latest,cov,{state:'oh',now:new Date('2026-11-03T23:05:00Z')});
  assert.equal(r.count,1);assert.equal(r.races[0].raceId,'2026-OH-GOVERNOR');assert.equal(r.races[0].reportingPercent,null);assert.equal(r.races[0].candidates.every(c=>!c.winner),true);
  assert.equal(r.jurisdictions.OH.availability,'results_available');assert.equal(r.stale,false);
  assert.equal(buildResponse(latest,cov).jurisdictions.NV.availability,'no_results_published')});
test('stale flagged, not hidden',()=>{assert.equal(buildResponse(latest,cov,{now:new Date('2026-11-04T01:00:00Z')}).stale,true)});
