# match_18

## 这题分享什么

第 18 题主要分享“服务端时间戳参与加密参数生成”这类题型。

页面前端会把时间戳转成十六进制，再重复拼成 AES 的 `key` 和 `iv`，最后把 `<page>|固定模板串` 加密成请求参数 `v`。

## 核心结论

- 第 1 页可以直接请求，不需要 `t` 和 `v`。
- 第 2-5 页需要先请求 `/api/getTime`。
- `t = floor(serverTime / 1000)`。
- `hex(t).padStart(8, "0").repeat(2)` 同时作为 AES-128-CBC 的 `key` 与 `iv`。
- 明文格式是 `<page>|111m733,222d733,333u733`。
- 第 5 页额外需要 `User-Agent: yuanrenxue`。

## 请求链

```text
GET /api/v/question/18data?page=1
  -> 第 1 页直接拿数据

GET /api/getTime
  -> 取服务端毫秒时间戳
  -> floor(ts / 1000) 得到秒级时间戳 t
  -> 计算 key / iv
  -> 生成 v

GET /api/v/question/18data?page=N&t=<t>&v=<v>
  -> 拉取第 2-4 页

GET /api/v/question/18data?page=5&t=<t>&v=<v>
  -> 同上，但 UA 必须为 yuanrenxue
```

## 代码结构

```text
match_18/
├── main.js
├── README.md
├── page_obfuscated_source.js
├── config/
│   ├── encrypt.js
│   └── session.json
└── utils/
    ├── encrypt.js
    └── request.js
```

- `main.js`
  读取登录态、逐页拉取、打印最终答案。
- `config/encrypt.js`
  放固定模板串，以及由时间戳推导 `key` 的辅助函数。
- `utils/encrypt.js`
  负责 AES-128-CBC 加密，生成参数 `v`。
- `utils/request.js`
  负责取服务端时间、拼请求、处理第 5 页 UA 特殊分支。
- `page_obfuscated_source.js`
  保留页面脚本快照，方便做静态对照。

## 运行

优先使用环境变量：

```bash
export MATCH18_SESSIONID="your_sessionid"
node main.js
```

也可以把登录态写进 `config/session.json`：

```json
{
  "sessionid": ""
}
```

## 分享时建议重点观察

- 为什么第 1 页不需要加密参数，而后面几页需要。
- 为什么题目要用服务端时间而不是本地时间。
- `key` 和 `iv` 为什么会相同。
- 第 5 页只在 UA 上多了一个校验。

## 可以继续补充的分享

- 把某一页的明文、时间戳、十六进制串、Base64 密文全部打印出来，补充中间值比对过程。
- 用固定输入给 `encryptToken()` 写个最小验证脚本。
- 对照 `page_obfuscated_source.js` 找前端实际改写 `Date.now` 和 XHR 的位置。
