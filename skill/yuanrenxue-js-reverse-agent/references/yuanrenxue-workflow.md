# Yuanrenxue Challenge Workflow

## Source Restriction

- Do not use search engines, blogs, forums, repositories, or third-party writeups to find challenge solutions.
- Do not use the `web` tool for broad internet research.
- Restrict online access to the target Yuanrenxue page, its first-party static assets, and its API endpoints that are necessary for recon, validation, and protocol rebuilding.

## Naming

- `/match/guide1` becomes `match_guide1`
- `/match/2` becomes `match_2`

Create the target directory before deeper analysis.

## Step 1: Recon

Use `chrome-devtool MCP` to:

- open the challenge page
- read the prompt text
- observe all important network requests
- trigger initial page data loading
- identify the main data API, warm-up requests, challenge requests, and static resources
- record cookies, headers, query parameters, body, and response shape

Must identify:

- challenge goal
- total page count
- real data API
- warm-up or prerequisite requests
- dynamic parameters
- whether cookies participate in validation
- whether there is response encryption, font obfuscation, WebSocket use, redirects, replay protection, or environment detection

Report the findings in Chinese during real execution. Keep the structure explicit:

- challenge info
- data API analysis
- request chain
- dynamic parameters
- validation-relevant cookies, headers, and environment items
- short response sample

Do not stop after Step 1. Continue directly to Step 2.

## Step 2: Static Analysis

Use `js-reverse MCP` to analyze dynamic parameters and the request chain.

Always do the following:

- search keywords and variants such as parameter names, `sign`, `token`, `m`, `cookie`, `encrypt`, `decrypt`, `md5`, `sha`, `hmac`, `CryptoJS`, `XMLHttpRequest`, `fetch`, `eval`, and `Function`
- format and deobfuscate the relevant code
- recover strings when needed
- extract the crypto entry and its dependency chain
- determine whether the page rewrites or hijacks the request path
- save the recovered logic to `config/encrypt.js`
- add concise Chinese comments in extracted code for input, output, dependencies, and key intermediate values

Judge explicitly:

- whether the parameter itself is encrypted or the whole request pipeline is rewritten
- whether page number, timestamp, random values, cookie, user agent, or environment values participate
- whether the response is also decrypted on the client
- whether anti-debugging or runtime code generation exists

During real execution, summarize in Chinese:

- crypto entry
- dependency chain
- dynamic parameter sources
- whether requests are rewritten
- whether responses are decrypted
- extracted files

Do not stop after Step 2. Continue directly to Step 3.

## Step 3: Dynamic Validation

Use `chrome-devtool MCP` to validate every important static conclusion.

Always do the following:

- hook `XMLHttpRequest.open`, `XMLHttpRequest.send`, `fetch`, `document.cookie`, `eval`, `Function`, and key crypto functions
- place breakpoints on the critical crypto path
- capture real arguments, return values, and call order
- compare multiple requests to identify parameter change rules
- verify which environment checks really affect request generation or server acceptance

Always inspect at least:

- `navigator.userAgent`
- `document.cookie`
- `screen`
- `plugins`
- `mimeTypes`
- `canvas` or `webgl`
- `RTCPeerConnection`
- devtools or console traps
- header ordering
- `sec-ch-ua`
- timestamp precision
- how page number enters the calculation

During real execution, summarize in Chinese:

- real crypto inputs
- real crypto outputs
- cookie generation chain
- dynamic parameter rules
- truly validated environment items
- whether pure Node.js is possible, possible with a minimal shim, or still blocked

Do not stop after Step 3. Continue directly to Step 4.

## Step 4: Pure Node.js Rebuild

Generate a pure Node.js solution with this default layout:

```text
match_X/
|- config/
|  |- encrypt.js
|  |- keys.json
|  `- session.json
|- utils/
|  |- encrypt.js
|  `- request.js
|- main.js
`- README.md
```

Follow these rules:

- get page 1 working first, then scale to the full page range
- prefer built-in Node.js `crypto`
- preserve intermediate-value comparison ability
- move configuration longer than three lines into `config/`
- never make browser automation the contents of `main.js`

If a runtime shim is needed:

- allow only the minimum required objects
- explain exactly what was shimmed and why
- keep the final collection logic in Node.js protocol requests

During real execution, make `main.js` print Chinese progress lines for:

- challenge name and goal
- page-by-page collection progress
- total rows collected
- final computed answer

Do not stop after Step 4. Continue directly to Step 5.

## Step 5: Run, Validate, Deliver

Always do the following:

- run `main.js`
- collect all required pages
- compute the final answer
- print the answer
- generate `README.md`

README must include:

- challenge summary
- request chain
- dynamic parameter analysis
- static-analysis conclusions
- dynamic-validation conclusions
- pure Node.js rebuild strategy
- key intermediate-value comparisons
- final answer

Final user-facing output should be in Chinese and should clearly include:

- challenge number
- final answer
- delivered files
- short notes on session dependency, environment shims, or dynamic suffixes when relevant

## Failure Handling

When requests fail, troubleshoot in this order:

1. invalid cookie or `sessionid`
2. missing warm-up request
3. parameter binding to page number or timestamp
4. missing headers
5. extra environment checks
6. rate limiting

When crypto output mismatches, compare:

- raw input
- concatenated string
- timestamp
- random string or nonce
- intermediate digest
- final ciphertext

Do not rewrite large parts of the implementation before locating the exact mismatch point.

When environment dependencies appear, first prove whether they are truly part of server validation. Do not assume that every detected browser check matters.

## Common Challenge Patterns

### `sign`, `m`, or `token` parameters

- Typical techniques: MD5, HMAC, timestamp-based signatures
- Strategy: recover the exact concatenation and reproduce it in Node.js

### Dynamic cookies

- Typical techniques: client-side cookie generation
- Strategy: hook the generation chain and reproduce it in Node.js

### Encrypted responses

- Typical techniques: AES, DES, RC4, custom encodings
- Strategy: capture the plaintext boundary and rebuild the decryptor

### Heavy obfuscation

- Typical techniques: string arrays, flattened control flow, VM shells
- Strategy: extract the smallest runnable crypto chain

### Dynamic code generation

- Typical techniques: `eval`, `Function`
- Strategy: hook and capture generated source at runtime

### Font-based anti-scraping

- Typical techniques: custom font mapping
- Strategy: download the font and recover the mapping

### Environment checks

- Typical techniques: `navigator`, `screen`, `plugins`, `canvas`
- Strategy: verify server relevance first, then add the smallest possible shim

### Devtools traps

- Typical techniques: `console`, `debugger`, DOM getter traps
- Strategy: isolate the real validation path and reproduce only the necessary parts

## Completion Standard

Treat the challenge as complete only when all of the following are true:

- the real request chain is identified
- the key crypto logic is located and validated
- environment validation items are confirmed
- a pure Node.js protocol collector is delivered
- the full target data set is collected
- the final answer is computed and printed
- the README is generated
