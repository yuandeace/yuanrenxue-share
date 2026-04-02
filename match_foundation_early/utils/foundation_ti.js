const FOUNDATION_TI_BASE = Object.freeze([
  214, 144, 233, 254, 204, 225, 61, 183, 22, 182, 20, 194, 40, 251, 44, 5,
  43, 103, 154, 118, 42, 190, 4, 195, 170, 68, 19, 38, 73, 134, 6, 153,
  156, 66, 80, 244, 145, 239, 152, 122, 51, 84, 11, 67, 237, 207, 172, 98,
  228, 179, 28, 169, 201, 8, 232, 149, 128, 223, 148, 250, 117, 143, 63, 166,
  71, 7, 167, 252, 243, 115, 23, 186, 131, 89, 60, 25, 230, 133, 79, 168,
  104, 107, 129, 178, 113, 100, 218, 139, 248, 235, 15, 75, 112, 86, 157, 53,
  30, 36, 14, 94, 99, 88, 209, 162, 37, 34, 124, 59, 1, 33, 120, 135,
  212, 0, 70, 87, 159, 211, 39, 82, 76, 54, 2, 231, 160, 196, 200, 158,
  234, 191, 138, 210, 64, 199, 56, 181, 163, 247, 242, 206, 249, 97, 21, 161,
  224, 174, 93, 164, 155, 52, 26, 85, 173, 147, 50, 48, 245, 140, 177, 227,
  29, 246, 226, 46, 130, 102, 202, 96, 192, 41, 35, 171, 13, 83, 78, 111,
  213, 219, 55, 69, 222, 253, 142, 47, 3, 255, 106, 114, 109, 108, 91, 81,
  141, 27, 175, 146, 187, 221, 188, 127, 17, 217, 92, 65, 31, 16, 90, 216,
  10, 193, 49, 136, 165, 205, 123, 189, 45, 116, 208, 18, 184, 229, 180, 176,
  137, 105, 151, 74, 12, 150, 119, 126, 101, 185, 241, 9, 197, 110, 198, 132,
  24, 240, 125, 236, 58, 220, 77, 32, 121, 238, 95, 62, 215, 203, 57, 72,
]);

function buildFoundationTiSeed(pathname, ts) {
  return `${pathname}|${ts}`;
}

function buildFoundationTiKsa(seed) {
  const keyBytes = Buffer.from(String(seed), "utf8");

  if (!keyBytes.length) {
    throw new Error("foundation_ti seed must not be empty");
  }

  const state = FOUNDATION_TI_BASE.slice();
  let j = 0;

  for (let i = 0; i < 256; i += 1) {
    j = (j + state[i] + keyBytes[i % keyBytes.length]) & 0xff;
    [state[i], state[j]] = [state[j], state[i]];
  }

  return state;
}

function foundationTiTransformBytes(inputBytes, ksa) {
  const src = Uint8Array.from(inputBytes);
  const dst = new Uint8Array(src.length);
  const state = ksa.slice();
  let j = 0;

  for (let i = 0; i < src.length; i += 1) {
    const left = state[i];
    j = state[(left + j) & 0xff];

    const right = state[j];
    // The final lookup intentionally does not wrap with & 0xff.
    const lookupIndex = state[right] + FOUNDATION_TI_BASE[i];
    const mask = state[lookupIndex] ?? 0;

    dst[i] = src[i] ^ mask;
    state[i] = right;
    state[j] = left;
  }

  return dst;
}

function foundationTiMask(length, seed) {
  return foundationTiTransformBytes(new Uint8Array(length), buildFoundationTiKsa(seed));
}

function foundationTiEncodeString(input, seed) {
  const bytes = Buffer.from(String(input), "utf8");
  return Buffer.from(foundationTiTransformBytes(bytes, buildFoundationTiKsa(seed))).toString("hex");
}

function foundationTiDecodeString(hex, seed) {
  const bytes = Uint8Array.from(Buffer.from(hex, "hex"));
  return Buffer.from(foundationTiTransformBytes(bytes, buildFoundationTiKsa(seed))).toString("utf8");
}

function serializeFoundationQuestionData(data) {
  return Object.keys(data)
    .sort()
    .map((key) => `${key}=${data[key]}`)
    .join("&");
}

function buildFoundationSignFromDigest({ pathname, ts, digest }) {
  return foundationTiEncodeString(digest, buildFoundationTiSeed(pathname, ts));
}

module.exports = {
  FOUNDATION_TI_BASE,
  buildFoundationTiSeed,
  buildFoundationTiKsa,
  foundationTiTransformBytes,
  foundationTiMask,
  foundationTiEncodeString,
  foundationTiDecodeString,
  serializeFoundationQuestionData,
  buildFoundationSignFromDigest,
};
