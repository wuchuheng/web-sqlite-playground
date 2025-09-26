const mapToString = (value) => {
  switch (typeof value) {
    case "number":
    case "string":
    case "boolean":
    case "undefined":
    case "bigint":
      return String(value);
  }
  if (value === null) return "null";
  if (value instanceof Error) {
    return JSON.stringify(
      {
        message: value.message,
        stack: value.stack,
        errorClass: value.name,
      },
      undefined,
      2,
    );
  }
  try {
    return JSON.stringify(value, undefined, 2);
  } catch {
    return String(value);
  }
};

const normalizeArgs = (args) => args.map(mapToString);

export function initUi() {
  const logTarget = document.querySelector("#test-output");
  const checkboxReverse = document.querySelector("#cb-log-reverse");
  const titleElement = document.querySelector("title");
  const header = document.querySelector("#color-target");
  const originalTitle = titleElement?.textContent ?? "";

  if (header && originalTitle) {
    header.textContent = originalTitle;
  }

  const logClass = (cssClass, ...args) => {
    const entry = document.createElement("div");
    entry.classList.add("log-entry");
    const classList = Array.isArray(cssClass) ? cssClass : [cssClass];
    classList.filter(Boolean).forEach((cls) => entry.classList.add(cls));
    entry.append(document.createTextNode(normalizeArgs(args).join(" ")));
    logTarget.append(entry);
  };

  const updateLogOrder = () => {
    logTarget.classList[checkboxReverse.checked ? "add" : "remove"](
      "reverse",
    );
  };

  checkboxReverse.addEventListener("change", updateLogOrder, true);
  updateLogOrder();

  const reportFinalTestStatus = (pass) => {
    if (header) {
      header.classList.add(pass ? "tests-pass" : "tests-fail");
    }
    if (titleElement) {
      titleElement.textContent = `${pass ? "PASS" : "FAIL"}: ${originalTitle}`;
    }
  };

  const log = (...args) => logClass(undefined, ...args);
  const warn = (...args) => {
    console.warn(...args);
    logClass("warning", ...args);
  };
  const error = (...args) => {
    console.error(...args);
    logClass("error", ...args);
  };

  return {
    log,
    warn,
    error,
    logClass,
    reportFinalTestStatus,
  };
}
