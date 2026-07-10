const crypto = require('crypto');

const KEY = 'conviction:config';
const FIELDS = ['ca', 'twitter', 'community', 'buy'];

const DEFAULTS = {
  ca: '',
  twitter: 'https://x.com/',
  community: 'https://x.com/',
  buy: 'https://pump.fun/'
};

async function kv(path, options) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error('KV env vars are not configured');
  const res = await fetch(url + path, {
    ...options,
    headers: { Authorization: 'Bearer ' + token }
  });
  if (!res.ok) throw new Error('KV request failed: ' + res.status);
  return res.json();
}

function checkPassword(password) {
  const adminHash = process.env.ADMIN_HASH;
  if (!adminHash || typeof password !== 'string' || !password.length) return false;
  const hash = crypto.createHash('sha256').update(password).digest('hex');
  const a = Buffer.from(hash);
  const b = Buffer.from(adminHash.toLowerCase());
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    try {
      const data = await kv('/get/' + KEY);
      const saved = data && data.result ? JSON.parse(data.result) : {};
      return res.status(200).json({ ...DEFAULTS, ...saved });
    } catch (e) {
      return res.status(200).json(DEFAULTS);
    }
  }

  if (req.method === 'POST') {
    const body = req.body || {};

    if (!checkPassword(body.password)) {
      return res.status(401).json({ error: 'the oath is false' });
    }

    const incoming = body.config || {};
    const clean = {};
    for (const field of FIELDS) {
      if (typeof incoming[field] === 'string') clean[field] = incoming[field].trim();
    }

    try {
      await kv('/set/' + KEY, { method: 'POST', body: JSON.stringify(clean) });
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: 'storage failed' });
    }
  }

  return res.status(405).json({ error: 'method not allowed' });
};
