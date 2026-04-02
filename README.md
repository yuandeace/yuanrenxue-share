# 猿人学 JS 逆向分享仓库

这个仓库整理的是猿人学题目的纯 Node.js 解法、研究脚本和复现笔记，目标不是“堆答案”，而是把每一题拆成可分享、可验证、可继续扩展的逆向过程。

仓库里保留了三类内容：

- 可直接运行的 `main.js` 入口
- 为还原算法服务的 `config/` 与 `utils/`
- 为分享过程服务的探针、快照、解包结果和运行笔记

## 设计原则

- 以分享讲解为主：README 优先解释请求链、参数来源、运行时差异和关键证据。
- 以纯 Node.js 为主：浏览器工具只用于侦察、Hook、断点和比对，不作为最终采集方案。
- 以脱敏分享为主：仓库不再保留真实 `sessionid`、绝对本机路径、直接可复用的实时候选答案。
- 不破坏算法链路：真正参与解题的加密、请求调度和运行时拟合逻辑保持可运行。

## 目录约定

- `main.js`
  题目的最终入口，负责拉取数据、计算答案和打印结果。
- `config/`
  放题目常量、模板、样例配置，或必要的静态恢复数据。
- `utils/`
  放加密逻辑、运行时拟合和请求封装。
- `probe_*.js`
  研究脚本，用来做浏览器/JSDOM 侧验证。
- `*_snapshot.*`
  静态快照，便于离线复盘。
- `*_output.json`
  运行输出样例；仓库内版本已经脱敏，只保留结构和结论。

## 题目导航

| 目录 | 状态 | 分享重点 | 说明 |
| --- | --- | --- | --- |
| [match_foundation_early](./match_foundation_early/) | 已整理 | 多算法候选解密、`Do` 运行时拟合、`Ti` 白盒还原、签名构造 | 当前更偏“轮次绑定复现 + 已分类算法族” |
| [match_10](./match_10/) | 已整理 | JSDOM 运行时重建、XHR 接管、动态参数 `m`、`k` 值回写 | 典型的“页面壳层接管请求”题 |
| [match_11](./match_11/) | 已整理 | 实时后缀提取、`SecretKey` 动态绑定、JSDOM Hook、研究探针 | 典型的“旧快照失效，必须绑定当前轮次”题 |
| [match_18](./match_18/) | 已整理 | 服务端时间戳、AES-128-CBC、`t/v` 参数派生、UA 校验 | 典型的“时间戳派生密钥”题 |

## 快速开始

### 1. 基础环境

- Node.js 18 或更高版本
- 猿人学有效登录态
- 只在需要研究页面行为时再安装浏览器探针依赖

### 2. 登录态约定

推荐优先使用环境变量，而不是把真实登录态写进文件：

```bash
# 第 10 题
export MATCH10_SESSIONID="your_sessionid"

# 第 11 题
export YRX_SESSIONID="your_sessionid"

# 第 18 题
export MATCH18_SESSIONID="your_sessionid"

# foundation_early
export SESSIONID="your_sessionid"
```

### 3. 直接运行题目

```bash
cd match_10
npm install
npm start
```

```bash
cd match_11
npm install
node main.js
```

```bash
cd match_18
node main.js
```

```bash
cd match_foundation_early
npm install
node main.js
```

## 脱敏约定

为了方便公开分享，仓库现在统一遵循这些规则：

- 不提交真实 `sessionid`
- 不提交本机绝对路径
- 不提交可直接复用的实时挑战答案
- 研究输出保留字段结构、调用顺序和长度特征，但会把敏感值替换成占位符

如果某个静态数据本身就是算法的一部分，比如 `foundation_do_data.json` 这类恢复后的运行时材料，则保留原样，因为删掉会直接破坏复现链路。

## Skill

仓库自带一个本地 skill：

- [skill/yuanrenxue-js-reverse-agent/SKILL.md](./skill/yuanrenxue-js-reverse-agent/SKILL.md)

它的作用不是“自动给答案”，而是把猿人学题目的通用工作流固定下来：

- 先侦察真实请求链
- 再静态分析参数生成逻辑
- 然后动态验证关键结论
- 最后重建纯 Node.js 解法和分享型 README

## 推荐阅读顺序

如果你是第一次看这个仓库，建议按这个顺序看分享：

1. 先看 [match_18](./match_18/)：加密链最直观，适合用来分享“从接口到参数推导”的完整过程。
2. 再看 [match_10](./match_10/)：这里重点分享“不是直接抄页面变量，而是还原页面接管的请求管线”。
3. 再看 [match_11](./match_11/)：这里主要分享为什么“同样的代码，换轮次就会失效”，以及如何设计实时提取与绑定。
4. 最后看 [match_foundation_early](./match_foundation_early/)：这里更适合分享运行时拟合、白盒拆解和多算法候选恢复。

## 免责声明

本仓库仅用于相关内容分享。请勿用于任何违反目标站点规则或不当用途的场景。
