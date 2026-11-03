import base64
b=open('/home/claude/hub/logo.txt').read().split(',',1)[1]
open('site/logo.png','wb').write(base64.b64decode(b))
t=open('/home/claude/hub/tpl.html').read()
def rep(a,b_):
    global t
    assert a in t,a[:70]; t=t.replace(a,b_,1)
rep('%%LOGO%%','/logo.png')
rep('MN,Minnesota,D,1,,3,5','MN,Minnesota,D,1,1,3,5')
rep("const NA='<span","const COL={R:'#b3323f',D:'#2a64ad',O:'#6b5b95',hi:'#5f8f1f',mid:'#b58a2b',lo:'#6c7882',pend:'#8a96a0',unk:'#cfd5da',na:'#dde1e5'};\nconst NA='<span")
rep("style=\"--c:${getComputedStyle(document.querySelector('.tile.c-'+k)||document.body).backgroundColor}\"","style=\"--c:${COL[k]}\"")
rep("outcome:['Election outcome / projection',j=>j.g?['pend','Not yet reported (no feed connected)']:['na','No 2026 gubernatorial election'],{pend:'Not yet reported',na:'Not applicable'}]",
"outcome:['Election outcome / projection',j=>{const c=callOf(j.s);return !j.g?['na','No 2026 gubernatorial election']:c?[c.winnerParty||'unk',(c.status==='certified'?'Certified: ':'Projected: ')+c.winner]:['pend','Not yet reported']},{R:'Republican winner',D:'Democratic winner',O:'Other winner',pend:'Not yet reported',na:'Not applicable'}]")
rep("chg:['Change in party control',j=>j.g?['unk','Not determined']:['na','Not applicable'],{unk:'Not determined',na:'Not applicable'}]",
"chg:['Change in party control',j=>{const c=callOf(j.s);return !j.g?['na','Not applicable']:c&&c.winnerParty?(c.winnerParty!==j.p?['hi','Party flip']:['lo','Party hold']):['unk','Not determined']},{hi:'Party flip',lo:'Party hold',unk:'Not determined',na:'Not applicable'}]")
rep("['—','races called (feed not connected)']","[DATA?DATA.races.filter(r=>r.call).length:'—','races called or certified']")
rep("'open seats identified'","'open seats (registry; verify)'")
rep("<b>${j.g?'Not yet reported':'N/A'}</b>","<b>${raceStat(j)}</b>")
i=t.index("if(tab==='Results')b=");k=t.index("\n",i); t=t[:i]+"if(tab==='Results')b=resultsHTML(j);"+t[k:]
i=t.index("if(tab==='Scenarios')b=");k=t.index("\n",i); t=t[:i]+"if(tab==='Scenarios')b=scenHTML(j);"+t[k:]
rep('<div class="row"><span>Prospects</span>${NA}</div>','${prosp(j.s,r)}')
add=open('scripts/site_add.js').read()
rep("kpis();matrix();detail();table();\n</script>", add+"kpis();matrix();detail();table();loadData();loadIdx();\n</script>")
rep("matrix();detail();$('detail').focus","loadRes(s);matrix();detail();$('detail').focus")
open('site/index.html','w').write(t)
