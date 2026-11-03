// Polling phases. Times are ET election night -> UTC. Override with env for testing.
export const PHASES={
  nightStart:process.env.NIGHT_START||'2026-11-03T22:00:00Z', // 5pm ET Nov 3
  nightEnd:process.env.NIGHT_END||'2026-11-05T11:00:00Z',     // ~6am ET Nov 5
  countingEnd:process.env.COUNTING_END||'2026-11-12T00:00:00Z',
  certEnd:process.env.CERT_END||'2026-12-31T00:00:00Z'
};
export function phaseAt(now=new Date(),P=PHASES){
  const t=+now;
  if(t<+new Date(P.nightStart))return'pre';
  if(t<+new Date(P.nightEnd))return'night';       // every 5 min
  if(t<+new Date(P.countingEnd))return'counting'; // hourly
  if(t<+new Date(P.certEnd))return'certification';// daily
  return'closed';
}
// which scheduled job may run in which phase
export const RUNS={fast:['night'],hourly:['counting'],daily:['certification','pre']};
export const shouldRun=(job,now=new Date(),P=PHASES)=>(RUNS[job]||[]).includes(phaseAt(now,P));
