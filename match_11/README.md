# match_11

## 题目思路

第 11 题的关键是“实时绑定当前轮数据”。

- 不能依赖旧题面快照
- 不能把后缀写死
- 必须把当前轮的随机串和当前轮的 `SecretKey` 绑定起来

最终做法是：

1. 先请求最新题页
2. 从题页里提取当前后缀
3. 再拉当前线上主脚本
4. 用 `jsdom` 跑页面并钩住 `randomString`、`DevtoolsTrap`、`SecretKey`
5. 收集候选答案并提交验证

## 目录结构

```text
match_11/
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

这次已经把研究辅助文件、快照、探针输出都移除了，只保留和其他题目一致的最小可运行结构。

## 运行

```bash
cd match_11
npm install
```

优先用环境变量：

```bash
export YRX_SESSIONID="your_sessionid"
node main.js
```

或者编辑 `config/session.json`：

```json
{
  "sessionid": ""
}
```

## 代码职责

- `main.js`
  读取登录态和超时配置，启动求解。
- `config/encrypt.js`
  放题目地址、主脚本地址、正则和常量。
- `utils/request.js`
  负责拉题页、拉主脚本、提交答案。
- `utils/encrypt.js`
  负责创建 `jsdom` 运行时、安装钩子、捕获候选答案并验证。

## 分享重点

- 为什么这题必须实时提取后缀
- 为什么“同一个函数”也要和“同一轮随机串”配对
- 为什么最终解法仍然可以是纯 Node.js，而不是浏览器自动化
