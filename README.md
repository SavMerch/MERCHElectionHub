# Merch Advisory | 2026 Election & Transition Intelligence Hub

Static site + scheduled Netlify Functions + Netlify Blobs. No database, no paid feeds.

## Deploy (replace the repo contents with this package)
1. In GitHub, replace everything in the repo root with the contents of this zip (drag the extracted files, not the folder).
2. Netlify: Base directory empty. Build command `node scripts/build.mjs`, publish `dist`, functions `netlify/functions` (already in `netlify.toml`).
3. Environment variables: `REFRESH_TOKEN` (any long random string; protects /api/refresh and /api/probe). Nothing else is required.
4. After deploy, check Functions list shows `refresh-fast`, `refresh-hourly`, `refresh-daily`, `data`, `election-results`, `probe`, `refresh-now`.

## What runs by default
All verified adapters are ON. Set `ENABLE_<ID>=0` to switch one off.
| ID | Source | Covers |
|---|---|---|
| OA | Open America (free, no key, CORS *) | Governor: AR AZ CO CT FL GA IA ID MI MN PA RI SC TX VT. Senate/House endpoints are polled too; their per-race shapes were empty when checked, so only state / state-district keys are accepted |
| CA | California SOS | Governor |
| OH | Ohio SOS JSON | Governor, Senate, House |
| NV | Nevada SOS JSON | Governor, House |
| NM | New Mexico SOS CSV | Governor, Senate, House |
| SD | South Dakota SOS CSV | Governor, Senate, House |
| NE | Nebraska SOS CSV | Governor, Senate, House |
| HI | Hawaii text file | Off until `HI_RESULTS_URL` is set to the general-election summary.txt link |

civicAPI was checked: it only serves single races by numeric ID (`/v2/race/{id}`), with no state/office listing found, so it is not integrated.
Not covered by any adapter: see `COVERAGE.md` (AL AK IL KS ME MD MA NH NY OK OR TN WI WY VI GU MP). Those use manual sourced calls in `data/calls.json`.

## Schedule (UTC; code gates by phase)
- refresh-fast `*/5 * * * *`: election night 2026-11-03 22:00Z to 11-05 11:00Z
- refresh-hourly `0 * * * *`: counting until 11-12
- refresh-daily `0 11 * * *`: pre-election and certification
The page re-reads `/api/data` every 60 s. Manual refresh: `/api/refresh?token=REFRESH_TOKEN`.

## Endpoints
- `/api/data` raw cache. `/api/election-results?state=OH&office=Governor&race=2026-OH-GOVERNOR` normalized, with per-jurisdiction availability and stale flag.
- `/api/probe?token=...[&state=NV]` source-discovery probe from Netlify's network (reports only, never marks verified).

## Rules the code enforces
Leaders are never labeled winners. `projected`/`certified` come only from sourced entries in `data/calls.json`. Reporting % is shown only if the source publishes it. A failed source keeps its last good data and is flagged stale. Adapters reject unrecognized shapes instead of guessing.

## Tests
`npm test` (offline; fixtures copied from observed feeds).

## Not verified
No adapter has seen real votes. Netlify scheduling in production and browser rendering of the new branding were not checked. Terms of use and rate limits of the state feeds were not checked.
