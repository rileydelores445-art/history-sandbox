export const config = { runtime: 'nodejs' };

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

async function getRedis() {
  const { createClient } = await import('redis');
  const client = createClient({ url: process.env.REDIS_URL });
  await client.connect();
  return client;
}

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const redis = await getRedis();
  try {
    const raw = await redis.get('session:current');
    if (raw) {
      const session = JSON.parse(raw);
      session.active = false;
      await redis.set('session:current', JSON.stringify(session), { EX: 7200 });
    }
    return res.status(200).json({ ok: true });
  } finally { await redis.quit(); }
}
