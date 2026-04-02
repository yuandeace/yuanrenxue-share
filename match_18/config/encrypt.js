const TOKEN_TEMPLATE = "111m733,222d733,333u733";

function buildPlaintext(page) {
  return `${page}|${TOKEN_TEMPLATE}`;
}

function buildKeyHex(timestampSeconds) {
  return Number(timestampSeconds).toString(16).padStart(8, "0");
}

function buildKeyString(timestampSeconds) {
  // The page repeats the 8-hex timestamp chunk to form the 16-byte AES key and IV.
  const keyHex = buildKeyHex(timestampSeconds);
  return keyHex.repeat(2);
}

module.exports = {
  TOKEN_TEMPLATE,
  buildPlaintext,
  buildKeyHex,
  buildKeyString,
};
