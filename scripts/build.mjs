import {cpSync,rmSync,mkdirSync,existsSync,readdirSync,readFileSync,writeFileSync} from 'node:fs';
rmSync('dist',{recursive:true,force:true});mkdirSync('dist',{recursive:true});
cpSync('site','dist',{recursive:true});
if(existsSync('research'))cpSync('research','dist/research',{recursive:true});
// research/index.json lists states that have a research file
const st=existsSync('research')?readdirSync('research').filter(f=>/^[A-Z]{2}\.json$/.test(f)).map(f=>f.slice(0,2)):[];
mkdirSync('dist/research',{recursive:true});writeFileSync('dist/research/index.json',JSON.stringify({states:st}));
if(existsSync('data/preelection.json'))cpSync('data/preelection.json','dist/preelection.json');
if(existsSync('data/intel.json'))cpSync('data/intel.json','dist/intel.json');
const out={};for(const s of st){const r=JSON.parse(readFileSync('research/'+s+'.json','utf8'));if(r.apStatus&&r.apStatus.called)out[s]={called:true,asOf:r.apStatus.asOf,winner:r.apStatus.winner||null}}
writeFileSync('dist/outcomes.json',JSON.stringify(out));
console.log('built; research states:',st.join(',')||'none');
