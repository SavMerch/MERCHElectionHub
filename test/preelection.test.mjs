import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const D=JSON.parse(readFileSync('data/preelection.json','utf8'));
const html=readFileSync('site/index.html','utf8');
const J=/const J=`([^`]+)`/.exec(html)[1].split('|').map(r=>r.split(','));
test('page script parses',()=>{new Function(html.split('<script>')[1].split('</script>')[0])});
test('36 races, one per state, matching the registry governor flags',()=>{
  assert.equal(D.races.length,39);assert.equal(new Set(D.races.map(r=>r.state)).size,39);
  const reg=J.filter(a=>a[3]==='1').map(a=>a[0]).sort();assert.deepEqual(D.races.map(r=>r.state).sort(),reg)});
test('open-seat flags match registry',()=>{for(const r of D.races){const a=J.find(x=>x[0]===r.state);assert.equal(a[4]==='1',r.openSeat,r.state)}});
test('every race has two nominees; polling is sourced and sane',()=>{
  for(const r of D.races){const T=['VI','GU','MP'].includes(r.state);if(!T)assert.equal(r.candidates.length,2);else assert.ok(r.candidates.length>=2&&r.ticketNote&&r.sources.every(u=>/^https:\/\//.test(u)));for(const c of r.candidates)assert.ok(c.name&&['D','R','O'].includes(c.party)&&(T||c.party!=='O'));
    if(r.polling){assert.match(r.polling.url,/^https:\/\//);assert.ok(r.polling.asOf);const s=r.polling.avg.reduce((a,b)=>a+b.pct,0);assert.ok(s>60&&s<=101,r.state+' '+s);assert.ok(r.polling.polls.length>=1)}}});
test('stale polling is flagged',()=>{assert.ok(D.races.find(r=>r.state==='FL').polling.stale)});
test('outlook tiers recompute from polling and respect thresholds/staleness',()=>{
  const today=new Date(D.asOf);
  for(const r of D.races){const o=r.outlook;assert.ok(o,r.state);
    if(!r.polling||o.tier==='limited'){assert.ok(['none','limited'].includes(o.tier),r.state);continue}
    const a=[...r.polling.avg].sort((x,y)=>y.pct-x.pct),m=Math.round((a[0].pct-a[1].pct)*10)/10;
    const age=Math.round((today-new Date(r.polling.asOf))/864e5);
    const want=(age>60||r.polling.stale)?'stale':m>=10?'strong':m>=5?'lean':'tossup';
    assert.equal(o.tier,want,r.state+' margin '+m+' age '+age);
    if(o.tier==='strong')assert.ok(o.margin>=10&&o.leader===a[0].name)}});
test('no outlook text claims a winner or probability',()=>{for(const r of D.races){const s=JSON.stringify(r.outlook||{});assert.doesNotMatch(s,/will win|projected winner|probab/i,r.state)}});
test('research files: published ones carry sources; none list unsourced cabinet prospects',()=>{
  import('node:fs').then(()=>{});
  const fs=readFileSync;const idx=JSON.parse(fs('research/index.json','utf8')).states;
  for(const s of idx){const r=JSON.parse(fs('research/'+s+'.json','utf8'));for(const n of r.nominees)assert.ok(n.sources&&n.sources.every(u=>/^https:\/\//.test(u)),s+' '+n.name);
    const lists=[...Object.values(r.cabinet||{}),...r.nominees.flatMap(n=>Object.values(n.cabinet||{}))];for(const list of lists)for(const p of list)assert.ok(p.kind==='analyst'?(p.why&&p.why.length>20&&(p.sources||[]).every(u=>/^https:\/\//.test(u))):(p.sources&&p.sources.length&&p.sources.every(u=>/^https:\/\//.test(u))),s+' prospect needs https sources (or kind analyst with a stated basis)');
    for(const n of r.nominees)for(const x of n.positions||[])assert.ok(x.stance&&x.sources&&x.sources.length&&x.sources.every(u=>/^https:\/\//.test(u)),s+' position needs sources')}});
test('scenario analyses are labeled, sourced and never claim a result',()=>{
  const fs=readFileSync;const idx=JSON.parse(fs('research/index.json','utf8')).states;let n=0;
  for(const s of idx){const r=JSON.parse(fs('research/'+s+'.json','utf8'));for(const x of r.nominees)if(x.analysis){n++;const a=x.analysis;
    assert.match(a.assumption,/^Scenario: assumes .* wins/,s);assert.match(a.assumption,/Not a call/,s);
    assert.ok(a.sources.length&&a.sources.every(u=>/^https:\/\//.test(u)),s);
    assert.doesNotMatch(JSON.stringify(a),/has won|was elected|projected winner|will win/i,s)}}
  assert.ok(n>=3)});
