import {shouldRun} from './lib/phase.mjs';
import {runRefresh} from './lib/refresh.mjs';
export default async()=>{ if(!shouldRun('fast'))return new Response('skipped'); const r=await runRefresh(); return new Response(JSON.stringify(r)); };
export const config={schedule:"*/5 * * * *"};
