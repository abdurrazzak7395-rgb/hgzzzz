// netlify/functions/hgzy.js
// Netlify Function (Node 18+). Global fetch assumed available.

export const handler = async (event, context) => {
  const TARGET_HOST = 'https://draw.ar-lottery01.com';
  const CURRENT_PATH = '/WingO_30S.json';
  const HISTORY_PATH = '/WingO_30S/GetHistoryIssuePage.json';

  // change if target expects specific origin/referer
  const REFERER_ORIGIN = 'https://amarclub17.com';
  const DEFAULT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (compatible; NetlifyProxy/1.0)',
    'Accept': 'application/json, text/plain, */*',
    'Referer': REFERER_ORIGIN,
    'Origin': REFERER_ORIGIN,
  };

  // common response headers (CORS)
  const commonHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json; charset=utf-8',
  };

  // OPTIONS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: commonHeaders,
      body: '',
    };
  }

  try {
    if (event.httpMethod === 'GET') {
      const qs = event.queryStringParameters || {};
      const ts = qs.ts || Date.now();

      const curUrl = `${TARGET_HOST}${CURRENT_PATH}?ts=${ts}`;
      const hisUrl = `${TARGET_HOST}${HISTORY_PATH}?ts=${ts}`;

      const curResp = await fetch(curUrl, { method: 'GET', headers: DEFAULT_HEADERS });
      const curText = await curResp.text();

      // if API returned HTML (blocked / Cloudflare), give helpful message
      const curContentType = curResp.headers.get('content-type') || '';
      if (curContentType.includes('text/html')) {
        return {
          statusCode: 502,
          headers: commonHeaders,
          body: JSON.stringify({ ok: false, error: 'API returned HTML (blocked). Need custom proxy.' }),
        };
      }

      const hisResp = await fetch(hisUrl, { method: 'GET', headers: DEFAULT_HEADERS });
      const hisText = await hisResp.text();
      const hisContentType = hisResp.headers.get('content-type') || '';
      if (hisContentType.includes('text/html')) {
        // if history blocked, still return current but note history blocked
        let curJson;
        try { curJson = JSON.parse(curText); } catch { curJson = { raw: curText }; }
        return {
          statusCode: 200,
          headers: commonHeaders,
          body: JSON.stringify({ ok: true, ts, current: curJson, history: { error: 'history blocked or returned HTML' } }),
        };
      }

      let curJson, hisJson;
      try { curJson = JSON.parse(curText); } catch (e) { curJson = { raw: curText }; }
      try { hisJson = JSON.parse(hisText); } catch (e) { hisJson = { raw: hisText }; }

      return {
        statusCode: 200,
        headers: commonHeaders,
        body: JSON.stringify({ ok: true, ts, current: curJson, history: hisJson }),
      };
    }

    if (event.httpMethod === 'POST') {
      // forward POST to target (useful if you need to call history with POST)
      let payload = {};
      try { payload = event.body ? JSON.parse(event.body) : {}; } catch (e) { payload = {}; }

      const path = payload.path || HISTORY_PATH;
      const method = (payload.method || 'POST').toUpperCase();
      const bodyData = payload.body ?? null;

      const targetUrl = `${TARGET_HOST}${path}`;
      const forwardOptions = { method, headers: { ...DEFAULT_HEADERS } };

      if (bodyData) {
        forwardOptions.headers['Content-Type'] = 'application/json';
        forwardOptions.body = JSON.stringify(bodyData);
      }

      const fRes = await fetch(targetUrl, forwardOptions);
      const text = await fRes.text();
      const contentType = fRes.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        return {
          statusCode: 502,
          headers: commonHeaders,
          body: JSON.stringify({ ok: false, error: 'API returned HTML (blocked). Need custom proxy.' }),
        };
      }

      let json;
      try { json = JSON.parse(text); } catch (e) { json = { raw: text }; }

      return {
        statusCode: 200,
        headers: commonHeaders,
        body: JSON.stringify({ ok: true, forwardedTo: targetUrl, status: fRes.status, response: json }),
      };
    }

    // method not allowed
    return {
      statusCode: 405,
      headers: commonHeaders,
      body: JSON.stringify({ ok: false, error: 'Method not allowed' }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: commonHeaders,
      body: JSON.stringify({ ok: false, error: err && err.message ? err.message : String(err) }),
    };
  }
};
