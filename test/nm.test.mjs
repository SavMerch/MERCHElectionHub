import test from 'node:test';import assert from 'node:assert/strict';
import {parse} from '../netlify/functions/lib/adapters/nm.mjs';
import {validateRace} from '../netlify/functions/lib/normalize.mjs';
// Copied from the live NM export on 2026-11-03 (pre-polls).
const H='RaceID,RaceName,PartyCode,AreaNum,CandidateID,CandidateName,VoteFor,CandidateVotes,CandidatePercentage,PrecinctsReporting,CandidateAbsenteeVotes,CandidateElectionDayVotes,CandidateEarlyVotes\n';
const pre=H+`11185,"United States Senator","REP","",19608,"LARRY E MARKER",1,0,0,0/2204,,,,
11185,"United States Senator","DEM","",19607,"BEN R LUJAN",1,0,0,0/2204,,,,
11186,"United States Representative","DEM","DISTRICT 1",19610,"MELANIE ANN STANSBURY",1,0,0,0/778,,,,
11530,"Governor and Lieutenant Governor","DEM","",20140,"DEB HAALAND AND STEPHANIE GARCIA RICHARD",1,0,0,0/2204,,,,
1375,"Constitutional Amendment 1: Proposing, a comma",""," ",9001,"Yes",1,0,0,0/2204,,,,
`;
test('NM pre-polls: offices, district, zero votes, quoted commas ignored',()=>{const r=parse(pre);assert.equal(r.length,3);
  assert.deepEqual(r.map(x=>x.office).sort(),['Governor','US House','US Senate']);assert.equal(r.find(x=>x.office==='US House').district,'1');
  const v=validateRace(r.find(x=>x.office==='US Senate'));assert.equal(v.reportingPct,0);assert.equal(v.candidates[0].party,'R')});
test('NM live votes',()=>{const t=H+`1,"United States Senator","DEM","",1,"A",1,300,0,50/100,,,,\n1,"United States Senator","REP","",2,"B",1,100,0,50/100,,,,\n`;
  const [r]=parse(t);assert.equal(r.reportingPct,50);assert.equal(r.candidates[0].pct,75);assert.equal(validateRace(r).status,'counting')});
test('NM rejects HTML/unknown',()=>{assert.throws(()=>parse('<html>error</html>'))});
