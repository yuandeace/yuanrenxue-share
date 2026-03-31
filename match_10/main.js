const fs = require("fs");
const path = require("path");
const { DEFAULT_UA } = require("./utils/encrypt");
const { collectAllPages } = require("./utils/request");

function loadSessionConfig() {
  const configPath = path.join(__dirname, "config", "session.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  return {
    firstPageTimeoutMs: Number(config.firstPageTimeoutMs || 10000),
    sessionid: String(process.env.MATCH10_SESSIONID || config.sessionid || ""),
    userAgent: String(process.env.MATCH10_UA || config.userAgent || DEFAULT_UA),
  };
}

function printPageNumbers(pages) {
  for (const item of pages) {
    const numbers = Array.isArray(item.response.data) ? item.response.data.join(", ") : "";
    console.log(`第 ${item.page} 页: ${numbers}`);
  }
}

async function main() {
  const sessionConfig = loadSessionConfig();
  if (!sessionConfig.sessionid) {
    throw new Error("Missing sessionid. Update config/session.json or set MATCH10_SESSIONID.");
  }

  console.log("[*] 题目：第10题 - js 混淆 重放攻击对抗");
  console.log("[*] 目标：请求全部 5 页数据并将全部数字加和");

  const result = await collectAllPages(sessionConfig, (progress) => {
    if (progress.stage === "waiting") {
      console.log(`[+] 正在采集第 ${progress.page}/${progress.totalPages} 页...`);
      return;
    }
    console.log(`✓ 获取 ${progress.count} 条数据`);
  });

  console.log(`[+] 采集完成，共 ${result.values.length} 条数据`);
  printPageNumbers(result.pages);
  console.log("");
  console.log("========== 计算结果 ==========");
  console.log(`答案：${result.answer}`);
  console.log("==============================");

  if (result.errors.length > 0) {
    console.log("[!] 运行期附带告警:");
    for (const error of result.errors) {
      console.log(`- ${error}`);
    }
  }
}

main().catch((error) => {
  console.error(String(error && error.stack ? error.stack : error));
  process.exitCode = 1;
});
