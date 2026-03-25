import { kv } from '@vercel/kv';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();

  const raw = await kv.get('session:current');
  if (!raw) return res.status(200).json({ active: false });

  try {
    const session = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return res.status(200).json(session);
  } catch {
    return res.status(200).json({ active: false });
  }
}
