import test from 'node:test';import assert from 'node:assert/strict';
import {parse} from '../netlify/functions/lib/adapters/sd.mjs';
import {validateRace} from '../netlify/functions/lib/normalize.mjs';
const H='RaceID,RaceName,PartyCode,AreaType,AreaNum,OfficeSeqNo,BallotOrder,CandidateID,CandidateName,CurrentDateTime,VoteFor,CandidateVotes,CandidatePercentage,PrecinctsReporting\n';
// Copied from the live SD export 2026-11-03 (pre-polls).
const pre=H+`14412,"United States Senator","REP","","",110,,24967,"Mike  Rounds ",11/3/2026 5:15:23 PM,1,0,0,="0/671",
14412,"United States Senator","IND","","",110,,24887,"Brian L Bengs ",11/3/2026 5:15:23 PM,1,0,0,="0/671",
14869,"United States Representative","REP","","",120,,24968,"Marty  Jackley ",11/3/2026 5:15:23 PM,1,0,0,="0/671",
14896,"Governor and Lieutenant Governor","REP","","",205,,25561,"Larry Rhoden and Tony Venhuizen ",11/3/2026 5:15:23 PM,1,0,0,="0/671",
14441,"Secretary of State","REP","","",210,,25540,"Heather  Baxter ",11/3/2026 5:15:23 PM,1,0,0,="0/671",
`;
test('SD pre-polls: wrapped precinct cell, whitespace cleaned, other offices skipped',()=>{const r=parse(pre);assert.equal(r.length,3);
  const s=r.find(x=>x.office==='US Senate');assert.equal(s.candidates[0].name,'Mike Rounds');assert.equal(s.reportingPct,0);assert.equal(s.sourceUpdated,'11/3/2026 5:15:23 PM');
  assert.equal(validateRace(s).candidates[1].party,'O')});
test('SD header-only file (FED type) yields no races',()=>{assert.deepEqual(parse(H),[])});
