import test from 'node:test';import assert from 'node:assert/strict';
import {parse} from '../netlify/functions/lib/adapters/ca.mjs';
import {validateRace} from '../netlify/functions/lib/normalize.mjs';
const SAMPLE={"raceTitle":"Governor - Statewide Results","Reporting":"0% (0 of 23,860) precincts reporting","ReportingTime":"November 2, 2026, 6:28 p.m.","candidates":[{"Name":"Xavier Becerra","Party":"Dem","Votes":"0","Percent":"0.0","incumbent":false},{"Name":"Steve Hilton","Party":"Rep","Votes":"0","Percent":"0.0","incumbent":false}]};
test('real CA sample parses and validates; no winner implied',()=>{
  const [r]=parse(SAMPLE);assert.equal(r.reportingPct,0);assert.equal(r.sourceUpdated,'November 2, 2026, 6:28 p.m.');
  const v=validateRace(r);assert.deepEqual(v.candidates.map(c=>c.party),['D','R']);assert.ok(['pre_election','polls_open'].includes(v.status));assert.equal(v.call,undefined)});
test('votes and reporting percent are read',()=>{
  const s=structuredClone(SAMPLE);s.Reporting='42.5% (10,000 of 23,860) precincts reporting';s.candidates[0].Votes='1,234,567';s.candidates[0].Percent='55.1';s.candidates[1].Votes='900,000';s.candidates[1].Percent='40.2';
  const v=validateRace(parse(s)[0]);assert.equal(v.reportingPct,42.5);assert.equal(v.candidates[0].votes,1234567);assert.equal(v.status,'counting')});
test('wrong race or shape is rejected',()=>{const s=structuredClone(SAMPLE);s.raceTitle='Controller - Statewide Results';assert.throws(()=>parse(s));assert.throws(()=>parse({x:1}))});
