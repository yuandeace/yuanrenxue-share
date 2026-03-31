# 猿人学 JS 逆向挑战 - 纯 Node.js 协议解法

猿人学（[match.yuanrenxue.cn](https://match.yuanrenxue.cn)）JS 逆向系列题目的**纯 Node.js 协议级解法**合集。

不依赖浏览器自动化（Puppeteer / Playwright），全部通过 Node.js 直接发送 HTTP 请求完成数据采集。核心思路是用 JSDOM 在 Node 环境中还原页面运行时，让混淆后的壳层脚本自然执行，从而生成正确的请求参数。



### 前置条件

- Node.js >= 18
- 猿人学平台账号（需要有效的 `sessionid`）

### 运行示例（以第 10 题为例）

```bash
# 1. 克隆仓库
git clone https://github.com/your-username/yuanrenxue-match.git
cd yuanrenxue-match

# 2. 进入题目目录并安装依赖
cd match_10
npm install

# 3. 配置 sessionid（二选一）
# 方式一：编辑配置文件
# 将你的 sessionid 填入 config/session.json

# 方式二：使用环境变量
export MATCH10_SESSIONID="your_sessionid_here"

# 4. 运行
npm start
```

### 输出示例

```
[*] 题目：第10题 - js 混淆 重放攻击对抗
[*] 目标：请求全部 5 页数据并将全部数字加和
[+] 正在采集第 1/5 页...
✓ 获取 10 条数据
[+] 正在采集第 2/5 页...
✓ 获取 10 条数据
...
[+] 采集完成，共 50 条数据
第 1 页: 113100, 607859, ...
...

========== 计算结果 ==========
答案：XXXXXXX
==============================
```

## 项目结构

```
.
├── README.md                  # 本文件
├── .gitignore
└── match_10/                  # 第 10 题
    ├── main.js                # 入口：加载配置 → 采集 → 输出结果
    ├── package.json
    ├── README.md              # 题目详细分析
    ├── config/
    │   ├── encrypt.js         # 常量定义、URL 配置、本地资源映射
    │   └── session.json       # 运行时配置（sessionid、UA、超时）
    └── utils/
        ├── encrypt.js         # 核心引擎：JSDOM 运行时创建、XHR 拦截、浏览器环境模拟
        └── request.js         # 采集调度：分页请求、数据汇总
```

## 获取 sessionid

1. 登录 [猿人学](https://match.yuanrenxue.cn)
2. 打开浏览器开发者工具（F12）
3. 切换到 Application / Storage → Cookies
4. 复制 `sessionid` 的值

> 注意：sessionid 有时效性，过期后需要重新获取。

