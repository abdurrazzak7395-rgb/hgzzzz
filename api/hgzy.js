// api/hgzy.js  (Vercel Serverless function)
// Node 18+ / Vercel environment: global fetch is available.

const TARGET_HOST = 'https://draw.ar-lottery01.com';
const CURRENT_PATH = '/WingO_30S.json';
const HISTORY_PATH = '/WingO_30S/GetHistoryIssuePage.json';

// change these if target expects specific origin/referer
const REFERER_ORIGIN = 'https://amarclub17.com';
const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; VercelProxy/1.0)',
  'Accept': 'application/json, text/plain, */*',
  // set Referer/Origin if the target checks them
  'Referer': REFERER_ORIGIN,
  'Origin': REFERER_ORIGIN,
};

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  try {
    if (req.method === 'GET') {
      // support ?ts=
      const q = req.query || {};
      const ts = q.ts || Date.now();

      // fetch current JSON
      const curUrl = `${TARGET_HOST}${CURRENT_PATH}?ts=${ts}`;
      const curResp = await fetch(curUrl, { method: 'GET', headers: DEFAULT_HEADERS });
      const curText = await curResp.text();

      // fetch history
      const hisUrl = `${TARGET_HOST}${HISTORY_PATH}?ts=${ts}`;
      const hisResp = await fetch(hisUrl, { method: 'GET', headers: DEFAULT_HEADERS });
      const hisText = await hisResp.text();

      // try parse JSON, if not JSON return raw string in `raw` field
      let curJson, hisJson;
      try { curJson = JSON.parse(curText); } catch (e) { curJson = { raw: curText }; }
      try { hisJson = JSON.parse(hisText); } catch (e) { hisJson = { raw: hisText }; }

      return res.status(200).json({ ok: true, ts, current: curJson, history: hisJson });
    }

    if (req.method === 'POST') {
      // forward a POST to target host
      // expected body: { path: "/api/...", body: {...}, method?: "POST" }
      const payload = req.body || {};
      const path = payload.path || HISTORY_PATH;
      const method = (payload.method || 'POST').toUpperCase();
      const bodyData = payload.body ?? null;

      const targetUrl = `${TARGET_HOST}${path}`;

      const forwardOptions = {
        method,
        headers: { ...DEFAULT_HEADERS },
      };

      if (bodyData) {
        // assume JSON body
        forwardOptions.headers['Content-Type'] = 'application/json';
        forwardOptions.body = JSON.stringify(bodyData);
      }

      const fRes = await fetch(targetUrl, forwardOptions);
      const text = await fRes.text();
      let json;
      try { json = JSON.parse(text); } catch (e) { json = { raw: text }; }

      return res.status(200).json({ ok: true, forwardedTo: targetUrl, status: fRes.status, response: json });
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (err) {
    // Common errors: network issue, blocked by target, target returned HTML (eg Cloudflare)
    return res.status(500).json({ ok: false, error: err.message || String(err) });
  }
}
