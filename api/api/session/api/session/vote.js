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

  const { optionId } = req.body || {};
  if (!optionId) return res.status(400).json({ error: 'optionId required' });

  const redis = await getRedis();
  try {
    const raw = await redis.get('session:current');
    if (!raw) return res.status(400).json({ error: '当前没有活动投票' });
    const session = JSON.parse(raw);
    if (!session.active) return res.status(400).json({ error: '投票已结束' });
    if (session.type !== 'vote') return res.status(400).json({ error: '当前不是投票模式' });
    if (!(optionId in session.votes)) return res.status(400).json({ error: '无效选项' });
    session.votes[optionId] = (session.votes[optionId] || 0) + 1;
    await redis.set('session:current', JSON.stringify(session), { EX: 7200 });
    return res.status(200).json({ ok: true });
  } finally { await redis.quit(); }
}
