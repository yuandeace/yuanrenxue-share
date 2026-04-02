const vm = require("vm");
const foundationDoData = require("../config/foundation_do_data.json");

function parseCssText(cssText) {
  const map = new Map();
  const order = [];

  for (const part of String(cssText).split(";")) {
    const idx = part.indexOf(":");
    if (idx < 0) continue;

    const key = part.slice(0, idx).trim().toLowerCase();
    const value = part.slice(idx + 1).trim();

    if (!key) continue;
    if (!map.has(key)) order.push(key);
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
  }

  getPropertyValue(name) {
    const key = String(name).trim().toLowerCase();
    return this._map.get(key) || "";
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
    return this._getAttrNode(name) || null;
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

        return target._map.get(String(prop).trim().toLowerCase()) || "";
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

    if (key === "style") {
      this.style.cssText = text;
    }
  }

  getAttribute(name) {
    const key = String(name).toLowerCase();
    return this._attrs.has(key) ? this._attrs.get(key) : null;
  }
}

function createDocumentShim() {
  return {
    createElement(tagName) {
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

function installNativeLookingTimers(context) {
  const fakeSetInterval = function setInterval() {
    return 1;
  };
  const fakeClearInterval = function clearInterval() {};

  context.setInterval = fakeSetInterval;
  context.clearInterval = fakeClearInterval;

  vm.runInContext(
    `
      (() => {
        const nativeToString = Function.prototype.toString;
        const nativeMap = new WeakMap([
          [globalThis.setInterval, "function setInterval() { [native code] }"],
          [globalThis.clearInterval, "function clearInterval() { [native code] }"],
        ]);

        Function.prototype.toString = function toString() {
          if (nativeMap.has(this)) {
            return nativeMap.get(this);
          }
          return nativeToString.call(this);
        };
      })();
    `,
    context
  );
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
  installNativeLookingTimers(context);
  return context;
}

function buildDoExpression(doSrc) {
  let body = `(${doSrc})`;
  for (let index = 0; index < 6; index += 1) {
    body = `with (__scopes[${index}]) { ${body} }`;
  }
  return body;
}

function cloneScopes() {
  const scopes = foundationDoData.scopes.map((scope) => Object.assign(Object.create(null), scope));
  if (!Object.prototype.hasOwnProperty.call(scopes[4], "n")) {
    scopes[4].n = undefined;
  }
  return scopes;
}

let cachedDo = null;

function getFoundationDoFunction() {
  if (cachedDo) {
    return cachedDo;
  }

  const context = createRuntimeContext();
  context.__scopes = cloneScopes();
  cachedDo = vm.runInContext(buildDoExpression(foundationDoData.doSrc), context);
  return cachedDo;
}

function foundationDoDigest(input) {
  return getFoundationDoFunction()(String(input));
}

module.exports = {
  foundationDoDigest,
};
