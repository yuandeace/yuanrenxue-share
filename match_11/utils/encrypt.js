const { JSDOM, VirtualConsole, requestInterceptor } = require("jsdom");
const {
  TARGET_URL,
  SCRIPT_URL,
  USER_AGENT,
  SUFFIX_RE,
  ANSWER_RE,
} = require("../config/encrypt");
const { fetchText, submitAnswer } = require("./request");

const JQUERY_STUB = `
(function () {
  function collection() {
    const api = {
      length: 0,
      val(value) {
        if (arguments.length === 0) return "";
        return api;
      },
      text() { return api; },
      html() { return api; },
      append() { return api; },
      prepend() { return api; },
      siblings() { return api; },
      css() { return api; },
      hide() { return api; },
      show() { return api; },
      fadeOut() { return api; },
      addClass() { return api; },
      removeClass() { return api; },
      on() { return api; },
      click(handler) {
        if (typeof handler === "function") setTimeout(handler, 0);
        return api;
      }
    };
    return api;
  }

  function dollar(arg) {
    if (typeof arg === "function") {
      setTimeout(arg, 0);
      return collection();
    }
    return collection();
  }

  dollar.ajax = function ajax(options) {
    const opts = options || {};
    const response = { code: 0 };
    if (typeof opts.success === "function") {
      setTimeout(() => opts.success(response), 0);
    }
    return {
      done(fn) {
        if (typeof fn === "function") setTimeout(() => fn(response), 0);
        return this;
      },
      fail() { return this; },
      always(fn) {
        if (typeof fn === "function") setTimeout(() => fn(response), 0);
        return this;
      }
    };
  };

  dollar.extend = Object.assign;
  dollar.fn = collection();
  window.$ = window.jQuery = dollar;
})();
`;

const ALERT_STUB = `
window.failedAlert = window.failedAlert || function () {};
window.successAlert = window.successAlert || function () {};
window.expUpAlert = window.expUpAlert || function () {};
`;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createState(suffix) {
  return {
    suffix,
    candidates: [],
    currentRandomString: null,
    currentTrapRandomString: null,
    seenAnswers: new Set(),
  };
}

function pushCandidate(state, candidate) {
  if (!candidate || typeof candidate.answer !== "string") {
    return;
  }

  if (!ANSWER_RE.test(candidate.answer)) {
    return;
  }

  if (state.seenAnswers.has(candidate.answer)) {
    return;
  }

  state.seenAnswers.add(candidate.answer);
  state.candidates.push(candidate);
}

function installHooks(window, state) {
  const originalDefineProperty = Object.defineProperty;
  const stored = Object.create(null);

  const watchWindowProp = (name, transform) => {
    // The challenge exposes its helpers by assigning globals at runtime, so we intercept those writes.
    originalDefineProperty(window, name, {
      configurable: true,
      enumerable: true,
      get() {
        return stored[name];
      },
      set(value) {
        stored[name] = transform ? transform(value, name) : value;
      },
    });
  };

  watchWindowProp("randomString", (value) => {
    if (typeof value !== "function") {
      return value;
    }

    return function (...args) {
      const result = value.apply(this, args);
      if (typeof result === "string") {
        state.currentRandomString = result;
      }
      return result;
    };
  });

  watchWindowProp("DevtoolsTrap", (value) => {
    if (typeof value !== "function") {
      return value;
    }

    return new Proxy(value, {
      construct(target, args, newTarget) {
        const instance = Reflect.construct(target, args, newTarget);
        if (instance && typeof instance.random_str === "string") {
          state.currentTrapRandomString = instance.random_str;
        }
        return instance;
      },
      apply(target, thisArg, args) {
        return Reflect.apply(target, thisArg, args);
      },
    });
  });

  watchWindowProp("SecretKey", (value) => {
    if (typeof value !== "function") {
      return value;
    }

    // Pair the current SecretKey implementation with the random string from the same round.
    const pairedString = state.currentTrapRandomString || state.currentRandomString;
    if (pairedString) {
      pushCandidate(state, {
        source: "SecretKey",
        pairedString,
        answer: value.call(window, pairedString + state.suffix),
      });
    }

    return value;
  });

  Object.defineProperty = function patchedDefineProperty(target, prop, descriptor) {
    if (
      target === window &&
      descriptor &&
      "value" in descriptor &&
      ["randomString", "DevtoolsTrap", "SecretKey"].includes(String(prop))
    ) {
      window[String(prop)] = descriptor.value;
      return target;
    }

    return originalDefineProperty(target, prop, descriptor);
  };
}

