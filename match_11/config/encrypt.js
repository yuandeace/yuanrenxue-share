const TARGET_URL = "https://match.yuanrenxue.cn/match/11";
const SCRIPT_URL = "https://match.yuanrenxue.cn/static/new_match/question/11/yrx_check_devtools_jsvmp.js?v=1.0.2";
const SUBMIT_URL = "https://match.yuanrenxue.cn/a/11";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";
const SUFFIX_RE = /window\.secretkey\([^"]*"([0-9a-f]{16})"\)/i;
const ANSWER_RE = /^[0-9a-f]{128}$/i;

module.exports = {
  TARGET_URL,
  SCRIPT_URL,
  SUBMIT_URL,
  USER_AGENT,
  SUFFIX_RE,
  ANSWER_RE,
};
