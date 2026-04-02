const fs = require("fs");
const path = require("path");
const { fetchPageData } = require("./utils/request");

function loadSessionId() {
  const envSessionId = String(process.env.MATCH18_SESSIONID || process.env.YRX_SESSIONID || "").trim();
  if (envSessionId) {
    return envSessionId;
  }

  const sessionPath = path.join(__dirname, "config", "session.json");
  if (!fs.existsSync(sessionPath)) {
    throw new Error("missing MATCH18_SESSIONID and config/session.json");
  }

  const raw = fs.readFileSync(sessionPath, "utf8");
  const parsed = JSON.parse(raw);

  if (!parsed.sessionid) {
    throw new Error("config/session.json 缺少 sessionid，或设置 MATCH18_SESSIONID");
  }

  return parsed.sessionid;
}

async function main() {
  const sessionid = loadSessionId();
  let sum = 0;

  console.log("[*] 题目：第18题 - 时间戳派生 AES 参数");
  console.log("[*] 目标：拉取全部 5 页并计算总和");

  for (let page = 1; page <= 5; page += 1) {
    const data = await fetchPageData(page, sessionid);
    const pageSum = data.reduce((acc, value) => acc + value, 0);
    sum += pageSum;
    console.log(`[+] 第 ${page}/5 页：${data.length} 条，页和=${pageSum}`);
  }

  console.log("========== 计算结果 ==========");
  console.log(`答案：${sum}`);
  console.log("==============================");
}

main().catch((error) => {
  console.error(error.stack || String(error));
  process.exitCode = 1;
});
