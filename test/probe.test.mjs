import test from 'node:test';import assert from 'node:assert/strict';
import {TARGETS,analyze,dataLinks,vendorHints,probeOne,classify,formatText} from '../netlify/functions/lib/probe.mjs';
const J='NV,OH,AL,AK,HI,IL,KS,ME,MD,MA,NE,NH,NM,NY,OK,OR,SD,TN,WI,WY,VI,GU,MP'.split(',');
test('every one of the 23 jurisdictions has at least one candidate target',()=>{for(const s of J)assert.ok(TARGETS.some(t=>t.state===s&&t.kind==='official'),s)});
test('only https targets; no user-supplied URLs',()=>{assert.ok(TARGETS.every(t=>t.url.startsWith('https://')))});
test('finds vendor hints and data links in HTML',()=>{
  const h='<script src="https://results.enr.clarityelections.com/app.js"></script><a href="/data/results_2026.json">x</a><a href="https://x.gov/dl/file.csv?y=1">c</a><div id="root"></div>';
  assert.deepEqual(vendorHints(h).sort(),['Clarity/Civix','JS single-page app'].sort());
  const l=dataLinks(h,'https://site.gov/page');assert.ok(l.includes('https://site.gov/data/results_2026.json')&&l.includes('https://x.gov/dl/file.csv?y=1'))});
test('classification never says verified',async()=>{
  const ok=analyze({state:'XX',kind:'official',url:'https://a.gov'},200,{get:()=> 'application/json'},'{"races":[],"as_of":null}');
  assert.equal(ok.format,'json');assert.match(classify(ok),/DATA ENDPOINT RESPONDS/);assert.doesNotMatch(classify(ok),/VERIF/i);
  assert.equal(classify({status:0}),'UNREACHABLE');
  assert.match(classify(analyze({state:'XX',kind:'o',url:'https://a.gov'},200,{get:()=> 'text/html'},'<html><body>hi</body></html>')),/PAGE ONLY/)});
test('probeOne reports network failure instead of throwing',async()=>{
  const r=await probeOne({state:'XX',kind:'official',url:'https://a.gov'},async()=>{throw new Error('boom')});assert.equal(r.status,0);assert.match(formatText([r]),/UNREACHABLE/)});
