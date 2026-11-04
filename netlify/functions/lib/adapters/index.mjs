// Add one file per state feed, then register it here. enabled:false adapters are skipped.
import*as ca from './ca.mjs';
import*as oa from './oa.mjs';
import*as oh from './oh.mjs';
import*as nv from './nv.mjs';
import*as nm from './nm.mjs';
import*as sd from './sd.mjs';
import*as hi from './hi.mjs';
import*as ne from './ne.mjs';
import*as manual from './manual.mjs';
// All verified adapters are ON by default. Set ENABLE_<ID>=0 in Netlify to switch one off (OA CA OH NV NM SD NE). HI is on only if ENABLE_HI!=0 AND HI_RESULTS_URL is set.
export const ADAPTERS=[{mod:oa,enabled:process.env.ENABLE_OA!=='0'},{mod:ca,enabled:process.env.ENABLE_CA!=='0'},{mod:oh,enabled:process.env.ENABLE_OH!=='0'},{mod:nv,enabled:process.env.ENABLE_NV!=='0'},{mod:nm,enabled:process.env.ENABLE_NM!=='0'},{mod:sd,enabled:process.env.ENABLE_SD!=='0'},{mod:hi,enabled:process.env.ENABLE_HI!=='0'&&!!process.env.HI_RESULTS_URL},{mod:ne,enabled:process.env.ENABLE_NE!=='0'},{mod:manual,enabled:process.env.ENABLE_MANUAL!=='0'}];