function createResources(mainScript) {
  return {
    userAgent: USER_AGENT,
    interceptors: [
      requestInterceptor(async (request) => {
        const url = request.url;

        if (/jquery\/jquery\.js(?:\?|$)/.test(url)) {
          return new Response(JQUERY_STUB, {
            headers: { "Content-Type": "application/javascript; charset=utf-8" },
          });
        }

        if (/alert\.js(?:\?|$)/.test(url)) {
          return new Response(ALERT_STUB, {
            headers: { "Content-Type": "application/javascript; charset=utf-8" },
          });
        }

        if (/modallayer-ie\.min\.js(?:\?|$)/.test(url) || /tierStyleMap\.js(?:\?|$)/.test(url) || /expUp\.js(?:\?|$)/.test(url)) {
          return new Response("", {
            headers: { "Content-Type": "application/javascript; charset=utf-8" },
          });
        }

        if (/question\/general\.js(?:\?|$)/.test(url) || /\/js\/common\.js(?:\?|$)/.test(url)) {
          return new Response("", {
            headers: { "Content-Type": "application/javascript; charset=utf-8" },
          });
        }

        if (/question\/11\/yrx_check_devtools_jsvmp\.js(?:\?|$)/.test(url)) {
          return new Response(mainScript, {
            headers: { "Content-Type": "application/javascript; charset=utf-8" },
          });
        }

        if (/\.css(?:\?|$)/.test(url) || /hm\.baidu\.com\//.test(url)) {
          return new Response("", {
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          });
        }

        return new Response("", {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }),
    ],
  };
}

async function solveMatch11({ sessionId, timeoutMs = 10000 } = {}) {
  if (!sessionId) {
    throw new Error("missing sessionId");
  }

  const html = await fetchText(TARGET_URL, {
    sessionId,
    referer: "https://match.yuanrenxue.cn/",
  });
  const mainScript = await fetchText(SCRIPT_URL, {
    referer: TARGET_URL,
  });

  const suffixMatch = html.match(SUFFIX_RE);
  if (!suffixMatch) {
    throw new Error("failed to parse live suffix from challenge page");
  }

  const state = createState(suffixMatch[1]);
  const virtualConsole = new VirtualConsole();
  virtualConsole.on("jsdomError", () => {});

  const dom = new JSDOM(html, {
    url: TARGET_URL,
    runScripts: "dangerously",
    resources: createResources(mainScript),
    pretendToBeVisual: true,
    virtualConsole,
    beforeParse(window) {
      installHooks(window, state);
    },
  });

  try {
    const deadline = Date.now() + timeoutMs;
    let index = 0;

    while (Date.now() < deadline) {
      while (index < state.candidates.length) {
        const candidate = state.candidates[index++];
        const validation = await submitAnswer({
          sessionId,
          answer: candidate.answer,
        });
        const payload = validation.json || {};
        if (payload.code === 1 || payload.code === 2 || payload.result === "success") {
          return {
            suffix: state.suffix,
            randomString: candidate.pairedString,
            answer: candidate.answer,
            validation,
          };
        }
      }

      await wait(200);
    }

    throw new Error(`timed out without a valid answer, captured ${state.candidates.length} candidate(s)`);
  } finally {
    dom.window.close();
  }
}

module.exports = {
  solveMatch11,
};
