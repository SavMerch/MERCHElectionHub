import test from 'node:test';import assert from 'node:assert/strict';
import {parse} from '../netlify/functions/lib/adapters/ne.mjs';
const H='RaceID,RaceName,PartyCode,AreaType,AreaNum,OfficeSeqNo,BallotOrder,CandidateID,CandidateName,CurrentDateTime,VoteFor,CandidateVotes,CandidatePercentage,PrecinctsReporting\n';
// Copied from the live NE exports 2026-11-03 (pre-polls).
const t=H+`13165,"For Representative in Congress - 2  Year Term","REP","CG","District 01",103,,3071,"Mike  Flood ",11/3/2026 11:17:55 AM,1,0,0,="0/438",
13165,"For Representative in Congress - 2  Year Term","DEM","CG","District 01",103,,3039,"Chris  Backemeyer ",11/3/2026 11:17:55 AM,1,0,0,="0/438",
13224,"For United States Senator - 6  Year Term","REP","SW","",102,,3012,"Pete  Ricketts ",11/3/2026 11:20:18 AM,1,0,0,="0/1322",
13230,"For Governor and Lt. Governor","REP","SW","",101,,1,"X",11/3/2026 11:20:18 AM,1,0,0,="0/1322",
13231,"For Secretary of State","REP","SW","",110,,2,"Y",11/3/2026 11:20:18 AM,1,0,0,="0/1322",
`;
test('NE offices, district, precincts',()=>{const r=parse(t);assert.deepEqual(r.map(x=>x.office).sort(),['Governor','US House','US Senate']);
  const h=r.find(x=>x.office==='US House');assert.equal(h.district,'1');assert.equal(h.reportingPct,0);assert.equal(h.candidates[0].name,'Mike Flood')});
