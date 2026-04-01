# 猿人学 JS 逆向挑战 - 纯 Node.js 协议解法

猿人学（[match.yuanrenxue.cn](https://match.yuanrenxue.cn)）JS 逆向系列题目的**纯 Node.js 协议级解法**合集。

所有题目均不依赖浏览器自动化（Puppeteer / Playwright），全部通过 Node.js 直接发送 HTTP 请求完成数据采集与答案计算。

只会有困难以上的题目


## 已完成题目

| 题号 | 题目 | 核心技术 | 解法类型 | 目录 |
|:---:|------|---------|:-------:|------|
| 突破 | 五行灵气收集 | AES-128-ECB / 3DES-ECB 多算法候选解密、Base64 编码、MD5 哈希 | 密码学还原 | [match_foundation_early](./match_foundation_early/) |
| 10 | JS 混淆 - 重放攻击对抗 | JSDOM 运行时还原、XHR 拦截、壳层 `m` 参数自动生成、k 值回写 | 运行时模拟 | [match_10](./match_10/) |
| 18 | JS 逆向 - AES 动态加密 | AES-128-CBC 动态加密、服务端时间戳同步、XHR 劫持还原、UA 校验 | 密码学还原 | [match_18](./match_18/) |

> 更多题目持续更新中...

---

## 题目概览

### 突破题：五行灵气收集

**目标**：收集金、火、木、水、土五种灵气，按 `金火木水土` 拼接后做 32 位小写 MD5。

**解题链路**：

```
页面 HTML 中提取 key + cipher
    ↓
候选算法解密（AES-128-ECB / 3DES-ECB）→ 金灵气
    ↓
Base64 编码（去 padding）→ 火灵气
    ↓
页面固定值 → 木灵气
    ↓
提交金+火+木，服务端返回 → 水灵气
    ↓
水灵气作 key，解密土密文 → 土灵气
    ↓
拼接五行 → MD5 → 最终答案
```

**关键发现**：题目会轮换加密算法——16 位 key 用 AES-128-ECB，8 位 key 用 3DES-ECB（raw key 补齐 24 字节）。脚本自动候选尝试，无需手动判断。

### 第 10 题：JS 混淆 - 重放攻击对抗

**目标**：请求全部 5 页数据，将 50 个数字全部加和。

**解题链路**：

```
GET /match/10 → 获取页面 HTML + 壳层脚本
    ↓
JSDOM 加载页面，壳层自然接管 XMLHttpRequest
    ↓
壳层重写 XHR.open/send → 自动注入 m= 参数
    ↓
TraceXHR 拦截响应 → 提取数据 + k 值回写
    ↓
循环请求 5 页（第 5 页 UA 改为 "yuanrenxue"）
    ↓
50 个数字求和 → 最终答案
```

**关键发现**：页面脚本里的 `window.token` 是障眼法，真正生效的是壳层对 XHR 的接管。每次响应的 `{"k":{"k":"变量名|数字"}}` 必须回写到 `window` 上，否则下一页请求会失败。

### 第 18 题：JS 逆向 - AES 动态加密

**目标**：请求全部 5 页数据，将 50 个数字全部加和。

**解题链路**：

```
GET /api/v/question/18data?page=1 → 第 1 页直接请求
    ↓
GET /api/getTime → 服务端毫秒时间戳 → t = floor(ts / 1000)
    ↓
hex(t) 补齐 8 位，重复两次 → AES-128-CBC key & iv
    ↓
明文 "<page>|111m733,222d733,333u733" → AES 加密 → Base64 → v
    ↓
GET /api/v/question/18data?page=N&t=<t>&v=<v> → 第 2-4 页
    ↓
第 5 页同上，UA 改为 "yuanrenxue"
    ↓
50 个数字求和 → 最终答案
```

**关键发现**：第 1 页无需加密参数可直接请求；第 2-5 页前端通过重写 `Date.now` 和 `XMLHttpRequest.prototype.open` 自动注入 `t` 和 `v` 参数；加密算法为 AES-128-CBC + PKCS7，key/iv 由服务端时间戳的 hex 值重复拼接而成；第 5 页额外要求 UA 为 `yuanrenxue`。

---

## 快速开始

### 前置条件

- **Node.js >= 18**（需要原生 `fetch` 支持）
- 猿人学平台账号（需要有效的 `sessionid`）

### 突破题

```bash
cd match_foundation_early
npm install

# 配置 sessionid
export SESSIONID="your_sessionid_here"

# 运行
node main.js

# 运行并提交答案（仅当页面轮次匹配时才会真正提交）
SUBMIT=1 node main.js
```

输出示例：

```
[*] 题目：foundation_early
[*] 说明：当前脚本复放已验证成功的一轮。该答案和当时那一轮题面绑定，不是跨轮次通用答案。
[+] 已验证轮次
    key=8T8Teq9Mxxxxx
    cipher=2gtJpxxxxeYhKVMoZsP01TxlVoO65xV6/LA+
    gold=aT9pxxxxxCcbqUQcdABEb
    fire=YVQ5cxxxxxxxENjYnFVUWNkQUJFYg
    wood=wood_reiki_yrx
    water=dx0XxxxIE1f
    earth=GzweWjQKn76WNZfw

========== 计算结果 ==========
答案：xxxxxxx
==============================
```

### 第 10 题

```bash
cd match_10
npm install

# 配置 sessionid（二选一）
# 方式一：编辑 config/session.json
# 方式二：环境变量
export MATCH10_SESSIONID="your_sessionid_here"

# 运行
npm start
```

输出示例：

```
[*] 题目：第10题 - js 混淆 重放攻击对抗
[*] 目标：请求全部 5 页数据并将全部数字加和
[+] 正在采集第 1/5 页...
✓ 获取 10 条数据
[+] 正在采集第 2/5 页...
✓ 获取 10 条数据
...
[+] 采集完成，共 50 条数据

========== 计算结果 ==========
答案：XXXXXXX
==============================
```

### 第 18 题

```bash
cd match_18

# 配置 sessionid
# 编辑 config/session.json，填入你的 sessionid

# 运行
node main.js
```

输出示例：

```
[*] 题目：第18题 - JS 逆向 AES 动态加密
[*] 目标：请求全部 5 页数据并将全部数字加和
[+] 正在采集第 1/5 页...
✓ 获取 10 条数据
[+] 正在采集第 2/5 页...
✓ 获取 10 条数据
...
[+] 采集完成，共 50 条数据

========== 计算结果 ==========
答案：XXXXXXX
==============================
```


## Skill：自动化解题 Agent

`skill/yuanrenxue-js-reverse-agent/` 定义了一套端到端的自动化逆向分析工作流：

| 阶段 | 说明 |
|------|------|
| **1. 侦察** | 抓取真实请求链路，区分热身请求与真实请求，识别登录态需求 |
| **2. 静态分析** | 还原参数组装逻辑、加密依赖链，搜索 `sign`/`token`/`XMLHttpRequest`/`CryptoJS` 等关键词 |
| **3. 动态验证** | 在浏览器中用 Hook/断点验证静态分析结论，定位 Browser vs Node 的首个分歧点 |
| **4. Node 重建** | 构建纯 Node.js 协议级采集脚本，仅允许最小运行时 shim |
| **5. 交付** | 运行脚本、计算答案、生成带证据的分析文档 |

**核心原则**：
- 优先协议还原，环境模拟是最后手段
- 每个关键结论必须有证据支撑（网络记录、Hook 输出、断点值、中间值对比）
- 最终采集器必须是纯 Node.js，禁止浏览器自动化作为最终方案

> 需要配合 [`JSReverser-MCP`](https://github.com/NoOne-hub/JSReverser-MCP) 和 `chrome-devtool MCP` 使用。详见 [SKILL.md](./skill/yuanrenxue-js-reverse-agent/SKILL.md)。

## 获取 sessionid

1. 登录 [猿人学](https://match.yuanrenxue.cn)
2. 打开浏览器开发者工具（F12）
3. 切换到 **Application** → **Storage** → **Cookies**
4. 找到 `match.yuanrenxue.cn` 下的 `sessionid`，复制其值

> ⚠️ sessionid 有时效性，过期后需要重新登录获取。

## 免责声明

本项目仅供**学习交流**使用，用于研究 JavaScript 逆向工程和反爬虫技术原理。请勿用于任何商业用途或违反目标网站服务条款的行为。使用本项目所产生的一切后果由使用者自行承担。
