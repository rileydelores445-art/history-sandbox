export const config = { runtime: 'nodejs' };

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

  const redis = await getRedis();
  try {
    const raw = await redis.get('session:current');
    if (!raw) return res.status(200).json({ active: false });
    return res.status(200).json(JSON.parse(raw));
  } catch {
    return res.status(200).json({ active: false });
  } finally { await redis.quit(); }
}
