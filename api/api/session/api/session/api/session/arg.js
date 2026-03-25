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

  const { text } = req.body || {};
  if (!text || text.trim().length < 10) {
    return res.status(400).json({ error: '论点太短，至少10字' });
  }
  if (text.trim().length > 200) {
    return res.status(400).json({ error: '论点最多200字' });
  }

  const raw = await kv.get('session:current');
  if (!raw) return res.status(400).json({ error: '当前没有论点收集' });

  let session;
  try { session = typeof raw === 'string' ? JSON.parse(raw) : raw; }
  catch { return res.status(500).json({ error: 'session parse error' }); }

  if (!session.active) return res.status(400).json({ error: '收集已结束' });
  if (session.type !== 'args') return res.status(400).json({ error: '当前不是论点模式' });

  session.args = session.args || [];
  session.args.push({ id: Date.now().toString(), text: text.trim() });
  await kv.set('session:current', JSON.stringify(session), { ex: 7200 });

  return res.status(200).json({ ok: true });
}
