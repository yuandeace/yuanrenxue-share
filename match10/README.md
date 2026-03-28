# match_10

## 题目信息

- 题号：第 10 题
- 题目：`js 混淆 - 重放攻击对抗`
- 目标：请求全部 5 页数据，并将 50 个数字全部加和

## 接口链路

页面初始化时，真实链路是：

1. `GET /match/10`
2. 页面加载 `rs.js`、`/api2/10`、`/api/10/offset`
3. `general.js` 触发 `GET /api/topic_info?href=10&m=...`
4. `common.js` 触发 `GET /api/user?m=...`
5. 分页脚本触发 `GET /api/question/10?page=N&m=...`

关键点不是页面里明文的 `token`，而是壳层重写了 XHR 请求，把 `page=N` 自动改造成带 `m=` 的真实请求。

## 静态分析结论

- 页面脚本里虽然写了 `token: window.token`，但当前题真正生效的是壳层对 `XMLHttpRequest.open/send` 的接管。
- `window.request`、`window.token` 在有效解法里都不是核心入口。
- `/api/question/10` 的真实请求在发送前会被改写成：
  - `/api/question/10?page=N&m=<long-string>`
- 响应会带一个回写字段：
  - `{"k":{"k":"变量名|数字"}}`
- 这个 `k` 必须在运行时执行：
  - `window[变量名] = 数字`
- 第 5 页有额外校验：
  - 请求头 `User-Agent` 必须是 `yuanrenxue`

## 动态验证结论

通过 `jsdom + 真实 XHR` 验证到：

- 第 1 页成功响应样例：
  - `[113100,607859,539178,377938,703747,780164,776870,868855,589829,837284]`
- 第 1-4 页都可以在同一运行时里直接继续请求。
- 第 5 页如果不改 `User-Agent`，会返回提示数组：
  - `["请","将","UA","改","为","yuan","ren","xue","哦"]`
- 第 5 页将 `User-Agent` 单独改成 `yuanrenxue` 后即可返回真实数字。
- 直接复用旧抓包脚本不稳定，因为壳资源会变化；最终脚本每次先抓当前页面和当前壳资源，再在 Node 里复现。

## 纯 Node.js 还原思路

最终脚本不依赖真实浏览器自动化，只做协议请求：

1. 先请求当前 `/match/10`
2. 用 `jsdom` 在 Node 中加载当前页面和当前脚本资源
3. 让壳层继续接管 `XMLHttpRequest`，自动生成每页所需的 `m`
4. 等待页面自动完成第 1 页请求
5. 第 2-4 页继续用同一运行时请求
6. 第 5 页额外加请求头 `User-Agent: yuanrenxue`
7. 将 5 页全部数字求和

这仍然是纯 Node 协议方案，因为最终采集靠的是 Node 中发出的 HTTP 请求，而不是浏览器点击或读取渲染后的 DOM 文本。

## 文件

- `main.js`
- `config/encrypt.js`
- `config/session.json`
- `utils/encrypt.js`
- `utils/request.js`
