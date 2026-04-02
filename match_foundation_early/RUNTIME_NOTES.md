## foundation_early 运行时笔记

这个文件保留的是“便于分享”的结论，不保留可以直接复用的实时轮次数据。

## 已确认的运行时结论

- 页面在每次 fresh load 之间可能变化，因此 `key`、`cipher` 和 `earthCipher` 必须在同一轮页面实例里完成求解。
- 当 `sign/ts` 正确、但 `gold/fire/wood` 组合错误时，`/api/question/foundation_early` 不一定直接报错，也可能返回假的 `water` 值。
- 浏览器侧对 `$.ajax` 做了一层包装，会在真正调用 jQuery ajax 之前补上 `sign` 和 `ts`。
- 在暂停调用栈里可以确认，签名输入的序列化顺序是固定排序后的：
  - `木=...&火=...&金=...`
- 另一处暂停调用栈可以确认，签名 seed 的格式是：
  - `/api/question/foundation_early|<ts>`

## 当前已确认的算法族

- Gold：
  - `16-byte key` 轮次可以用 `AES-128-ECB` 解密。
  - `8-byte key` 轮次可以用“原始 key 补齐到 24 字节”的 `3DES-ECB` 解密。
- Fire：
  - `fire = base64NoPad(gold)`。
- Wood：
  - 固定值：`wood_reiki_yrx`。
- Earth：
  - `8-byte water` 轮次可以用“原始 key 补齐到 24 字节”的 `3DES-ECB` 解密。
  - 部分 `16-byte water` 轮次可以用 `AES-128-ECB` 解密，但这个分支还没有完全分类完。

## 一轮已验证数据的结构

- key: `<16-byte-or-8-byte-key>`
- cipher: `<base64-ciphertext>`
- earthCipher: `<base64-ciphertext>`
- gold: `<printable-ascii>`
- fire: `<base64-no-pad>`
- wood: `wood_reiki_yrx`
- water: `<printable-ascii>`
- earth: `<printable-ascii>`
- answer: `<32-hex-md5>`

这里故意保留字段结构，但不暴露可直接复用的 live round 数据。

## Ti 白盒结果

- `Oo(str)` 的作用是：`utf8 string -> Uint8Array`
- `ko(hex)` 的作用是：`hex string -> Uint8Array`
- `xo(bytes)` 的作用是：`Uint8Array -> utf8 string`
- `Eo(keyBytes)` 本质上是一个类似 RC4 的 KSA，但它不是从 `0..255` 的恒等排列开始，而是从一个固定的 256 字节 base permutation 开始。
- 这个固定排列已经保存在 `utils/foundation_ti.js` 的 `FOUNDATION_TI_BASE` 里。
- `encodeString` 和 `decodeString` 是对称的，并且不会修改 `this.ksa`。

## Ti 的变换规则

给定：

- `S = ksa.slice()`
- `j = 0`
- `BASE = FOUNDATION_TI_BASE`

对每个字节下标 `i`：

1. `left = S[i]`
2. `j = S[(left + j) & 0xff]`
3. `right = S[j]`
4. `mask = S[S[right] + BASE[i]] ?? 0`
5. `out[i] = in[i] ^ mask`
6. `S[i] = right`
7. `S[j] = left`

需要特别注意：

- 最后一次查表不会再做 `& 0xff` 回绕。
- 如果 `S[right] + BASE[i] > 255`，查表结果会变成 `undefined`，此时 mask 字节会回退成 `0`。

## 已确认的 Node 与浏览器差异点

- `Function.prototype.toString.call(setInterval)`
- `NamedNodeMap` 属性读取
- `CSSStyleDeclaration` 的索引访问

最后一个差异尤其关键：

- 浏览器里：`style[0] === "color"`
- 不完整的 shim 里：`undefined`

把这部分行为补齐以后，`Do` 输出已经能和 Chrome 在已验证样本上对齐。

## 仍然未完全解决的部分

- fresh-round `sign/ts` 的完全泛化纯 Node 复现
- 所有 `16-byte water` earth 轮次的完整算法族覆盖
