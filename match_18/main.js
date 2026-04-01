const fs = require("fs");
const path = require("path");
const { fetchPageData } = require("./utils/request");

function loadSessionId() {
  const sessionPath = path.join(__dirname, "config", "session.json");
  const raw = fs.readFileSync(sessionPath, "utf8");
  const parsed = JSON.parse(raw);

  if (!parsed.sessionid) {
    throw new Error("config/session.json 缺少 sessionid");
  }

  return parsed.sessionid;
}

async function main() {
  const sessionid = loadSessionId();
  let sum = 0;

  console.log("题目 18: jsvmp - 洞察先机");
  console.log("目标: 拉取全部 5 页并计算总和");

  for (let page = 1; page <= 5; page += 1) {
    const data = await fetchPageData(page, sessionid);
    const pageSum = data.reduce((acc, value) => acc + value, 0);
    sum += pageSum;
    console.log(`第 ${page} 页: ${data.length} 条, 页和=${pageSum}`);
  }

  console.log(`最终答案: ${sum}`);
}

main().catch((error) => {
  console.error(error.stack || String(error));
  process.exitCode = 1;
});
