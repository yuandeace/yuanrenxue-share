const crypto = require("crypto");

function base64NoPad(text) {
  return Buffer.from(text, "utf8").toString("base64").replace(/=+$/g, "");
}

function md5(text) {
  return crypto.createHash("md5").update(text).digest("hex");
}

function isPrintableAscii(text) {
  return /^[\x20-\x7e]+$/.test(text);
}

function decryptAes128Ecb(key, cipher) {
  const decipher = crypto.createDecipheriv("aes-128-ecb", Buffer.from(key, "utf8"), null);
  decipher.setAutoPadding(true);
  return Buffer.concat([
    decipher.update(Buffer.from(cipher, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

function decrypt3DesEcbRawKey(key, cipher) {
  const keyBuf = Buffer.alloc(24);
  Buffer.from(key, "utf8").copy(keyBuf);
  const decipher = crypto.createDecipheriv("des-ede3", keyBuf, null);
  decipher.setAutoPadding(true);
  return Buffer.concat([
    decipher.update(Buffer.from(cipher, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

function decryptGoldByCandidates(key, cipher) {
  const tries = [];

  if (key.length === 16) {
    try {
      const out = decryptAes128Ecb(key, cipher);
      tries.push({ algorithm: "AES-128-ECB", value: out });
      if (isPrintableAscii(out)) return { algorithm: "AES-128-ECB", value: out };
    } catch (error) {
      tries.push({ algorithm: "AES-128-ECB", error: error.message });
    }
  }

  try {
    const out = decrypt3DesEcbRawKey(key, cipher);
    tries.push({ algorithm: "3DES-ECB(raw key padded to 24 bytes)", value: out });
    if (isPrintableAscii(out)) {
      return { algorithm: "3DES-ECB(raw key padded to 24 bytes)", value: out };
    }
  } catch (error) {
    tries.push({ algorithm: "3DES-ECB(raw key padded to 24 bytes)", error: error.message });
  }

  return { algorithm: null, value: null, tries };
}

function decryptEarthByCandidates(water, earthCipher) {
  const tries = [];

  try {
    const out = decrypt3DesEcbRawKey(water, earthCipher);
    tries.push({ algorithm: "3DES-ECB(raw key padded to 24 bytes)", value: out });
    if (isPrintableAscii(out)) {
      return { algorithm: "3DES-ECB(raw key padded to 24 bytes)", value: out };
    }
  } catch (error) {
    tries.push({ algorithm: "3DES-ECB(raw key padded to 24 bytes)", error: error.message });
  }

  if (water.length === 16) {
    try {
      const out = decryptAes128Ecb(water, earthCipher);
      tries.push({ algorithm: "AES-128-ECB", value: out });
      if (isPrintableAscii(out)) return { algorithm: "AES-128-ECB", value: out };
    } catch (error) {
      tries.push({ algorithm: "AES-128-ECB", error: error.message });
    }
  }

  return { algorithm: null, value: null, tries };
}

module.exports = {
  base64NoPad,
  md5,
  decryptAes128Ecb,
  decrypt3DesEcbRawKey,
  decryptGoldByCandidates,
  decryptEarthByCandidates,
};
