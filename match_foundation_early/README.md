# foundation_early

## 题目信息

- 题号：突破题
- 题目：五行灵气收集
- 目标：收集金、火、木、水、土五种灵气，按 `金火木水土` 拼接后做 32 位小写 `md5`
- 页面：`https://match.yuanrenxue.cn/match/foundation_early`
- 登录态：需要 `sessionid`

## 解题思路

### 接口链路

```
GET /match/foundation_early → 页面 HTML（含 key + cipher + 土密文）
    ↓
候选算法解密 cipher → 金灵气
    ↓
Base64(金灵气, 去 padding) → 火灵气
    ↓
页面固定值 → 木灵气（wood_reiki_yrx）
    ↓
POST /api/question/foundation_early（带 sign + 金火木） → 水灵气
    ↓
水灵气作 key，解密土密文 → 土灵气
    ↓
拼接：金+火+木+水+土 → MD5 → 最终答案
    ↓
POST /a/foundation_early → 提交
```

### 关键发现

1. **多算法轮换**：题目不是固定一种加密算法，批量抓取多轮 `key/cipher` 后确认至少两类：
   - 16 位 `key` → `AES-128-ECB`
   - 8 位 `key` → `3DES-ECB`（raw key 补齐 24 字节）
   - 脚本自动候选尝试，通过 `isPrintableAscii()` 判断解密结果是否有效

2. **火灵气 = Base64(金灵气)**：去掉尾部 `=` padding

3. **水灵气由服务端返回**：提交金+火+木后，服务端校验通过才会返回水灵气

4. **土灵气解密**：水灵气作为 key，解密页面中的土密文，算法同样候选尝试

5. **轮次绑定**：每次刷新页面会换轮次（新的 key/cipher），答案与当轮绑定

## 使用方法

```bash
# 安装依赖
npm install

# 配置 sessionid
export SESSIONID="your_sessionid_here"

# 运行（仅计算，不提交）
node main.js

# 运行并提交答案（仅当页面轮次匹配时才会真正提交）
SUBMIT=1 node main.js
```

> ⚠️ 当前脚本采用"已验证轮次复放"模式。如果页面已切换到新轮次，脚本会自动跳过提交，避免误提旧答案。

## 核心机制

### 候选解密

```
输入: key + cipher
    ↓
key 长度 == 16? → 尝试 AES-128-ECB
    ↓
尝试 3DES-ECB (raw key padded to 24 bytes)
    ↓
isPrintableAscii(result)? → 命中 → 返回
```

### 五行拼接

```
answer = md5(金 + 火 + 木 + 水 + 土)
```

其中火 = `base64NoPad(金)`，木 = 固定值 `wood_reiki_yrx`。

## 待完善

- `/api/question/foundation_early` 的 fresh-round `sign` 纯 Node 泛化还原尚未完成
- 当前方案为"已验证成功轮次复放 + 轮次校验后提交"

## 文件说明

```
match_foundation_early/
├── main.js                 # 入口：解密五行灵气 → 拼接 → MD5 → 可选提交
├── package.json
├── README.md               # 本文件
├── config/
│   └── encrypt.js          # 已验证轮次常量（已脱敏，需自行填入或用环境变量）
└── utils/
    ├── encrypt.js          # 加解密工具：AES-128-ECB、3DES-ECB、Base64、MD5
    └── request.js          # 页面抓取、轮次 HTML 解析、答案提交
```
