const DEFAULT_HEADERS = {
  "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "accept-language": "zh-CN,zh;q=0.9",
  "referer": "https://match.yuanrenxue.cn/match/foundation_early",
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
};

function buildCookieHeader(sessionId) {
  return `sessionid=${sessionId}`;
}

async function fetchMatchPageHtml(sessionId) {
  const response = await fetch("https://match.yuanrenxue.cn/match/foundation_early", {
    headers: {
      ...DEFAULT_HEADERS,
      cookie: buildCookieHeader(sessionId),
    },
  });

  const html = await response.text();
  return { status: response.status, html };
}

function parseRound(html) {
  const key = [...html.matchAll(/<span class="k">key<\/span><code>([^<]+)<\/code>/g)].map((m) => m[1])[0];
  const cipher = [...html.matchAll(/<span class="k">cipher<\/span><code class="long">([^<]+)<\/code>/g)].map((m) => m[1])[0];
  const earthCipher = [...html.matchAll(/解密下面的密文：<span class="kw param">([^<]+)<\/span>解密结果即为<span class="kw reiki earth">土灵气<\/span>/g)].map((m) => m[1])[0];
  return { key, cipher, earthCipher };
}

async function submitAnswer(sessionId, answer) {
  const body = new URLSearchParams({ answer }).toString();
  const response = await fetch("https://match.yuanrenxue.cn/a/foundation_early", {
    method: "POST",
    headers: {
      ...DEFAULT_HEADERS,
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "accept": "*/*",
      cookie: buildCookieHeader(sessionId),
    },
    body,
  });

  const text = await response.text();
  return { status: response.status, text };
}

module.exports = {
  fetchMatchPageHtml,
  parseRound,
  submitAnswer,
};
