import test from 'node:test';import assert from 'node:assert/strict';
import {parse} from '../netlify/functions/lib/adapters/oh.mjs';
import {validateRace} from '../netlify/functions/lib/normalize.mjs';
// Shape copied from the live Ohio API on 2026-11-03 (pre-polls: all zero).
const gov={contestStatistics:{allStatistics:[{name:'Election Day Precincts Reporting',value:'0 (0%)'}]},contestList:[{name:'Governor and Lieutenant Governor',candidatesRunning:[
 {primaryCandidate:'Amy Acton',candidateParty:'D',isWriteIn:false,vCount:0,votePercentageNum:0},
 {primaryCandidate:'Timothy Grady',candidateParty:'WI',isWriteIn:true,vCount:0,votePercentageNum:0},
 {primaryCandidate:'Vivek Ramaswamy',candidateParty:'R',isWriteIn:false,vCount:0,votePercentageNum:0}]}]};
test('OH governor pre-polls',()=>{const [r]=parse(gov,'Governor');const v=validateRace(r);
 assert.equal(v.candidates.length,2);assert.ok(['pre_election','polls_open'].includes(v.status));assert.equal(v.reportingPct,0)});
test('OH districts and live votes',()=>{const j={contestList:[{name:'Representative to Congress - District 09',candidatesRunning:[{primaryCandidate:'X',candidateParty:'D',vCount:5,votePercentageNum:100}]}]};
 const [r]=parse(j,'US House');assert.equal(r.district,'09');assert.equal(validateRace(r).status,'counting');assert.equal(validateRace(r).reportingPct,null)});
test('OH rejects unknown shape',()=>{assert.throws(()=>parse({x:1},'Governor'))});
