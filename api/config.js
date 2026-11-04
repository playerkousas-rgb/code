// Public configuration only. Never return passwords or signing secrets here.
export default function config(req, res, options = {}) {
  if (req.method !== 'GET') { res.statusCode=405; res.end(); return; }
  let url='';
  try {
    const candidate=new URL((options.env || process.env).ACTIVITY_API_URL || '');
    if (candidate.protocol==='https:' && candidate.pathname==='/api/activity' && !candidate.username && !candidate.password && !candidate.search && !candidate.hash) url=candidate.href;
  } catch {}
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.end(JSON.stringify({activityApiUrl:url}));
}
