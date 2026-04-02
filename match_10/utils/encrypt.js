const { JSDOM, VirtualConsole, CookieJar, requestInterceptor } = require("jsdom");
const {
  BASE_URL,
  DEFAULT_UA,
  FIRST_PAGE_TIMEOUT_MS,
  PAGE_URL,
} = require("../config/encrypt");

function contentTypeFor(url) {
  if (/\.js($|\?)/i.test(url) || /\/api2\/10$|\/api\/10\/offset$/.test(url)) {
    return "application/javascript; charset=utf-8";
  }
  if (/\.css($|\?)/i.test(url)) {
    return "text/css; charset=utf-8";
  }
  return "text/plain; charset=utf-8";
}

function buildInterceptors() {
  return [
    requestInterceptor(async (request) => {
      if (/\.css($|\?)/i.test(request.url) || /\.(png|jpg|jpeg|gif|svg|woff2?)($|\?)/i.test(request.url)) {
        return new Response("", {
          status: 200,
          headers: {
            "content-type": contentTypeFor(request.url),
          },
        });
      }

      return undefined;
    }),
  ];
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForCondition(checker, timeoutMs, message) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const value = checker();
    if (value) return value;
    await sleep(50);
  }
  throw new Error(message);
}

function applyQuestionKey(window, response) {
  const pair = response && response.k && response.k.k;
  if (!pair) return null;
  const [name, rawValue] = String(pair).split("|");
  const value = Number.parseInt(rawValue, 10);
  if (!name || Number.isNaN(value)) return null;
  window[name] = value;
  return { name, value };
}

function installRuntime(window, state, userAgent) {
  Object.defineProperty(window.navigator, "userAgent", {
    configurable: true,
    value: userAgent,
  });
  Object.defineProperty(window.navigator, "platform", {
    configurable: true,
    value: "Win32",
  });
  Object.defineProperty(window.navigator, "webdriver", {
    configurable: true,
    value: false,
  });
  Object.defineProperty(window.navigator, "languages", {
    configurable: true,
    value: ["zh-CN", "zh", "en-US", "en"],
  });
  Object.defineProperty(window.navigator, "plugins", {
    configurable: true,
    value: [{ name: "Chrome PDF Viewer" }, { name: "Chromium PDF Viewer" }],
  });
  Object.defineProperty(window.navigator, "mimeTypes", {
    configurable: true,
    value: [{ type: "application/pdf" }],
  });

  window.matchMedia =
    window.matchMedia ||
    function matchMedia(query) {
      return {
        media: String(query || ""),
        matches: false,
        onchange: null,
        addListener() {},
        removeListener() {},
        addEventListener() {},
        removeEventListener() {},
        dispatchEvent() {
          return false;
        },
      };
    };
  window.alert = window.alert || function alert() {};
  window.failedAlert = window.failedAlert || function failedAlert() {};
  window.successAlert = window.successAlert || function successAlert() {};
  window.scrollTo = window.scrollTo || function scrollTo() {};
  window.requestAnimationFrame =
    window.requestAnimationFrame ||
    function requestAnimationFrame(cb) {
      return window.setTimeout(() => cb(Date.now()), 16);
    };
  window.cancelAnimationFrame =
    window.cancelAnimationFrame ||
    function cancelAnimationFrame(id) {
      return window.clearTimeout(id);
    };

  class FakeRTCPeerConnection {
    constructor() {
      this.localDescription = null;
      this.onicecandidate = null;
    }

    createDataChannel() {
      return { close() {}, readyState: "open" };
    }

    async createOffer() {
      return {
        type: "offer",
        sdp: [
          "v=0",
          "o=- 0 0 IN IP4 127.0.0.1",
          "s=-",
          "t=0 0",
          "a=candidate:1 1 udp 2130706431 192.168.0.5 5000 typ host",
          "a=candidate:2 1 udp 1694498815 8.8.8.8 5001 typ srflx raddr 192.168.0.5 rport 5000",
        ].join("\n"),
      };
    }

    async setLocalDescription(desc) {
      this.localDescription = desc;
      if (typeof this.onicecandidate === "function") {
        window.setTimeout(() => {
          this.onicecandidate({
            candidate: { candidate: "candidate:1 1 udp 2130706431 192.168.0.5 5000 typ host" },
          });
        }, 0);
        window.setTimeout(() => {
          this.onicecandidate({
            candidate: {
              candidate: "candidate:2 1 udp 1694498815 8.8.8.8 5001 typ srflx raddr 192.168.0.5 rport 5000",
            },
          });
        }, 0);
        window.setTimeout(() => this.onicecandidate({ candidate: null }), 0);
      }
    }

    close() {}
  }

  window.RTCPeerConnection = FakeRTCPeerConnection;
  window.webkitRTCPeerConnection = FakeRTCPeerConnection;
  window.mozRTCPeerConnection = FakeRTCPeerConnection;

  const NativeXHR = window.XMLHttpRequest;
  class TraceXHR extends NativeXHR {
    constructor() {
      super();
      this.__url = "";
      // Capture the server-issued k value as soon as each page response lands.
      this.addEventListener("readystatechange", () => {
        if (this.readyState !== 4) return;
        if (!this.responseURL || !this.responseURL.includes("/api/question/10?page=")) return;
        try {
          const parsedUrl = new URL(this.responseURL);
          const page = Number.parseInt(parsedUrl.searchParams.get("page"), 10);
          const response = JSON.parse(String(this.responseText || "{}"));
          if (!Number.isNaN(page)) {
            applyQuestionKey(window, response);
            state.questionResponses.set(page, response);
          }
        } catch (error) {
          state.errors.push(`question-response-parse:${String(error && error.message ? error.message : error)}`);
        }
      });
    }

    open(method, url, async, user, password) {
      this.__url = String(url || "");
      return super.open(method, url, async, user, password);
    }
  }

  window.XMLHttpRequest = TraceXHR;
  window.ActiveXObject = function ActiveXObject() {
    return new TraceXHR();
  };
}

