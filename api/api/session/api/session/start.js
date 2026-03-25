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

  const { type, title, options } = req.body || {};
  if (!type) return res.status(400).json({ error: 'type required' });

  const session = {
    type,                     // 'vote' | 'args'
    active: true,
    title: title || '',
    options: options || [],   // [{ id, text, badge }]
    votes: {},                // { optionId: count }
    args: [],                 // [{ id, text }]
    startTime: Date.now(),
  };

  // initialise vote counters
  if (type === 'vote' && options) {
    options.forEach(o => { session.votes[o.id] = 0; });
  }

  await kv.set('session:current', JSON.stringify(session), { ex: 7200 }); // 2h TTL
  return res.status(200).json({ ok: true });
}
