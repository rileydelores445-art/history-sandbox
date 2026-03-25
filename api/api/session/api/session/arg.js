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

  const { text } = req.body || {};
  if (!text || text.trim().length < 10) return res.status(400).json({ error: '论点太短，至少10字' });
  if (text.trim().length > 200) return res.status(400).json({ error: '论点最多200字' });

  const redis = await getRedis();
  try {
    const raw = await redis.get('session:current');
    if (!raw) return res.status(400).json({ error: '当前没有论点收集' });
    const session = JSON.parse(raw);
    if (!session.active) return res.status(400).json({ error: '收集已结束' });
    if (session.type !== 'args') return res.status(400).json({ error: '当前不是论点模式' });
    session.args = session.args || [];
    session.args.push({ id: Date.now().toString(), text: text.trim() });
    await redis.set('session:current', JSON.stringify(session), { EX: 7200 });
    return res.status(200).json({ ok: true });
  } finally { await redis.quit(); }
}
