# Computes polling-lead tiers from data/preelection.json. A polling margin is not a probability or a projection.
import json,datetime
d=json.load(open('data/preelection.json'));today=datetime.date.fromisoformat(d['asOf'])
OVERRIDE={'CO':{'tier':'limited','leader':'Phil Weiser','leaderParty':'D','margin':None,
 'basis':'No poll average retrieved. MultiState consensus rating Solid D (as of 2026-11-01) and one early-August Magellan Strategies poll reportedly showing Weiser +12 (toplines not shown).','url':'https://www.multistate.us/elections/governor-race/colorado-2026'}}
for r in d['races']:
    s=r['state'];p=r.get('polling')
    if s in OVERRIDE:o=dict(OVERRIDE[s])
    elif not p:o={'tier':'none','basis':'No polling retrieved.'}
    else:
        a=sorted(p['avg'],key=lambda x:-x['pct']);m=round(a[0]['pct']-a[1]['pct'],1)
        age=(today-datetime.date.fromisoformat(p['asOf'])).days
        o={'leader':a[0]['name'],'leaderParty':a[0]['party'],'margin':m,'pollAgeDays':age,'url':p['url']}
        if age>60 or p.get('stale'):o['tier']='stale';o['basis']=f"Newest polling is {age} days old; not used for an outlook."
        else:
            o['tier']='strong' if m>=10 else 'lean' if m>=5 else 'tossup'
            o['basis']=f"Polling average lead of {m} points ({p['source']}, as of {p['asOf']})."
            if p.get('note'):o['basis']+=' '+p['note']
    if o['tier'] in('strong','limited'):
        inc=o['leader']==r['incumbent']
        o['transition']='Incumbent leads: continuity of administration is the likelier case.' if inc else ('Open seat, so a new governor takes office whoever wins; the polling leader would be the likely new governor.' if r['openSeat'] else 'Non-incumbent leads an incumbent-held seat: a change in governor is the polling-favored case.')
    r['outlook']=o
d['outlookNote']='Outlook tiers are computed from polling margins only (strong >= 10 points, lean 5 to <10, toss-up < 5; polls older than 60 days are not used). They are not forecasts or race calls, and polls can be wrong.'
json.dump(d,open('data/preelection.json','w'),indent=1)
from collections import Counter;print(Counter(r['outlook']['tier'] for r in d['races']))
print('strong/limited:',[(r['state'],r['outlook']['leader'],r['outlook']['margin']) for r in d['races'] if r['outlook']['tier'] in('strong','limited')])
