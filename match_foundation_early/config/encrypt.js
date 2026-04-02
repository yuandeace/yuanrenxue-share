// 将你自己通关轮次的数据填入下方，或通过环境变量注入
// 示例结构保留，值已脱敏
module.exports = {
  verifiedRound: {
    key: process.env.FE_KEY || "",
    cipher: process.env.FE_CIPHER || "",
    goldAlgorithm: "3DES-ECB(raw key padded to 24 bytes)",
    gold: process.env.FE_GOLD || "",
    fire: process.env.FE_FIRE || "",
    wood: "wood_reiki_yrx",
    water: process.env.FE_WATER || "",
    earthCipher: process.env.FE_EARTH_CIPHER || "",
    earthAlgorithm: "3DES-ECB(raw key padded to 24 bytes)",
    earth: process.env.FE_EARTH || "",
    answer: process.env.FE_ANSWER || "",
  },
  notes: {
    goldFamilies: [
      "16-byte key rounds frequently decrypt with AES-128-ECB",
      "8-byte key rounds can decrypt with 3DES-ECB using the raw key padded to 24 bytes",
    ],
    requestFindings: [
      "Fresh-page data changes almost every load; solve within one page instance.",
      "Wrong gold/fire/wood with valid sign+ts yields fake water arg4 instead of hard failure.",
      "The browser-side $.ajax wrapper appends sign and ts before delegating to jQuery.ajax.",
      "A live paused frame exposed serialized sign input like 木=...&火=...&金=... plus /api/question/foundation_early|ts.",
    ],
    signStatus: "Generic fresh-round __Do environment fitting in pure Node is still open.",
  },
};