async function createRuntime(sessionConfig = {}) {
  const state = {
    errors: [],
    questionResponses: new Map(),
  };

  const sessionid = sessionConfig.sessionid || "";
  if (!sessionid) {
    throw new Error("sessionid is required");
  }

  const pageResponse = await fetch(PAGE_URL, {
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      Cookie: `sessionid=${sessionid}`,
      Referer: `${BASE_URL}/`,
      "User-Agent": sessionConfig.userAgent || DEFAULT_UA,
    },
  });
  if (!pageResponse.ok) {
    throw new Error(`page bootstrap failed: ${pageResponse.status}`);
  }
  const html = await pageResponse.text();
  const virtualConsole = new VirtualConsole();
  virtualConsole.on("jsdomError", (error) => {
    state.errors.push(String(error && error.message ? error.message : error));
  });

  const cookieJar = new CookieJar();
  cookieJar.setCookieSync(`sessionid=${sessionid}; Domain=match.yuanrenxue.cn; Path=/`, PAGE_URL);

  const dom = new JSDOM(html, {
    url: PAGE_URL,
    referrer: `${BASE_URL}/`,
    runScripts: "dangerously",
    resources: {
      userAgent: sessionConfig.userAgent || DEFAULT_UA,
      interceptors: buildInterceptors(),
    },
    virtualConsole,
    pretendToBeVisual: true,
    cookieJar,
    beforeParse(window) {
      installRuntime(window, state, sessionConfig.userAgent || DEFAULT_UA);
    },
  });

  await waitForCondition(
    () => typeof dom.window.$ === "function",
    5000,
    "jQuery bootstrap timeout"
  );

  return { dom, state, window: dom.window };
}

async function waitForFirstPage(runtime, timeoutMs = FIRST_PAGE_TIMEOUT_MS) {
  return waitForCondition(
    () => runtime.state.questionResponses.get(1),
    timeoutMs,
    "page 1 bootstrap timeout"
  );
}

async function requestQuestionPage(runtime, page, options = {}) {
  if (!runtime || !runtime.window || typeof runtime.window.$ !== "function") {
    throw new Error("runtime is not ready");
  }

  return new Promise((resolve, reject) => {
    runtime.window.$.ajax({
      url: "/api/question/10",
      type: "GET",
      dataType: "json",
      data: { page },
      timeout: 10000,
      beforeSend(xhr) {
        const headers = options.headers || {};
        for (const [key, value] of Object.entries(headers)) {
          xhr.setRequestHeader(key, value);
        }
      },
      success(response) {
        applyQuestionKey(runtime.window, response);
        runtime.state.questionResponses.set(page, response);
        resolve(response);
      },
      error(xhr, status, error) {
        const detail = xhr && xhr.responseText ? ` ${xhr.responseText}` : "";
        reject(new Error(`page ${page} failed: ${status || error || "unknown"}${detail}`));
      },
    });
  });
}

function closeRuntime(runtime) {
  if (runtime && runtime.dom && runtime.dom.window) {
    runtime.dom.window.close();
  }
}

module.exports = {
  DEFAULT_UA,
  FIRST_PAGE_TIMEOUT_MS,
  PAGE_URL,
  applyQuestionKey,
  closeRuntime,
  createRuntime,
  requestQuestionPage,
  waitForCondition,
  waitForFirstPage,
};
