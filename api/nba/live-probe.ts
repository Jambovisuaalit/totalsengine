import { compareSourceSnapshots } from '../../server/nba-live-probe.mjs';
const json = (value: unknown, status = 200) => Response.json(value, {status, headers:{'Cache-Control':'no-store, max-age=0','X-Content-Type-Options':'nosniff'}});
export async function GET() {
 // Read-only preview diagnostic, fixed NBA date. No provider tokens or raw source bytes returned.
 if (process.env.VERCEL_ENV !== 'preview') return json({error:'NOT_FOUND'},404);
 const key=process.env.BALLDONTLIE_API_KEY;
 if (!key) return json({error:'BALLDONTLIE_NOT_CONFIGURED'},503);
 const controller=new AbortController(), timer=setTimeout(()=>controller.abort(),8000);
 try {
  const [espn,bdl]=await Promise.all([
   fetch('https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=20261104&limit=100',{redirect:'error',signal:controller.signal,headers:{Accept:'application/json'}}),
   fetch('https://api.balldontlie.io/v1/games?dates%5B%5D=2026-11-04&per_page=100',{redirect:'error',signal:controller.signal,headers:{Authorization:key,Accept:'application/json'}})
  ]);
  if (!espn.ok || !bdl.ok) return json({error:'SOURCE_UNAVAILABLE',espn_status:espn.status,balldontlie_status:bdl.status},502);
  const [er,br]=await Promise.all([espn.arrayBuffer(),bdl.arrayBuffer()]);
  return json(compareSourceSnapshots(new Uint8Array(er),new Uint8Array(br),new Date().toISOString()));
 }catch {return json({error:'SOURCE_VERIFICATION_FAILED'},502);}
 finally {clearTimeout(timer);}
}