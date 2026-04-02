const path = require("path");
const {
  readJson,
  buildPrimitiveScopes,
  createDoRunner,
  PAUSE_DUMP,
  CLOSURE_DUMP,
} = require("./foundation_do_runtime");

function requirePuppeteerCore() {
  const customModulePath = process.env.PUPPETEER_CORE_PATH;
  const candidates = customModulePath ? [customModulePath, "puppeteer-core"] : ["puppeteer-core"];

  for (const candidate of candidates) {
    try {
      return require(candidate);
    } catch (error) {
      if (candidate === candidates[candidates.length - 1]) {
        throw new Error(
          "missing puppeteer-core: install it in the current workspace or set PUPPETEER_CORE_PATH"
        );
      }
    }
  }

  throw new Error("missing puppeteer-core");
}

const puppeteer = requirePuppeteerCore();
const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

function replaceOnce(source, needle, replacement) {
  const index = source.indexOf(needle);
  if (index < 0) {
    throw new Error(`needle not found: ${needle}`);
  }
  return source.slice(0, index) + replacement + source.slice(index + needle.length);
}

function instrumentGeCmp(doSrc) {
  let source = doSrc;

  source = replaceOnce(
    source,
    "&&(ge=jr)&&undefined||(we=s)",
    "&&((__trace.push({tag:'ge_assign',r,se,br,yr,pr,vr,_r,wr,Sr,jr,we_before:we,s})),(ge=jr))&&undefined||(we=s)"
  );

  source = replaceOnce(
    source,
    "((Se=(wr=((_r=X)||g)&&vr&_r)&&undefined||wr)||w)",
    "(((__trace.push({tag:'Se_assign',r,ge,we,yr,pr,vr,_r,wr,X,g})),Se=(wr=((_r=X)||g)&&vr&_r)&&undefined||wr)||w)"
  );

  source = replaceOnce(
    source,
    "||(wr=vr===_r))&&null||wr?r-=rn:r-=J",
    "||((__trace.push({tag:'cmp_vr__r',r,yr,pr,vr,_r,ge,we,Se,left:yr&&yr.length,right:_r})),(wr=vr===_r)))&&null||wr?r-=rn:r-=J"
  );

  return source;
}

function instrumentSeCmp(doSrc) {
  let source = doSrc;

  source = replaceOnce(
    source,
    "((vr=(pr=((yr=ie)||t)&&fe)&&u||yr[pr])||o)",
    "((((vr=(pr=((yr=ie)||t)&&fe)&&u||yr[pr]),__trace.push({tag:'se_load',r,ie,fe,yr,pr,vr,se}),vr))||o)"
  );

  source = replaceOnce(
    source,
    "((se^=vr)||l)",
    "(((__trace.push({tag:'se_xor_before',r,se,vr})),(se^=vr),(__trace.push({tag:'se_xor_after',r,se})),se)||l)"
  );

  source = replaceOnce(
    source,
    "&&(xr=((Pr=(jr=wr%Sr)&&null||_r<<jr)||o)&&vr^Pr)&&null||(se=xr)&&null||(yr=h)&&null||(se&=yr)",
    "&&(xr=((Pr=(jr=wr%Sr)&&null||_r<<jr)||o)&&vr^Pr)&&null||((__trace.push({tag:'se_assign',r,se_before_assign:se,yr,pr,vr,_r,wr,Sr,jr,Pr,xr,h})),(se=xr))&&null||(yr=h)&&null||((__trace.push({tag:'se_mask_before',r,se,yr})),(se&=yr),(__trace.push({tag:'se_mask_after',r,se})),se)"
  );

  source = replaceOnce(
    source,
    "&&(ge=jr)&&undefined||(we=s)",
    "&&((__trace.push({tag:'ge_assign',r,se,br,yr,pr,vr,_r,wr,Sr,jr,we_before:we,s})),(ge=jr))&&undefined||(we=s)"
  );

  return source;
}

function instrumentIeProxy(doSrc) {
  return replaceOnce(
    doSrc,
    "((yr=[])&&h||(ie=yr)||y)&&(fe=h)",
    "((yr=__wrapIe([]))&&h||(ie=yr)||y)&&(fe=h)"
  );
}

function instrumentIeWrite(doSrc) {
  let source = doSrc;

  source = replaceOnce(
    source,
    "(vr=(pr=(yr=ie)&&null||fe)&&undefined||re)&&c||(yr[pr]=vr)",
    "(vr=(pr=(yr=ie)&&null||fe)&&undefined||re)&&c||((__trace.push({tag:'ie_write1',r,pr,fe,vr,re,ie:ie.slice()})),(yr[pr]=vr))"
  );

  source = replaceOnce(
    source,
    "((vr=(pr=(yr=ie)&&null||fe)&&undefined||Vl)||w)&&(Sr=((wr=(_r=fe)&&undefined||Wl)||m)&&_r*wr)&&v||(jr=vr^Sr)&&null||(yr[pr]=jr)",
    "((vr=(pr=(yr=ie)&&null||fe)&&undefined||Vl)||w)&&(Sr=((wr=(_r=fe)&&undefined||Wl)||m)&&_r*wr)&&v||(jr=vr^Sr)&&null||((__trace.push({tag:'ie_write2',r,pr,fe,vr,Sr,jr,Vl,Wl,ie:ie.slice()})),(yr[pr]=jr))"
  );

  return source;
}

