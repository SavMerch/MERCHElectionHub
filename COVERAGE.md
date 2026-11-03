# Coverage report: 23 jurisdictions (as of 2026-11-03, ~12:45 ET)

**5 VERIFIED READY** (OH, NV, NM, SD, NE), **4 BLOCKED/NOT AVAILABLE** (OK, AK, WI, plus none live), **2 HISTORICAL ONLY** (MA, IL), **the rest UNVERIFIED**. **Nothing is VERIFIED LIVE**: polls have not closed, so no adapter has seen real votes.

Verified ready means the endpoint returned valid 2026 general-election candidates with zero votes. Adapters parse the shapes I observed and are tested on fixtures copied from them. All are off by default (ENABLE_OH, ENABLE_NV, ENABLE_NM, ENABLE_SD, ENABLE_NE; HI also needs HI_RESULTS_URL). I did not check any site's terms of use or rate limits.

Aggregators checked in the browser 2026-11-03: Open America governor/senate/house endpoints respond (HTTP 200, year 2026, CORS *, no races until results flow) and are on by default; covers governor in AR AZ CO CT FL GA IA ID MI MN PA RI SC TX VT, none of the 23. civicAPI serves only single races by numeric ID (no state/office listing found), so it is not integrated.

Not inspected at all: AL, KS, ME, WY, VI, GU, MP.

| State | Status | Endpoint / candidate | Format | Adapter | Notes |
|---|---|---|---|---|---|
| AL | UNVERIFIED | https://www.sos.alabama.gov/alabama-votes/election-results | - | - | Not inspected. |
| AK | BLOCKED | https://www.elections.alaska.gov/results/ | - | - | www.elections.alaska.gov/results/ returned 403 Forbidden to the browser pane. Not worked around. |
| HI | UNVERIFIED | https://elections.hawaii.gov/election-results/ | - | hi | General-election text files are placeholders ("Information will be posted at a later date"). The 2026 primary summary.txt (tab-delimited) was inspected and an adapter written to that format; the general file URL is unconfirmed, so the adapter needs HI_RESULTS_URL and ENABLE_HI=1. |
| IL | HISTORICAL ONLY | https://elections.il.gov/ | - | - | CSV per office exists (Downloads/ElectionOperations/ElectionResults/ByOffice/69/…-2026GP.csv) but only for the March 2026 general primary; the 2026 general election is not listed yet. A format fetch timed out, so the CSV layout is unverified. |
| KS | UNVERIFIED | https://www.sos.ks.gov/elections/ | - | - | Not inspected. |
| ME | UNVERIFIED | https://www.maine.gov/sos/cec/elec/results/index.html | - | - | Not inspected. |
| MD | UNVERIFIED | https://elections.maryland.gov/ | - | - | Unofficial results page exists at elections.maryland.gov/elections/2026/general_results/index.html; no CSV/JSON link found yet. |
| MA | HISTORICAL ONLY | https://electionstats.state.ma.us/elections/search/year_from:2026/year_to:2026/stage:General | JSON (served as text/html) | - | JSON search works and lists only a 2026-03-03 special election; the November general is not listed yet. Office and district IDs for the general are unknown until it appears. Same platform as NH (nh.electionstats.com). |
| NE | VERIFIED READY | https://electionresults.nebraska.gov/resultsCSV.aspx?text=All&type=SW&map=CTY (+type=CG&map=DIST) | CSV | ne | Senate, Governor and 3 House districts with 0 votes. |
| NV | VERIFIED READY | https://silverstateelection.nv.gov/results-config.json -> manifest.json | JSON | nv | Governor and 4 US House districts with candidates; county votes null. Manifest release sequence 5 generated 2026-10-28. No US Senate race on the 2026 ballot there. Cloudflare/Incapsula wrapper on the site: unattended server fetches not yet tested. |
| NH | UNVERIFIED | https://nh.electionstats.com/ | - | - | nh.electionstats.com search URL returned "Page not found" in the browser pane; the NH ElectionStats path was not confirmed. |
| NM | VERIFIED READY | https://electionresults.sos.nm.gov/resultsCSV.aspx?text=All&type=FED&map=CTY (+type=SW) | CSV | nm | Senate, 3 House districts and Governor with 0 votes and 0/2204 precincts. Site auto-updates about every 5 minutes. |
| NY | UNVERIFIED | https://www.elections.ny.gov/ | - | - | ENR site (nyenr.elections.ny.gov) is server-rendered ASP.NET HTML; no JSON/CSV requests seen. Polls close 9 PM; page lists no contests yet, so contest pages could not be inspected. |
| OH | VERIFIED READY | https://liveresults.ohiosos.gov/Api/v1/Contest/GetContestDetailsObject?contestName=... | JSON | oh | 2026 Governor, US Senate and 15 US House districts returned with candidates and 0 votes. Also GetElectionSummaryCsv (CSV). Undocumented API; terms of use not checked. |
| OK | BLOCKED | https://results.okelections.us/ | - | - | results.okelections.us returned 403 Forbidden to the browser pane. Not worked around. |
| OR | UNVERIFIED | https://results.oregonvotes.gov/ | - | - | Same vendor platform as NM/SD/NE, but /resultsCSV.aspx is not available. Exports are ASP.NET postbacks (ResultsExport.aspx) and a test postback returned HTML, not a file. |
| SD | VERIFIED READY | https://electionresults.sd.gov/resultsCSV.aspx?text=All&type=SWR&map=CTY | CSV | sd | Senate, at-large House and Governor with 0 votes, 0/671 precincts, source timestamp. |
| TN | UNVERIFIED | https://www.tnelectionresults.com/home | - | - | Real ENR dashboard is tnelectionresults.com (the .tn.gov host does not load). Shows "November 3, 2026 Election"; no JSON/CSV/export link found. |
| WI | BLOCKED | https://elections.wi.gov/elections-voting/results | - | - | State commission publishes only post-canvass results (archive page shows 2026 primary, no election-night feed). Statewide election-night totals come from counties; no free state feed identified. |
| WY | UNVERIFIED | https://wyoelections.wyo.gov/ | - | - | Not inspected. |
| VI | UNVERIFIED | https://vivote.gov/ | - | - | Not inspected. |
| GU | UNVERIFIED | https://gec.guam.gov/ | - | - | Not inspected. |
| MP | UNVERIFIED | https://www.votecnmi.gov.mp/ | - | - | Not inspected. |
