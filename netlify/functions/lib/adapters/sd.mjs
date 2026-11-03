// South Dakota SOS results. Same vendor CSV export, observed 2026-11-03: type=SWR returns Senate, the at-large House seat and Governor.
import {parseEnrCsv,fetchCsvTypes} from '../enrcsv.mjs';
export const id='SD';
const BASE='https://electionresults.sd.gov/';
export const url=BASE+'resultsCSV.aspx?text=All&type=SWR&map=CTY';
const meta={state:'SD',sourceName:'South Dakota Secretary of State',sourceUrl:BASE};
export const fetchRaces=(f=fetch)=>fetchCsvTypes(BASE,['SWR'],'SD',meta,f);
export const parse=t=>parseEnrCsv(t,meta);
