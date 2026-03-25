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

  const raw = await kv.get('session:current');
  if (!raw) return res.status(200).json({ ok: true });

  try {
    const session = typeof raw === 'string' ? JSON.parse(raw) : raw;
    session.active = false;
    await kv.set('session:current', JSON.stringify(session), { ex: 7200 });
  } catch {}

  return res.status(200).json({ ok: true });
}
