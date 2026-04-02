# Yuanrenxue Workflow

## Source Restriction

- Do not use search engines, blogs, forum writeups, or third-party solutions.
- Restrict online access to the target Yuanrenxue page, its first-party scripts, and required API endpoints.

## Naming Convention

- `/match/2` -> `match_2`
- `/match/guide1` -> `match_guide1`

Inside a solved directory, prefer these names:

- `probe_*.js` for research scripts
- `*_snapshot.*` for captured static files
- `*_output.json` for runtime outputs

## Step 1: Recon

Record:

- challenge goal
- real data API
- request order
- warm-up requests
- dynamic parameters
- validation-relevant cookies and headers

Important:

- A placeholder request is not the real request path.
- If the page auto-fires with fake values such as `arg1/arg2/arg3`, do not mistake that for the final chain.

## Step 2: Static Analysis

Recover:

- parameter assembly order
- crypto entry
- dependency chain
- request rewrite path
- response decrypt path if present

Always search for:

- `sign`
- `token`
- `m`
- `ts`
- `cookie`
- `XMLHttpRequest`
- `fetch`
- `encode`
- `decode`
- `CryptoJS`
- `md5`
- `sha`

## Step 3: Dynamic Validation

Validate at least:

- exact crypto input
- exact crypto output
- timestamp or nonce source
- cookie relevance
- page-number binding
- user-agent or environment relevance

When browser and Node differ, find the first mismatch point instead of changing the implementation blindly.

## Step 4: Node Rebuild

Default layout:

```text
match_X/
├── config/
├── utils/
├── main.js
└── README.md
```

Rules:

- Get one page working first.
- Prefer built-in Node.js primitives.
- Use only the minimum runtime shim when necessary.
- Keep browser tooling out of `main.js`.

## Step 5: Shareable Delivery

Deliver:

- working `main.js`
- evidence-backed `README.md`
- optional research helpers if they add learning value

The README should explain:

- request chain
- dynamic parameter source
- important intermediate values
- runtime differences
- final answer
- whether the result is generic or round-bound

## Sanitization Rules

Before committing artifacts, remove or replace:

- real `sessionid`
- absolute local paths
- directly reusable live answers

Keep:

- field structure
- call order
- regex shape
- response shape
- error types
- algorithm-critical static data

Examples:

- good: `<16_hex_suffix>`
- good: `<128_hex_candidate>`
- bad: a real current answer that can be submitted immediately

## Failure Order

When requests fail, troubleshoot in this order:

1. invalid cookie or `sessionid`
2. round drift
3. missing warm-up request
4. page or timestamp binding
5. missing headers
6. environment checks
7. rate limiting

When crypto mismatches, compare:

- raw input
- field order
- timestamp
- random string or nonce
- intermediate digest
- final ciphertext