function instrumentMrProxy(doSrc) {
  return replaceOnce(
    doSrc,
    "mr=((yr=(t=pr)&&null||[])||_)&&yr",
    "mr=((yr=(t=pr)&&null||__wrapMr([]))||_)&&yr"
  );
}

function instrumentReCmp(doSrc) {
  let source = doSrc;

  source = replaceOnce(
    source,
    "re=((Ur=(Kr=Zl)&&undefined||Hr^Kr)||d)&&Ur",
    "((re=((Ur=(Kr=Zl)&&undefined||Hr^Kr)||d)&&Ur),__trace.push({tag:'re1',r,fe,re,Ur,Kr,Hr}),re)"
  );

  source = replaceOnce(
    source,
    "re=(Cr=Ur&$r)&&undefined||Cr",
    "((re=(Cr=Ur&$r)&&undefined||Cr),__trace.push({tag:'re2',r,fe,re,Ur,$r,Cr}),re)"
  );

  source = replaceOnce(
    source,
    "re=jr",
    "((re=jr),__trace.push({tag:'re3',r,fe,re,jr}),re)"
  );

  source = replaceOnce(
    source,
    "re=((Hr=jr^Fr)||_)&&Hr",
    "((re=((Hr=jr^Fr)||_)&&Hr),__trace.push({tag:'re4',r,fe,re,jr,Fr,Hr}),re)"
  );

  source = replaceOnce(
    source,
    "re^=vr",
    "((re^=vr),__trace.push({tag:'re5',r,fe,re,vr}),re)"
  );

  source = replaceOnce(
    source,
    "re=(kr=((Er=A)||p)&&xr&Er)&&undefined||kr",
    "((re=(kr=((Er=A)||p)&&xr&Er)&&undefined||kr),__trace.push({tag:'re6',r,fe,re,xr,kr}),re)"
  );

  source = replaceOnce(
    source,
    "re=vr",
    "((re=vr),__trace.push({tag:'re7',r,fe,re,vr,te,ee}),re)"
  );

  return source;
}

function instrumentUrCmp(doSrc) {
  let source = doSrc;

  source = replaceOnce(
    source,
    "xr=((Pr=((jr=wr+Sr)||_)&&pr<<jr)||p)&&ce",
    "((xr=((Pr=((jr=wr+Sr)||_)&&pr<<jr)||p)&&ce),__trace.push({tag:'ur_xr',r,fe,pr,jr,Sr,Pr,ce,xr}),xr)"
  );

  source = replaceOnce(
    source,
    "Dr=((kr=(Er=le)&&undefined||T)||m)&&Er%kr",
    "((Dr=((kr=(Er=le)&&undefined||T)||m)&&Er%kr),__trace.push({tag:'ur_dr',r,fe,le,Er,kr,Dr}),Dr)"
  );

  source = replaceOnce(
    source,
    "Hr=(Fr=((Mr=b)||y)&&Dr+Mr)&&undefined||xr>>>Fr",
    "((Hr=(Fr=((Mr=b)||y)&&Dr+Mr)&&undefined||xr>>>Fr),__trace.push({tag:'ur_hr',r,fe,xr,Dr,Fr,Mr,Hr}),Hr)"
  );

  source = replaceOnce(
    source,
    "Ur=(Kr=Pr|Hr)&&v||yr+Kr",
    "((Ur=(Kr=Pr|Hr)&&v||yr+Kr),__trace.push({tag:'ur_ur',r,fe,yr,Pr,Hr,Kr,Ur}),Ur)"
  );

  source = replaceOnce(
    source,
    "re=(Cr=Ur&$r)&&undefined||Cr",
    "((re=(Cr=Ur&$r)&&undefined||Cr),__trace.push({tag:'ur_re2',r,fe,re,Ur,$r,Cr}),re)"
  );

  return source;
}

