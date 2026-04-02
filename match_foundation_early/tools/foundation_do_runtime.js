const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ANALYSIS_DIR =
  process.env.FE_ANALYSIS_DIR || path.resolve(__dirname, "..", "analysis_data");
const PAUSE_DUMP = process.env.FE_PAUSE_DUMP || path.join(ANALYSIS_DIR, "foundation_pause_dump.json");
const CLOSURE_DUMP =
  process.env.FE_CLOSURE_DUMP || path.join(ANALYSIS_DIR, "foundation_do_closure_dump.json");
const SAMPLE_DUMP = process.env.FE_SAMPLE_DUMP || path.join(ANALYSIS_DIR, "foundation_do_samples.json");
const TRACE_DOM = process.env.FE_DO_TRACE_DOM === "1";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function isPrimitiveEntry(entry) {
  return (
    entry.type === "string" ||
    entry.type === "number" ||
    entry.type === "boolean" ||
    entry.type === "undefined" ||
    entry.type === "object" && entry.subtype === "null"
  );
}

function entryToValue(entry) {
  if (entry.type === "undefined") return undefined;
  if (entry.type === "object" && entry.subtype === "null") return null;
  return entry.value;
}

function buildPrimitiveScopes(closureDump) {
  return closureDump.scopes
    .slice(0, 6)
    .map((scope) => {
      const out = Object.create(null);
      for (const entry of scope.vars) {
        if (isPrimitiveEntry(entry)) {
          out[entry.name] = entryToValue(entry);
        }
      }
      return out;
    });
}

function parseCssText(cssText) {
  const map = new Map();
  const order = [];
  for (const part of String(cssText).split(";")) {
    const idx = part.indexOf(":");
    if (idx < 0) continue;
    const key = part.slice(0, idx).trim().toLowerCase();
    const value = part.slice(idx + 1).trim();
    if (!key) continue;
    if (!map.has(key)) {
      order.push(key);
    }
    map.set(key, value);
  }
  return { map, order };
}

class StyleShim {
  constructor() {
    this._cssText = "";
    this._map = new Map();
    this._order = [];
  }

  get cssText() {
    return this._cssText;
  }

  set cssText(value) {
    this._cssText = String(value);
    const parsed = parseCssText(this._cssText);
    this._map = parsed.map;
    this._order = parsed.order;
    if (TRACE_DOM) {
      console.log("[dom] style.cssText <=", this._cssText);
    }
  }

  getPropertyValue(name) {
    const key = String(name).trim().toLowerCase();
    const value = this._map.get(key) || "";
    if (TRACE_DOM) {
      console.log("[dom] style.getPropertyValue", key, "=>", value);
    }
    return value;
  }

  item(index) {
    const idx = Number(index);
    if (!Number.isInteger(idx) || idx < 0 || idx >= this._order.length) {
      return "";
    }
    return this._order[idx];
  }
}

class AttrsShim {
  constructor(owner) {
    this._owner = owner;
  }

  _getAttrNode(name) {
    const key = String(name).toLowerCase();
    if (!this._owner._attrs.has(key)) return undefined;
    return {
      name: key,
      value: this._owner._attrs.get(key),
    };
  }

  getNamedItem(name) {
    const item = this._getAttrNode(name);
    if (!item) {
      if (TRACE_DOM) {
        console.log("[dom] attributes.getNamedItem", String(name).toLowerCase(), "=> null");
      }
      return null;
    }
    if (TRACE_DOM) {
      console.log("[dom] attributes.getNamedItem", item.name, "=>", item.value);
    }
    return item;
  }

  item(index) {
    const idx = Number(index);
    if (!Number.isInteger(idx) || idx < 0 || idx >= this._owner._attrOrder.length) {
      return null;
    }
    return this._getAttrNode(this._owner._attrOrder[idx]) || null;
  }
}

class ElementShim {
  constructor(tagName) {
    this.tagName = String(tagName).toUpperCase();
    this.nodeName = this.tagName;
    const style = new StyleShim();
    this.style = new Proxy(style, {
      get(target, prop, receiver) {
        if (typeof prop === "symbol") {
          return Reflect.get(target, prop, receiver);
        }

        if (prop === "length") {
          return target._order.length;
        }

        if (/^\d+$/.test(prop)) {
          return target.item(Number(prop));
        }

        if (Reflect.has(target, prop)) {
          const value = Reflect.get(target, prop, receiver);
          return typeof value === "function" ? value.bind(target) : value;
        }

        const key = String(prop).trim().toLowerCase();
        return target._map.get(key) || "";
      },
    });
    this._attrs = new Map();
    this._attrOrder = [];
    const attrs = new AttrsShim(this);
    this.attributes = new Proxy(attrs, {
      get(target, prop, receiver) {
        if (typeof prop === "symbol") {
          return Reflect.get(target, prop, receiver);
        }

        if (prop === "length") {
          return target._owner._attrOrder.length;
        }

        if (/^\d+$/.test(prop)) {
          return target.item(Number(prop));
        }

        if (Reflect.has(target, prop)) {
          const value = Reflect.get(target, prop, receiver);
          return typeof value === "function" ? value.bind(target) : value;
        }

        return target._getAttrNode(prop);
      },
    });
  }

