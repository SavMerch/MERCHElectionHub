t=open('site/index.html').read()
def rep(a,b):
    global t
    assert a in t,a[:70]; t=t.replace(a,b,1)
rep('RI,Rhode Island,D,1,0,','RI,Rhode Island,D,1,1,')
rep('VT,Vermont,R,1,,','VT,Vermont,R,1,0,')
add=r'''
let PRE=null;const pre=s=>PRE?PRE.races.find(r=>r.state===s):null;
const pollTxt=s=>{const p=pre(s)&&pre(s).polling;return p?esc(p.avg.map(a=>a.name.split(' ').pop()+' '+a.pct).join(' · '))+(p.stale?' (stale)':''):'Not retrieved'};
function preHTML(j){if(!j.g)return'';const r=pre(j.s);if(!PRE)return'<div class="note" style="margin-bottom:12px">Pre-election candidate data could not be loaded.</div>';
if(!r)return'<div class="note" style="margin-bottom:12px">No pre-election candidate record for this jurisdiction.</div>';
const p=r.polling,mx=p?Math.max(...p.avg.map(a=>a.pct)):1;
return`<div class="card" style="margin-bottom:12px"><div class="bar"><h3>Governor: candidates and pre-election polling</h3><span class="pill">Pre-election · not results</span></div>
<div class="row"><span>Incumbent</span><b>${esc(r.incumbent)} (${r.incumbentParty}) · ${r.openSeat?'open seat':'running'}</b></div>
<div class="row"><span>Major-party nominees</span><span>${r.candidates.map(c=>esc(c.name)+' ('+c.party+')'+(c.incumbent?' *':'')).join(' vs. ')}</span></div>
${r.others.length?`<div class="row"><span>Other candidates</span><span>${r.others.map(o=>esc(o.name)+' ('+esc(o.party)+')').join('; ')}</span></div>`:''}
${p?`<h3 style="margin-top:12px">Polling average <small>(as of ${esc(p.asOf)} · ${esc(p.source)})</small></h3>${p.stale?'<p class="note">'+esc(p.stale)+'</p>':''}
<div class="wrap"><table>${p.avg.map(a=>`<tr><td style="width:34%">${esc(a.name)} (${a.party})</td><td style="width:12%">${a.pct}%</td><td><div style="height:8px;border-radius:4px;background:${COL[a.party]||COL.pend};width:${Math.round(a.pct/mx*100)}%"></div></td></tr>`).join('')}</table></div>
<details><summary>Recent polls</summary><div class="wrap"><table><tr><th>Pollster</th><th>Dates</th><th>Sample</th><th>Numbers</th></tr>${p.polls.map(q=>`<tr><td>${esc(q.pollster)}</td><td>${esc(q.dates)}</td><td>${esc(q.sample)}</td><td>${Object.entries(q.values).map(([k,v])=>esc(k)+' '+v).join(' · ')}</td></tr>`).join('')}</table></div></details>
<small>Source: <a href="${su(p.url)}" rel="noopener">${esc(p.source)}</a>. Polling aggregates are not votes, and polls can miss.</small>`:'<p class="note">No polling retrieved for this race yet.</p>'}
<small style="display:block;margin-top:8px">Candidates: <a href="${su(PRE.nomineesSource.url)}" rel="noopener">${esc(PRE.nomineesSource.name)}</a>. * incumbent.</small></div>`}
async function loadPre(){try{const r=await fetch('/preelection.json');if(r.ok)PRE=await r.json()}catch(e){}matrix();detail();table()}
'''
rep("kpis();matrix();detail();table();loadData();loadIdx();","kpis();matrix();detail();table();loadData();loadIdx();loadPre();")
rep("let DATA=null,RES={}",add.strip()+"\nlet DATA=null,RES={}")
rep("if(tab==='Results')b=resultsHTML(j);","if(tab==='Results')b=preHTML(j)+resultsHTML(j);")
rep('<div class="row"><span>Current governor / term end</span>${NA}</div>',
 '<div class="row"><span>Current governor</span>${pre(j.s)?`<b>${esc(pre(j.s).incumbent)}</b>`:NA}</div><div class="row"><span>Nominees</span>${pre(j.s)?`<span>${pre(j.s).candidates.map(c=>esc(c.name)+\' (\'+c.party+\')\').join(\' vs. \')}</span>`:NA}</div><div class="row"><span>Polling average</span><span>${pollTxt(j.s)}</span></div>')
rep("['y','Transition index']","['y','Transition index'],['z','Polling avg (pre-election)']")
rep("<td>Not yet reported</td><td>—</td></tr>","<td>${raceStat(j)}</td><td>—</td><td>${pollTxt(j.s)}</td></tr>")
rep("colspan=5","colspan=6")
open('site/index.html','w').write(t)
b=open('scripts/build.mjs').read()
b=b.replace("console.log('built","if(existsSync('data/preelection.json'))cpSync('data/preelection.json','dist/preelection.json');\nconsole.log('built")
open('scripts/build.mjs','w').write(b)
