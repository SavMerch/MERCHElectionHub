// Sourced point-in-time snapshots from official election offices (data/manual-results.json), e.g. VI Territorial Summary PDF.
// Not a live feed: it is re-read on each refresh and shows its own sourceUpdated time. Status stays "counting" (never a call).
import snap from '../../../../data/manual-results.json' with {type:'json'};
export const id='MANUAL';
export const fetchRaces=async()=>snap.races.filter(r=>/^https:\/\//.test(r.sourceUrl||'')&&r.sourceUpdated);
