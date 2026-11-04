import test from 'node:test';import assert from 'node:assert/strict';
import {checkUrl,pullLink,verifyRaces,htmlToText,raceKey} from '../netlify/functions/lib/linkpull.mjs';
import links from '../netlify/functions/links.mjs';import bg from '../netlify/functions/links-background.mjs';
const pub=async()=>[{address:'93.184.216.34'}];
const resp=(body,ct)=>({ok:true,status:200,headers:new Headers({'content-type':ct}),arrayBuffer:async()=>Buffer.from(body)});
const ai=(obj)=>({ok:true,status:200,json:async()=>({content:[{type:'text',text:JSON.stringify(obj)}],usage:{input_tokens:1,output_tokens:1}})});
test('SSRF guard blocks http, private hosts, credentials',async()=>{
  for(const u of ['http://a.com','https://localhost/x','https://127.0.0.1/','https://u:p@a.com/','nonsense'])await assert.rejects(checkUrl(u,pub));
  await assert.rejects(checkUrl('https://a.com',async()=>[{address:'10.0.0.5'}]),/not allowed/);await checkUrl('https://a.com',pub)});
const HTML='<table><tr><td>Governor</td></tr><tr><td>Jane Roe</td><td>1,234</td></tr><tr><td>John Doe</td><td>987</td></tr><tr><td>US House District 2</td></tr><tr><td>A B</td><td>500</td></tr><tr><td>C D</td><td>400</td></tr></table>';
test('AI-text extraction keeps only numbers that appear in the page, handles House districts',async()=>{
  const out={asOf:'9pm',races:[{office:'Governor',district:null,candidates:[{name:'Jane Roe',party:'D',votes:1234},{name:'John Doe',party:'R',votes:987},{name:'Fake',party:'I',votes:77777}]},{office:'US House',district:'2',candidates:[{name:'A B',party:'R',votes:500},{name:'C D',party:'D',votes:400}]},{office:'US House',district:'3',candidates:[{name:'X',votes:999999},{name:'Y',votes:888888}]}]};
  const f=async(u)=>u.startsWith('https://api.anthropic.com')?ai(out):resp(HTML,'text/html');
  const r=await pullLink({state:'OH',url:'https://x.gov/r',fetchImpl:f,resolve:pub,apiKey:'k'});
  const gov=r.races.find(x=>x.office==='Governor'),h2=r.races.find(x=>x.office==='US House');
  assert.equal(gov.candidates.length,2);assert.ok(!gov.candidates.some(c=>c.name==='Fake'));assert.equal(h2.district,'2');assert.equal(r.races.length,2);assert.equal(h2.verified,true);assert.equal(gov.status,'counting');assert.equal(gov.call,undefined)});
test('PDF extraction is flagged as not machine-verified',async()=>{
  const out={races:[{office:'US Senate',candidates:[{name:'A',votes:10},{name:'B',votes:5}]}]};
  const f=async(u)=>u.startsWith('https://api.anthropic.com')?ai(out):resp('%PDF','application/pdf');
  const r=await pullLink({state:'VI',url:'https://x.gov/r.pdf',fetchImpl:f,resolve:pub,apiKey:'k'});assert.equal(r.races[0].verified,false);assert.match(r.method,/not machine-verified/)});
test('no key and unknown format gives a clear error',async()=>{await assert.rejects(pullLink({state:'OH',url:'https://x.gov/r',fetchImpl:async()=>resp(HTML,'text/html'),resolve:pub}),/ANTHROPIC_API_KEY/)});
test('raceKey separates House districts',()=>{assert.notEqual(raceKey({state:'OH',office:'US House',district:'1'}),raceKey({state:'OH',office:'US House',district:'2'}));assert.equal(raceKey({state:'OH',office:'US House',district:'09'}),raceKey({state:'OH',office:'US House',district:'9'}))});
const mem=()=>{const m=new Map();return {m,get:async k=>m.get(k)??null,setJSON:async(k,v)=>{m.set(k,v)}}};
test('links endpoint requires token and https; background stores results and refreshes',async()=>{process.env.REFRESH_TOKEN='t';const st=mem();
  const mk=(q,b)=>new Request('https://x.test/api/links?'+q,{method:'POST',body:JSON.stringify(b)});
  assert.equal((await links(mk('token=no',{state:'OH',url:'https://a.com'}),{},{store:st})).status,403);
  assert.equal((await links(mk('token=t',{state:'OH',url:'http://a.com'}),{},{store:st})).status,400);
  let started=0;assert.equal((await links(mk('token=t',{state:'OH',url:'https://a.com/r'}),{},{store:st,fetch:async()=>{started++;return new Response('',{status:202})}})).status,202);assert.equal(started,1);
  const race={state:'OH',office:'US House',district:'1',candidates:[{name:'A',party:'R',votes:5,pct:50},{name:'B',party:'D',votes:5,pct:50}],status:'counting',linked:true};let refreshed=0;
  await bg(new Request('https://x.test/',{method:'POST',headers:{'x-links-token':'t'},body:JSON.stringify({state:'OH',url:'https://a.com/r'})}),{},{store:st,pull:async()=>({races:[race],method:'m',notes:[]}),refresh:async()=>{refreshed++}});
  assert.equal(st.m.get('state-links').OH.status,'done');assert.equal(st.m.get('linked-results').OH.length,1);assert.equal(refreshed,1);
  await bg(new Request('https://x.test/',{method:'POST',headers:{'x-links-token':'t'},body:JSON.stringify({state:'OH',url:'https://a.com/r'})}),{},{store:st,pull:async()=>{throw new Error('boom')}});assert.equal(st.m.get('state-links').OH.status,'error')});
import {runRefresh} from '../netlify/functions/lib/refresh.mjs';
test('refresh merges linked House districts separately and lets official feed with votes win',async()=>{
  const st=mem();const mkr=(d,v)=>({state:'OH',office:'US House',district:d,candidates:[{name:'A',party:'R',votes:v,pct:null},{name:'B',party:'D',votes:1,pct:null}],reportingPct:null,sourceName:'link',sourceUrl:'https://a.com',sourceUpdated:null,status:'counting',linked:true});
  st.m.set('linked-results',{OH:[mkr('1',10),mkr('2',20)]});
  const feed={mod:{id:'F',fetchRaces:async()=>[{state:'OH',office:'US House',district:'2',candidates:[{name:'Official',party:'R',votes:99},{name:'B',party:'D',votes:1}]}]},enabled:true};
  await runRefresh({store:st,adapters:[feed]});const rs=st.m.get('latest').races.filter(r=>r.office==='US House');
  assert.equal(rs.length,2);assert.equal(rs.find(r=>r.district==='2').candidates[0].name,'Official');assert.equal(rs.find(r=>r.district==='1').candidates[0].votes,10);
  st.m.set('linked-results',{});await runRefresh({store:st,adapters:[]});assert.ok(!st.m.get('latest').races.some(r=>r.linked))});
