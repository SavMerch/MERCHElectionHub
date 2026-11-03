import {getStore} from '@netlify/blobs';
export default async()=>{
  let d=null;try{d=await getStore('wob').get('latest',{type:'json'})}catch(e){}
  d=d||{checkedAt:null,races:[],health:{},calls:0};
  return new Response(JSON.stringify(d),{headers:{'content-type':'application/json','cache-control':'public, max-age=30, s-maxage=60, stale-while-revalidate=300'}});
};
