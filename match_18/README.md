# match_18

## 题目信息

- 题号：第 18 题
- 题目：JS 逆向 - AES 动态加密
- 目标：请求全部 5 页数据，将 50 个数字全部加和
- 页面：`https://match.yuanrenxue.cn/match/18`
- 登录态：需要 `sessionid`

## 解题思路

### 接口链路

```
GET /api/v/question/18data?page=1 → 第 1 页（无需动态参数）
    ↓
GET /api/getTime → 获取服务端毫秒时间戳
    ↓
t = floor(serverTime / 1000) → 秒级时间戳
    ↓
hex(t) 补齐 8 位，重复两次 → AES-128-CBC key & iv
    ↓
明文 "<page>|111m733,222d733,333u733" → AES 加密 → Base64 → v
    ↓
GET /api/v/question/18data?page=N&t=<t>&v=<v> → 第 2-4 页
    ↓
第 5 页同上，但 User-Agent 必须为 "yuanrenxue"
    ↓
50 个数字求和 → 最终答案
```

### 关键发现

1. **第 1 页无需加密**：直接请求 `/api/v/question/18data?page=1` 即可获取数据

2. **前端 XHR 劫持**：页面重写了 `Date.now` 和 `XMLHttpRequest.prototype.open`，将原始请求自动改写为带 `t` 和 `v` 参数的请求

3. **AES-128-CBC + PKCS7**：
   - `t` 取自 `/api/getTime` 返回值的秒级时间戳
   - `hex(t)` 补齐到 8 位后重复两次，作为 16 字节 key 和 iv
   - 示例：`t = 1774977100` → `hex = 69cc004c` → `key = iv = "69cc004c69cc004c"`

4. **明文格式**：服务端校验的并非固定常量，而是满足格式的字符串，最小可用格式为 `<page>|111m733,222d733,333u733`

5. **第 5 页 UA 校验**：第 5 页请求头 `User-Agent` 必须设为 `yuanrenxue`，否则返回空数据

6. **环境检测**：普通 Puppeteer / Headless 环境下不会触发 XHR 改写链，说明前端存在环境判定

## 使用方法

```bash
# 配置 sessionid
# 编辑 config/session.json，填入你的 sessionid

# 运行
node main.js
```

## 文件说明

```
match_18/
├── main.js                 # 入口：采集 5 页数据 → 求和 → 输出答案
├── README.md               # 本文件
├── obf.js                  # 页面混淆脚本（静态分析参考）
├── page.html               # 抓取的页面 HTML（静态分析参考）
├── config/
│   ├── encrypt.js          # 常量定义、URL 配置、加密参数
│   └── session.json        # 运行时配置（sessionid）
└── utils/
    ├── encrypt.js          # 加密工具：AES-128-CBC 加密、hex 转换
    └── request.js          # 采集调度：getTime 获取、分页请求、数据汇总
```