function instrumentCeCmp(doSrc) {
  let source = doSrc;

  source = replaceOnce(
    source,
    "ce=vr",
    "((ce=vr),__trace.push({tag:'ce1',r,fe,ce,vr,pr}),ce)"
  );

  source = replaceOnce(
    source,
    "vr=((pr=ce)||m)&&fe",
    "((vr=((pr=ce)||m)&&fe),__trace.push({tag:'ce_pr',r,fe,ce,pr,vr}),vr)"
  );

  source = replaceOnce(
    source,
    "ce=((xr=((Pr=pr^jr)||S)&&yr[Pr])||_)&&xr",
    "((ce=((xr=((Pr=pr^jr)||S)&&yr[Pr])||_)&&xr),__trace.push({tag:'ce2',r,fe,ce,pr,jr,Pr,xr,yr}),ce)"
  );

  source = replaceOnce(
    source,
    "yr=ce",
    "((__trace.push({tag:'ce_after',r,fe,ce,pr,jr})),yr=ce)"
  );

  source = replaceOnce(
    source,
    "xr=((Pr=((jr=wr+Sr)||_)&&pr<<jr)||p)&&ce",
    "((xr=((Pr=((jr=wr+Sr)||_)&&pr<<jr)||p)&&ce),__trace.push({tag:'ce_ur_xr',r,fe,pr,jr,Sr,Pr,ce,xr}),xr)"
  );

  return source;
}

function instrumentMrCmp(doSrc) {
  return replaceOnce(
    doSrc,
    "yr=yr[pr](xr,$r,Xr,Yr)&&undefined||Array",
    "yr=((__trace.push({tag:'mr_push4',r,br,pr,xr,$r,Xr,Yr,mr_len:mr.length})),yr[pr](xr,$r,Xr,Yr),undefined)||Array"
  );
}

function instrumentMrXrCmp(doSrc) {
  let source = doSrc;

  source = replaceOnce(
    source,
    "vr=(pr=(yr=mr)&&null||rf)&&undefined||Tr",
    "((vr=(pr=(yr=mr)&&null||rf)&&undefined||Tr),__trace.push({tag:'mr_load',r,br,rf,pr,vr,Tr}),vr)"
  );

  source = replaceOnce(
    source,
    "xr=(Pr=(jr=vr>>>Sr)&&b||g)&&null||jr&Pr",
    "((xr=(Pr=(jr=vr>>>Sr)&&b||g)&&null||jr&Pr),__trace.push({tag:'mr_xr',r,br,vr,Sr,jr,Pr,xr}),xr)"
  );

  source = replaceOnce(
    source,
    "yr=yr[pr](xr,$r,Xr,Yr)&&undefined||Array",
    "yr=((__trace.push({tag:'mr_push4',r,br,pr,xr,$r,Xr,Yr,mr_len:mr.length})),yr[pr](xr,$r,Xr,Yr),undefined)||Array"
  );

  return source;
}

function instrumentSrCmp(doSrc) {
  let source = doSrc;

  source = replaceOnce(
    source,
    "Tr=vr",
    "((Tr=vr),__trace.push({tag:'tr_set',r,br,Tr,vr}),Tr)"
  );

  source = replaceOnce(
    source,
    "Or=(jr=wr===Sr)&&undefined||jr",
    "((Or=(jr=wr===Sr)&&undefined||jr),__trace.push({tag:'or_set',r,br,wr,Sr,jr,Or}),Or)"
  );

  source = replaceOnce(
    source,
    "Sr=((wr=((_r=k)||S)&&Or)||w)&&_r*wr",
    "((Sr=((wr=((_r=k)||S)&&Or)||w)&&_r*wr),__trace.push({tag:'sr_calc',r,br,k,Or,_r,wr,Sr}),Sr)"
  );

  source = replaceOnce(
    source,
    "xr=(Pr=(jr=vr>>>Sr)&&b||g)&&null||jr&Pr",
    "((xr=(Pr=(jr=vr>>>Sr)&&b||g)&&null||jr&Pr),__trace.push({tag:'mr_xr',r,br,vr,Sr,jr,Pr,xr}),xr)"
  );

  source = replaceOnce(
    source,
    "yr=yr[pr](xr,$r,Xr,Yr)&&undefined||Array",
    "yr=((__trace.push({tag:'mr_push4',r,br,pr,xr,$r,Xr,Yr,mr_len:mr.length})),yr[pr](xr,$r,Xr,Yr),undefined)||Array"
  );

  return source;
}

function buildInstrumenter(name) {
  if (name === "gecmp") {
    return instrumentGeCmp;
  }
  if (name === "secmp") {
    return instrumentSeCmp;
  }
  if (name === "ieproxy") {
    return instrumentIeProxy;
  }
  if (name === "iewrite") {
    return instrumentIeWrite;
  }
  if (name === "mrproxy") {
    return instrumentMrProxy;
  }
  if (name === "recmp") {
    return instrumentReCmp;
  }
  if (name === "urcmp") {
    return instrumentUrCmp;
  }
  if (name === "cecmp") {
    return instrumentCeCmp;
  }
  if (name === "mrcmp") {
    return instrumentMrCmp;
  }
  if (name === "mrxrcmp") {
    return instrumentMrXrCmp;
  }
  if (name === "srcmp") {
    return instrumentSrCmp;
  }
  throw new Error(`unknown probe: ${name}`);
}

