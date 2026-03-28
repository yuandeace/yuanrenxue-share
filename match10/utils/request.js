const {
  closeRuntime,
  createRuntime,
  requestQuestionPage,
  waitForFirstPage,
} = require("./encrypt");

async function collectAllPages(sessionConfig = {}, onProgress) {
  const runtime = await createRuntime(sessionConfig);

  try {
    const pages = [];

    if (typeof onProgress === "function") {
      onProgress({ page: 1, totalPages: 5, stage: "waiting" });
    }
    const firstPage = await waitForFirstPage(runtime, sessionConfig.firstPageTimeoutMs);
    pages.push({ page: 1, response: firstPage });
    if (typeof onProgress === "function") {
      onProgress({ page: 1, totalPages: 5, stage: "done", count: (firstPage.data || []).length });
    }

    for (let page = 2; page <= 5; page += 1) {
      if (typeof onProgress === "function") {
        onProgress({ page, totalPages: 5, stage: "waiting" });
      }
      const response = await requestQuestionPage(runtime, page, page === 5 ? { headers: { "User-Agent": "yuanrenxue" } } : {});
      pages.push({ page, response });
      if (typeof onProgress === "function") {
        onProgress({ page, totalPages: 5, stage: "done", count: (response.data || []).length });
      }
    }

    const values = pages.flatMap((item) => (Array.isArray(item.response.data) ? item.response.data.map(Number) : []));
    const answer = values.reduce((sum, value) => sum + value, 0);

    return {
      answer,
      errors: runtime.state.errors.slice(),
      pages,
      values,
    };
  } finally {
    closeRuntime(runtime);
  }
}

module.exports = {
  collectAllPages,
};
