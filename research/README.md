# Research files (credit-efficient workflow)
One file per state: `research/XX.json`; `published:false` hides it. Fields per cabinet prospect: name, currentPosition, status
(officially_appointed | officially_nominated | reported_under_consideration | analyst_prospect), confidence, lastResearched, sources[https].
Rules: no source = no record; never list prospects for elected offices as governor appointments.

Cheap research loop (do NOT research before results exist):
1. Wait for a call/certification. Add it to data/calls.json.
2. Research only open seats and party flips (about 15-20 states), then incumbents only if a transition team is announced.
3. One standard search per state for "governor-elect transition team", one for "chief of staff named". Official .gov and campaign sites first.
4. Save results to research/XX.json; commit; Netlify redeploys. Never re-search a state whose sources are unchanged.
