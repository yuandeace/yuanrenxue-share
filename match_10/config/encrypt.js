const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PAGE_URL = "https://match.yuanrenxue.cn/match/10";
const BASE_URL = "https://match.yuanrenxue.cn";
const DEFAULT_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36";
const FIRST_PAGE_TIMEOUT_MS = 10000;

function readText(file) {
  return fs.readFileSync(path.join(ROOT, file), "utf8");
}

function readBuffer(file) {
  return fs.readFileSync(path.join(ROOT, file));
}

function getLocalResourceMap() {
  return new Map([
    [`${BASE_URL}/static/new_match/jquery/jquery.js`, readBuffer("jquery_live.js")],
    [`${BASE_URL}/static/new_match/question/10/rs.js`, readBuffer("live_now_rs_20260328.js")],
    [`${BASE_URL}/api2/10`, readBuffer("live_now_api2_20260328.bin")],
    [`${BASE_URL}/api/10/offset`, readBuffer("live_now_offset_20260328.txt")],
    [`${BASE_URL}/static/new_match/question/general.js`, Buffer.from(readText("current_live_req20_general.js"))],
    [`${BASE_URL}/static/new_match/js/common.js`, Buffer.from(readText("current_live_req21_common.js"))],
    [
      `${BASE_URL}/static/new_match/alert.js`,
      Buffer.from("window.failedAlert=window.failedAlert||function(){};window.successAlert=window.successAlert||function(){};"),
    ],
    [`${BASE_URL}/static/new_match/modallayer/modallayer-ie.min.js`, Buffer.from("")],
    [`${BASE_URL}/static/new_match/js/tierStyleMap.js`, Buffer.from("")],
    [`${BASE_URL}/static/new_match/js/expUp.js`, Buffer.from("")],
  ]);
}

module.exports = {
  BASE_URL,
  DEFAULT_UA,
  FIRST_PAGE_TIMEOUT_MS,
  PAGE_URL,
  ROOT,
  getLocalResourceMap,
  readBuffer,
  readText,
};
