// Nebraska SOS results (electionresults.nebraska.gov). Same vendor CSV export as NM/SD, observed 2026-11-03: type=SW (Senate, Governor), type=CG&map=DIST (House).
import {parseEnrCsv,fetchCsvTypes} from '../enrcsv.mjs';
export const id='NE';
const BASE='https://electionresults.nebraska.gov/';
export const url=BASE+'resultsCSV.aspx?text=All&type=SW&map=CTY';
const meta={state:'NE',sourceName:'Nebraska Secretary of State',sourceUrl:BASE};
export const fetchRaces=(f=fetch)=>fetchCsvTypes(BASE,['SW',['CG','DIST']],'NE',meta,f);
export const parse=t=>parseEnrCsv(t,meta);
