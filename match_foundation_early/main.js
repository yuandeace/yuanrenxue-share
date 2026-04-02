const {
  base64NoPad,
  decryptGoldByCandidates,
  decryptEarthByCandidates,
  md5,
} = require("./utils/encrypt");
const {
  fetchMatchPageHtml,
  parseRound,
  parseFoundationWater,
  requestFoundationQuestion,
  submitAnswer,
} = require("./utils/request");

const WOOD_KEY = "\u6728";
const FIRE_KEY = "\u706b";
const GOLD_KEY = "\u91d1";
const WOOD_VALUE = "wood_reiki_yrx";

function buildQuestionData({ gold, fire }) {
  return {
    [WOOD_KEY]: WOOD_VALUE,
    [FIRE_KEY]: fire,
    [GOLD_KEY]: gold,
  };
}

async function solveOneRound(sessionId) {
  const { status, html } = await fetchMatchPageHtml(sessionId);
  const round = parseRound(html);

  if (!round.key || !round.cipher || !round.earthCipher) {
    return {
      ok: false,
      reason: "page_parse_failed",
      pageStatus: status,
      round,
    };
  }

  const goldResult = decryptGoldByCandidates(round.key, round.cipher);
  if (!goldResult.value) {
    return {
      ok: false,
      reason: "gold_not_supported",
      pageStatus: status,
      round,
      goldResult,
    };
  }

  const gold = goldResult.value;
  const fire = base64NoPad(gold);
  const data = buildQuestionData({ gold, fire });
  const questionResult = await requestFoundationQuestion(sessionId, data);
  const water = parseFoundationWater(questionResult.text);

  if (!water) {
    return {
      ok: false,
      reason: "water_request_failed",
      pageStatus: status,
      round,
      goldResult,
      fire,
      questionResult,
    };
  }

  const earthResult = decryptEarthByCandidates(water, round.earthCipher);
  if (!earthResult.value) {
    return {
      ok: false,
      reason: "earth_not_supported",
      pageStatus: status,
      round,
      goldResult,
      fire,
      water,
      questionResult,
      earthResult,
    };
  }

  const answer = md5(gold + fire + WOOD_VALUE + water + earthResult.value);

  return {
    ok: true,
    pageStatus: status,
    round,
    goldResult,
    gold,
    fire,
    water,
    earthResult,
    answer,
    questionResult,
  };
}

async function main() {
  const sessionId = process.env.SESSIONID || "";
  const shouldSubmit = process.env.SUBMIT === "1";
  const maxAttempts = Number(process.env.MAX_ATTEMPTS || 20);

  if (!sessionId) {
    throw new Error("missing SESSIONID");
  }

  let solved = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const result = await solveOneRound(sessionId);
    console.log(`[attempt ${attempt}] reason=${result.reason || "ok"}`);

    if (!result.ok) {
      if (result.round) {
        console.log(`  key=${result.round.key || ""}`);
        console.log(`  cipher=${result.round.cipher || ""}`);
        console.log(`  earthCipher=${result.round.earthCipher || ""}`);
      }
      continue;
    }

    solved = result;
    break;
  }

  if (!solved) {
    throw new Error(`failed to solve a supported round within ${maxAttempts} attempts`);
  }

  console.log("");
  console.log("========== round ==========");
  console.log(`key=${solved.round.key}`);
  console.log(`cipher=${solved.round.cipher}`);
  console.log(`earthCipher=${solved.round.earthCipher}`);
  console.log(`gold=${solved.gold}`);
  console.log(`goldAlgorithm=${solved.goldResult.algorithm}`);
  console.log(`fire=${solved.fire}`);
  console.log(`water=${solved.water}`);
  console.log(`earth=${solved.earthResult.value}`);
  console.log(`earthAlgorithm=${solved.earthResult.algorithm}`);
  console.log("");
  console.log("========== sign ==========");
  console.log(`serialized=${solved.questionResult.serialized}`);
  console.log(`digest=${solved.questionResult.digest}`);
  console.log(`ts=${solved.questionResult.ts}`);
  console.log(`sign=${solved.questionResult.sign}`);
  console.log("");
  console.log("========== answer ==========");
  console.log(`answer=${solved.answer}`);

  if (shouldSubmit) {
    const submitResult = await submitAnswer(sessionId, solved.answer);
    console.log("");
    console.log("========== submit ==========");
    console.log(`status=${submitResult.status}`);
    console.log(`body=${submitResult.text}`);
  }
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exitCode = 1;
});
