const fs = require("fs");
const path = require("path");
const { solveMatch11 } = require("./utils/encrypt");

function loadRuntimeOptions() {
  const envSessionId = String(process.env.YRX_SESSIONID || "").trim();
  const configPath = path.join(__dirname, "config", "session.json");
  const timeoutMs = Number(process.env.MATCH11_TIMEOUT_MS || 10000);

  if (envSessionId) {
    return {
      sessionId: envSessionId,
      timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 10000,
    };
  }

  if (!fs.existsSync(configPath)) {
    throw new Error("missing YRX_SESSIONID and config/session.json");
  }

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const sessionId = String(config.sessionid || "").trim();
  if (!sessionId) {
    throw new Error("missing YRX_SESSIONID or config/session.json sessionid");
  }

  return {
    sessionId,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 10000,
  };
}

async function main() {
  const result = await solveMatch11(loadRuntimeOptions());

  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err && (err.stack || err.message || String(err)));
  process.exitCode = 1;
});
