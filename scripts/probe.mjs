// Dry-run an adapter against the live feed without writing anything: node scripts/probe.mjs CA
import {ADAPTERS} from '../netlify/functions/lib/adapters/index.mjs';
import {validateRace} from '../netlify/functions/lib/normalize.mjs';
const a=ADAPTERS.find(x=>x.mod.id===process.argv[2]);if(!a)throw new Error('unknown adapter');
const raw=await a.mod.fetchRaces();console.log(JSON.stringify(raw.map(validateRace),null,1));
