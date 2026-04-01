const crypto = require("crypto");
const { buildKeyString, buildPlaintext } = require("../config/encrypt");

function encryptToken(page, timestampSeconds) {
  const key = Buffer.from(buildKeyString(timestampSeconds), "utf8");
  const cipher = crypto.createCipheriv("aes-128-cbc", key, key);
  const plaintext = buildPlaintext(page);
  return Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]).toString("base64");
}

module.exports = {
  encryptToken,
};
