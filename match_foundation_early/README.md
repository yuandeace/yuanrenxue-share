# foundation_early

## 题目定位

这个目录更适合拿来分享“运行时拟合 + 白盒还原 + 多算法候选恢复”。

和第 10、18 题相比，这题不只是还原一个参数生成器，还需要同时处理：

- `gold` / `earth` 的多算法解密族
- `Do(serializedBody)` 的纯 Node 运行时复现
- `Ti.encodeString()` 的白盒拆解
- `sign/ts` 的请求签名构造

## 当前状态

- 已经能用纯 Node.js 跑通一部分轮次。
- 对已经归类的算法族，可以自动求出答案。
- 这份实现更偏“支持的轮次可自动求解”，还不是所有 fresh round 都能直接泛化。

换句话说，这里最有价值的是分享材料和运行时拟合过程，而不是把它误解成“永不过期的通杀脚本”。

## 主流程

```text
GET /match/foundation_early
  -> 解析 key / cipher / earthCipher
  -> 候选算法解 gold
  -> fire = base64NoPad(gold)
  -> wood = wood_reiki_yrx
  -> serialized = 木=...&火=...&金=...
  -> digest = Do(serialized)
  -> sign = Ti.encodeString(digest, "/api/question/foundation_early|ts")
  -> POST /api/question/foundation_early
  -> 拿到 water
  -> 用 water 解 earthCipher
  -> answer = md5(gold + fire + wood + water + earth)
```

## 目录说明

```text
match_foundation_early/
├── main.js
├── README.md
├── RUNTIME_NOTES.md
├── package.json
├── config/
│   ├── encrypt.js
│   └── foundation_do_data.json
├── utils/
│   ├── encrypt.js
│   ├── foundation_do.js
│   ├── foundation_ti.js
│   └── request.js
└── tools/
    ├── foundation_do_compare.js
    └── foundation_do_runtime.js
```

- `main.js`
  负责 fresh round 重试、计算答案、可选提交。
- `config/foundation_do_data.json`
  这是运行时还原所需的静态材料，属于算法输入的一部分，因此不做删减。
- `config/encrypt.js`
  保存脱敏后的已验证轮次字段模板和研究备注。
- `utils/foundation_do.js`
  用最小 DOM/定时器拟合去运行恢复后的 `Do`。
- `utils/foundation_ti.js`
  `Ti` 白盒后的可复用实现。
- `RUNTIME_NOTES.md`
  记录运行时差异、已确认算法族和脱敏后的研究结论。
- `tools/`
  更偏研究用途，不是最终求解入口。

## 运行

```bash
cd match_foundation_early
npm install
```

只计算，不提交：

```bash
export SESSIONID="your_sessionid"
node main.js
```

增加 fresh round 尝试次数：

```bash
export SESSIONID="your_sessionid"
export MAX_ATTEMPTS=50
node main.js
```

计算并提交：

```bash
export SESSIONID="your_sessionid"
export SUBMIT=1
node main.js
```

## 研究工具说明

`tools/` 目录里的脚本已经去掉了作者本机绝对路径依赖，改成了环境变量控制：

- `FE_ANALYSIS_DIR`
  放调试转储文件的目录，默认是 `match_foundation_early/analysis_data`
- `FE_PAUSE_DUMP`
- `FE_CLOSURE_DUMP`
- `FE_SAMPLE_DUMP`
- `PUPPETEER_CORE_PATH`
- `CHROME_PATH`

如果你只是想看主算法分享，不需要先折腾这些工具；直接从 `main.js`、`utils/foundation_do.js`、`utils/foundation_ti.js` 和 `RUNTIME_NOTES.md` 看起就够了。

## 这题最值得分享的点

- 算法族不止一个时，先做候选恢复，不要过早押注。
- 浏览器差异不一定出在大对象，往往卡在 `toString`、索引访问、`item()` 这种细节语义。
- 运行时拟合不是“把浏览器全搬过去”，而是只补齐真正影响结果的那部分语义。
