const {
  TARGET_URL,
  SUBMIT_URL,
  USER_AGENT,
} = require("../config/encrypt");

async function fetchText(url, { sessionId, referer } = {}) {
  const headers = {
    "User-Agent": USER_AGENT,
  };

  if (referer) {
    headers.Referer = referer;
  }

  if (sessionId) {
    headers.Cookie = `sessionid=${sessionId}`;
  }

  const response = await fetch(url, { headers });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`GET ${url} failed: ${response.status} ${text.slice(0, 200)}`);
  }

  return text;
}

async function submitAnswer({ sessionId, answer }) {
  const response = await fetch(SUBMIT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Cookie: `sessionid=${sessionId}`,
      Origin: "https://match.yuanrenxue.cn",
      Referer: TARGET_URL,
      "User-Agent": USER_AGENT,
      "X-Requested-With": "XMLHttpRequest",
    },
    body: new URLSearchParams({ answer }).toString(),
  });

  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (err) {
    json = null;
  }

  return {
    status: response.status,
    ok: response.ok,
    text,
    json,
  };
}

module.exports = {
  fetchText,
  submitAnswer,
};
