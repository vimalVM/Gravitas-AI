import { Router } from 'express';

export function healthRouter({ supabase }) {
  const router = Router();

  // GET /api/health        -> process is up
  // GET /api/health?deep=1 -> also checks that the database schema is reachable
  router.get('/', async (req, res) => {
    const payload = { status: 'ok', service: 'gravitas-ai-api', time: new Date().toISOString(), uptimeSeconds: Math.round(process.uptime()) };

    if (req.query.deep === '1') {
      const { error } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).limit(1);
      payload.database = error ? 'unavailable' : 'ok';
      if (error) {
        console.warn('[health] database check failed:', error.message);
        payload.status = 'degraded';
      }
    }

    res.status(payload.status === 'ok' ? 200 : 503).json({ data: payload });
  });

  return router;
}