  setAttribute(name, value) {
    const key = String(name).toLowerCase();
    const text = String(value);
    if (!this._attrs.has(key)) {
      this._attrOrder.push(key);
    }
    this._attrs.set(key, text);
    if (TRACE_DOM) {
      console.log("[dom] setAttribute", this.tagName, key, "=", text);
    }
    if (key === "style") {
      this.style.cssText = text;
    }
  }

  getAttribute(name) {
    const key = String(name).toLowerCase();
    const value = this._attrs.has(key) ? this._attrs.get(key) : null;
    if (TRACE_DOM) {
      console.log("[dom] getAttribute", this.tagName, key, "=>", value);
    }
    return value;
  }
}

function createDocumentShim() {
  return {
    createElement(tagName) {
      if (TRACE_DOM) {
        console.log("[dom] createElement", tagName);
      }
      return new ElementShim(tagName);
    },
  };
}

function createLocationShim() {
  return {
    href: "about:blank",
    protocol: "about:",
    host: "",
    hostname: "",
    port: "",
    pathname: "blank",
    search: "",
    hash: "",
    origin: "null",
    toString() {
      return this.href;
    },
  };
}

function installNativeLookingSetInterval(context) {
  const fakeSetInterval = function setInterval() {
    return 1;
  };
  const fakeClearInterval = function clearInterval() {};

  context.setInterval = fakeSetInterval;
  context.clearInterval = fakeClearInterval;

  const patchSrc = `
    (() => {
      const nativeToString = Function.prototype.toString;
      const setIntervalRef = globalThis.setInterval;
      const clearIntervalRef = globalThis.clearInterval;
      const nativeMap = new WeakMap([
        [setIntervalRef, "function setInterval() { [native code] }"],
        [clearIntervalRef, "function clearInterval() { [native code] }"],
      ]);
      Function.prototype.toString = function toString() {
        if (nativeMap.has(this)) {
          return nativeMap.get(this);
        }
        return nativeToString.call(this);
      };
    })();
  `;

  vm.runInContext(patchSrc, context);
}

function createRuntimeContext() {
  const document = createDocumentShim();
  const location = createLocationShim();
  const base = {
    console,
    Buffer,
    TextEncoder,
    TextDecoder,
    Uint8Array,
    Uint16Array,
    Uint32Array,
    Int8Array,
    Int16Array,
    Int32Array,
    ArrayBuffer,
    DataView,
    Math,
    Date,
    JSON,
    Object,
    Array,
    String,
    Number,
    Boolean,
    RegExp,
    Map,
    Set,
    WeakMap,
    WeakSet,
    Error,
    TypeError,
    parseInt,
    parseFloat,
    isNaN,
    encodeURIComponent,
    decodeURIComponent,
    atob(input) {
      return Buffer.from(String(input), "base64").toString("binary");
    },
    btoa(input) {
      return Buffer.from(String(input), "binary").toString("base64");
    },
    document,
    location,
  };

  base.window = base;
  base.self = base;
  base.globalThis = base;
  base.top = base;
  base.parent = base;

  const context = vm.createContext(base);
  installNativeLookingSetInterval(context);
  return context;
}

function buildDoExpression(doSrc) {
  let body = `(${doSrc})`;
  for (let index = 0; index < 6; index += 1) {
    body = `with (__scopes[${index}]) { ${body} }`;
  }
  return body;
}

function createDoRunner({ instrument }) {
  const pauseDump = readJson(PAUSE_DUMP);
  const closureDump = readJson(CLOSURE_DUMP);
  const context = createRuntimeContext();
  const scopes = buildPrimitiveScopes(closureDump);
  context.__scopes = scopes;
  const source = instrument ? instrument(pauseDump.DoSrc) : pauseDump.DoSrc;
  const doExpression = buildDoExpression(source);
  const Do = vm.runInContext(doExpression, context);
  return { Do, context, scopes, source };
}

function runSamples() {
  const browserSamples = readJson(SAMPLE_DUMP).samples;
  const { Do } = createDoRunner({});
  const rows = [];
  for (const [sample, browser] of Object.entries(browserSamples)) {
    const node = Do(sample);
    rows.push({
      sample,
      match: node === browser,
      browser,
      node,
    });
  }
  return rows;
}

function main() {
  const mode = process.argv[2] || "samples";

  if (mode === "samples") {
    console.log(JSON.stringify(runSamples(), null, 2));
    return;
  }

  if (mode === "single") {
    const input = process.argv[3] || "";
    const { Do } = createDoRunner({});
    console.log(Do(input));
    return;
  }

  throw new Error(`unknown mode: ${mode}`);
}

if (require.main === module) {
  main();
}

module.exports = {
  readJson,
  buildPrimitiveScopes,
  buildDoExpression,
  createRuntimeContext,
  PAUSE_DUMP,
  CLOSURE_DUMP,
  SAMPLE_DUMP,
  createDoRunner,
  runSamples,
};
