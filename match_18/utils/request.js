const { encryptToken } = require("./encrypt");

const BASE_URL = "https://match.yuanrenxue.cn";

async function requestText(path, { sessionid, userAgent } = {}) {
  const headers = {
    Referer: `${BASE_URL}/match/18`,
  };

  if (sessionid) {
    headers.Cookie = `sessionid=${sessionid}`;
  }

  if (userAgent) {
    headers["User-Agent"] = userAgent;
  }

  const response = await fetch(`${BASE_URL}${path}`, { headers });
  const text = await response.text();
  return { response, text };
}

async function requestJson(path, options = {}) {
  const { response, text } = await requestText(path, options);
  let data = null;

  try {
    data = JSON.parse(text);
  } catch {
    data = null;
  }

  return { response, text, data };
}

async function getServerTimestamp(sessionid) {
  const { text } = await requestText("/api/getTime", { sessionid });
  return Math.floor(Number(text.trim()) / 1000);
}

async function fetchPageData(page, sessionid) {
  if (page === 1) {
    // Page 1 is the clean baseline request with no derived parameters.
    const { response, data, text } = await requestJson(`/api/v/question/18data?page=${page}`, {
      sessionid,
    });

    if (!response.ok || !data?.data) {
      throw new Error(`page=${page} 请求失败: ${response.status} ${text}`);
    }

    return data.data;
  }

  const timestampSeconds = await getServerTimestamp(sessionid);
  const token = encodeURIComponent(encryptToken(page, timestampSeconds));
  // Page 5 adds a narrow UA check on top of the normal encrypted parameters.
  const userAgent = page === 5 ? "yuanrenxue" : undefined;
  const path = `/api/v/question/18data?page=${page}&t=${timestampSeconds}&v=${token}`;
  const { response, data, text } = await requestJson(path, {
    sessionid,
    userAgent,
  });

  if (!response.ok || !data?.data) {
    throw new Error(`page=${page} 请求失败: ${response.status} ${text}`);
  }

  return data.data;
}

module.exports = {
  BASE_URL,
  fetchPageData,
  getServerTimestamp,
  requestJson,
  requestText,
};
