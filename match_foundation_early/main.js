const { verifiedRound } = require("./config/encrypt");
const {
  base64NoPad,
  decryptGoldByCandidates,
  decryptEarthByCandidates,
  md5,
} = require("./utils/encrypt");
const { fetchMatchPageHtml, parseRound, submitAnswer } = require("./utils/request");

async function main() {
  const sessionId = process.env.SESSIONID || "";
  const shouldSubmit = process.env.SUBMIT === "1";

  console.log("[*] 题目：foundation_early");
  console.log("[*] 说明：当前脚本复放已验证成功的一轮。该答案和当时那一轮题面绑定，不是跨轮次通用答案。");

  const goldResult = decryptGoldByCandidates(verifiedRound.key, verifiedRound.cipher);
  const fire = base64NoPad(goldResult.value);
  const earthResult = decryptEarthByCandidates(verifiedRound.water, verifiedRound.earthCipher);
  const answer = md5(goldResult.value + fire + verifiedRound.wood + verifiedRound.water + earthResult.value);

  console.log("[+] 已验证轮次");
  console.log(`    key=${verifiedRound.key}`);
  console.log(`    cipher=${verifiedRound.cipher}`);
  console.log(`    gold=${goldResult.value}`);
  console.log(`    fire=${fire}`);
  console.log(`    wood=${verifiedRound.wood}`);
  console.log(`    water=${verifiedRound.water}`);
  console.log(`    earth=${earthResult.value}`);

  console.log("");
  console.log("========== 计算结果 ==========");
  console.log(`答案：${answer}`);
  console.log("==============================");

  const { status, html } = await fetchMatchPageHtml(sessionId);
  const currentRound = parseRound(html);
  console.log("");
  console.log("[+] 当前直连抓取");
  console.log(`    status=${status}`);
  console.log(`    key=${currentRound.key}`);
  console.log(`    cipher=${currentRound.cipher}`);
  console.log(`    earthCipher=${currentRound.earthCipher}`);

  if (shouldSubmit) {
    console.log("");
    if (
      currentRound.key === verifiedRound.key &&
      currentRound.cipher === verifiedRound.cipher &&
      currentRound.earthCipher === verifiedRound.earthCipher
    ) {
      const submitResult = await submitAnswer(sessionId, answer);
      console.log("[+] 提交结果");
      console.log(`    status=${submitResult.status}`);
      console.log(`    body=${submitResult.text}`);
    } else {
      console.log("[!] 已跳过提交");
      console.log("    当前抓到的是新一轮题面，不能直接用历史轮次答案提交。");
      console.log("    真正成功提交证据已写入 README。");
    }
  }
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exitCode = 1;
});
