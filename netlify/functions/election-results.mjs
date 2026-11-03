import {buildResponse} from './lib/query.mjs';
import coverage from '../../data/coverage.json' with {type:'json'};
// /.netlify/functions/election-results?state=OH&office=Governor&race=2026-OH-GOVERNOR
export default async(req)=>{
  const q=new URL(req.url).searchParams;let latest=null;
  try{const {getStore}=await import('@netlify/blobs');latest=await getStore('wob').get('latest',{type:'json'})}catch(e){}
  return new Response(JSON.stringify(buildResponse(latest,coverage,{state:q.get('state'),office:q.get('office'),race:q.get('race')})),
   {headers:{'content-type':'application/json','cache-control':'public, max-age=30, s-maxage=60, stale-while-revalidate=300','access-control-allow-origin':'*'}});
};
