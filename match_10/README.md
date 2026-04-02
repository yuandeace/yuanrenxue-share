# match_10

## 这题分享什么

第 10 题主要分享“页面壳层接管请求”这条思路。

真正起作用的不是页面上显眼的变量，而是页面脚本对 `XMLHttpRequest` 的重写。只要把运行时环境还原到位，让壳层自然接管请求，动态参数就会自己生成。

## 核心结论

- 目标是拉取 5 页数据并求和。
- 第 1 页不是手搓参数请求，而是等待页面初始化后自动发出。
- 页面壳层会接管 `XMLHttpRequest`，并在请求时注入 `m`。
- 每一页响应里的 `k.k = "变量名|数值"` 必须回写到 `window`，否则下一页会失败。
- 第 5 页额外要求 `User-Agent: yuanrenxue`。

## 请求链

```text
GET /match/10
  -> 页面脚本启动
  -> 壳层接管 XMLHttpRequest
  -> 自动拉取第 1 页
  -> 读取响应里的 k 值并回写 window
  -> 手动继续请求第 2-5 页
  -> 第 5 页切换 UA 为 yuanrenxue
  -> 汇总 50 个数字并求和
```

## 代码结构

```text
match_10/
├── main.js
├── package.json
├── README.md
├── config/
│   ├── encrypt.js
│   └── session.json
└── utils/
    ├── encrypt.js
    └── request.js
```

- `main.js`
  读取配置、启动采集、打印每页数据和最终答案。
- `config/encrypt.js`
  放页面 URL、默认 UA 和超时常量。
- `config/session.json`
  本地运行配置，建议只保留空模板。
- `utils/encrypt.js`
  创建 JSDOM 运行时、补齐最小浏览器环境、拦截并记录题目响应。
- `utils/request.js`
  按题目节奏串起 5 页请求，并计算总和。

## 运行方式

```bash
cd match_10
npm install
```

二选一提供登录态：

```bash
export MATCH10_SESSIONID="your_sessionid"
npm start
```

或者编辑 `config/session.json`：

```json
{
  "sessionid": "",
  "userAgent": "Mozilla/5.0 ...",
  "firstPageTimeoutMs": 10000
}
```

## 分享时建议重点观察

- 为什么第 1 页不能直接照搬后续请求逻辑。
- 为什么 `window.token` 这类表面变量不是关键。
- `TraceXHR` 在什么时机拿到响应并回写 `k`。
- 第 5 页只改 UA 就能过，说明校验点很窄。

## 适合继续扩展的方向

- 把 `requestQuestionPage` 的请求与响应中间值单独打印出来，做浏览器对比。
- 补一个最小验证脚本，只测 `applyQuestionKey` 的回写行为。
- 在 README 里记录一次真实运行的分页样式，但不要提交真实登录态。
