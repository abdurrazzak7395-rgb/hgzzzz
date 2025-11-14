// netlify/functions/hgzy.js
export const handler = async (event, context) => {
  const TARGET_HOST = 'https://draw.ar-lottery01.com';
  const CURRENT_PATH = '/WingO_30S.json';
  const HISTORY_PATH = '/WingO_30S/GetHistoryIssuePage.json';

  const REFERER_ORIGIN = 'https://amarclub17.com';
  const DEFAULT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (compatible; NetlifyProxy/1.0)',
    'Accept': 'application/json, text/plain, */*',
    'Referer': REFERER_ORIGIN,
    'Origin': REFERER_ORIGIN,
  };

  try {
    const ts = Date.now();

    // fetch current
    const curUrl = `${TARGET_HOST}${CURRENT_PATH}?ts=${ts}`;
    const curResp = await fetch(curUrl, { headers: DEFAULT_HEADERS });
    const curText = await curResp.text();

    // fetch history
    const hisUrl = `${TARGET_HOST}${HISTORY_PATH}?ts=${ts}`;
    const hisResp = await fetch(hisUrl, { headers: DEFAULT_HEADERS });
    const hisText = await hisResp.text();

    let curJson, hisJson;
    try { curJson = JSON.parse(curText); } catch { curJson = { raw: curText }; }
    try { hisJson = JSON.parse(hisText); } catch { hisJson = { raw: hisText }; }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ok: true,
        ts,
        current: curJson,
        history: hisJson
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: err.message
      })
    };
  }
};
