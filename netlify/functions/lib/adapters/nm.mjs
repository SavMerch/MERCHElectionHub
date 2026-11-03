// New Mexico SOS results. Public CSV media export observed in the browser 2026-11-03: /resultsCSV.aspx?text=All&type=FED (Senate+House), type=SW (Governor).
import {parseEnrCsv,fetchCsvTypes} from '../enrcsv.mjs';
export const id='NM';
const BASE='https://electionresults.sos.nm.gov/';
export const url=BASE+'resultsCSV.aspx?text=All&type=FED&map=CTY';
const meta={state:'NM',sourceName:'New Mexico Secretary of State',sourceUrl:BASE};
export const fetchRaces=(f=fetch)=>fetchCsvTypes(BASE,['FED','SW'],'NM',meta,f);
export const parse=t=>parseEnrCsv(t,meta);
