import { kv } from '@vercel/kv';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { optionId } = req.body || {};
  if (!optionId) return res.status(400).json({ error: 'optionId required' });

  const raw = await kv.get('session:current');
  if (!raw) return res.status(400).json({ error: '当前没有活动投票' });

  let session;
  try { session = typeof raw === 'string' ? JSON.parse(raw) : raw; }
  catch { return res.status(500).json({ error: 'session parse error' }); }

  if (!session.active) return res.status(400).json({ error: '投票已结束' });
  if (session.type !== 'vote') return res.status(400).json({ error: '当前不是投票模式' });
  if (!(optionId in session.votes)) return res.status(400).json({ error: '无效选项' });

  session.votes[optionId] = (session.votes[optionId] || 0) + 1;
  await kv.set('session:current', JSON.stringify(session), { ex: 7200 });

  return res.status(200).json({ ok: true });
}