function installProbeHelpers(target, probe) {
  if (probe !== "ieproxy" && probe !== "mrproxy") {
    return;
  }

  function wrapArray(tag, array) {
    return new Proxy(array, {
      set(inner, prop, value, receiver) {
        if (/^\d+$/.test(String(prop))) {
          target.__trace.push({
            tag,
            index: Number(prop),
            value,
            stack: String(new Error().stack || "")
              .split("\n")
              .slice(1, 4)
              .map((line) => line.trim())
              .join(" | "),
          });
        }
        return Reflect.set(inner, prop, value, receiver);
      },
    });
  }

  target.__wrapIe = function __wrapIe(array) {
    return wrapArray("ie_set", array);
  };

  target.__wrapMr = function __wrapMr(array) {
    return wrapArray("mr_set", array);
  };
}

function normalizeScopes() {
  const closureDump = readJson(CLOSURE_DUMP);
  return buildPrimitiveScopes(closureDump);
}

function runNodeProbe(probe, input) {
  const instrument = buildInstrumenter(probe);
  const { Do, context, source } = createDoRunner({ instrument });
  context.__trace = [];
  installProbeHelpers(context, probe);
  const result = Do(input);
  return {
    result,
    trace: context.__trace,
    sourceLength: source.length,
  };
}

async function runBrowserProbe(probe, input) {
  const pauseDump = readJson(PAUSE_DUMP);
  const source = buildInstrumenter(probe)(pauseDump.DoSrc);
  const scopes = normalizeScopes();

  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: CHROME,
    args: [
      "--remote-allow-origins=*",
      "--no-first-run",
      "--no-default-browser-check",
    ],
  });

  try {
    const page = await browser.newPage();
    await page.goto("about:blank", { waitUntil: "domcontentloaded", timeout: 30000 });

    return await page.evaluate(({ inputValue, instrumentedSource, scopeList }) => {
      const scopeObjs = scopeList.map((scope) => Object.assign(Object.create(null), scope));
      scopeObjs[4].n = undefined;

      let body = `(${instrumentedSource})`;
      for (let index = 0; index < 6; index += 1) {
        body = `with (__scopes[${index}]) { ${body} }`;
      }

      window.__trace = [];
      window.__scopes = scopeObjs;
      if (!window.__wrapIe || !window.__wrapMr) {
        function wrapArray(tag, array) {
          return new Proxy(array, {
            set(inner, prop, value, receiver) {
              if (/^\\d+$/.test(String(prop))) {
                window.__trace.push({
                  tag,
                  index: Number(prop),
                  value,
                  stack: String(new Error().stack || "")
                    .split("\n")
                    .slice(1, 4)
                    .map((line) => line.trim())
                    .join(" | "),
                });
              }
              return Reflect.set(inner, prop, value, receiver);
            },
          });
        }

        window.__wrapIe = function __wrapIe(array) {
          return wrapArray("ie_set", array);
        };

        window.__wrapMr = function __wrapMr(array) {
          return wrapArray("mr_set", array);
        };
      }
      const Do = eval(body);
      const result = Do(inputValue);
      return {
        result,
        trace: window.__trace,
      };
    }, {
      inputValue: input,
      instrumentedSource: source,
      scopeList: scopes,
    });
  } finally {
    await browser.close();
  }
}

function sameEntry(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function firstDiff(nodeTrace, browserTrace) {
  const limit = Math.max(nodeTrace.length, browserTrace.length);
  for (let index = 0; index < limit; index += 1) {
    if (!sameEntry(nodeTrace[index], browserTrace[index])) {
      return {
        index,
        node: nodeTrace[index] ?? null,
        browser: browserTrace[index] ?? null,
      };
    }
  }
  return null;
}

async function main() {
  const probe = process.argv[2] || "gecmp";
  const input = process.argv[3] || "abc";

  const nodeResult = runNodeProbe(probe, input);
  const browserResult = await runBrowserProbe(probe, input);
  const diff = firstDiff(nodeResult.trace, browserResult.trace);

  console.log(JSON.stringify({
    probe,
    input,
    node: nodeResult,
    browser: browserResult,
    firstDiff: diff,
  }, null, 2));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error && error.stack ? error.stack : error);
    process.exitCode = 1;
  });
}

module.exports = {
  instrumentGeCmp,
  instrumentSeCmp,
  instrumentIeProxy,
  instrumentIeWrite,
  instrumentMrProxy,
  instrumentReCmp,
  instrumentUrCmp,
  instrumentCeCmp,
  instrumentMrCmp,
  instrumentMrXrCmp,
  instrumentSrCmp,
  runNodeProbe,
  runBrowserProbe,
  firstDiff,
};
