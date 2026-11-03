import test from 'node:test';import assert from 'node:assert/strict';
import {parse} from '../netlify/functions/lib/adapters/hi.mjs';
// Shape copied from the published 2026 PRIMARY summary.txt (not the general file, which was a placeholder).
const H='#FormatVersion 1\n#Contest ID\tContest Title\tContest Seq Nbr\tContest Type\tContest Party\tMail Blank Votes\tIn-Person Blank Votes\tMail Over Votes\tIn-Person Over Votes\tMail Invalid Votes\tIn-Person Invalid Votes\tRegistered Voters\tTotal Precincts\tCounted Precincts\tCandidate ID\tCandidate Name\tCandidate Seq Nbr\tCandidate Party\tMail Votes\tIn-Person Votes\tTotal Votes\n';
const row=(id,t,cp,n,p,v)=>`${id}\t"${t}"\t1\tOF\tN\t0\t0\t0\t0\t0\t0\t846543\t223\t${cp}\t1\t"${n}"\t1\t${p}\t${v}\t0\t${v}\n`;
test('HI placeholder text is rejected, not parsed',()=>{assert.throws(()=>parse('Information will be posted at a later date.'),/not posted/)});
test('HI parses contests, districts, precinct reporting',()=>{const r=parse(H+row(338,'U.S. Representative, Dist I',111,'A, B','D',300)+row(338,'U.S. Representative, Dist I',111,'C, D','R',100)+row(1,'Governor',111,'E, F','D',5)+row(9,'State Senate, Dist 3',111,'G','D',1));
  assert.equal(r.length,2);const h=r.find(x=>x.office==='US House');assert.equal(h.district,'1');assert.equal(h.reportingPct,49.78);assert.equal(h.candidates[0].pct,75)});
