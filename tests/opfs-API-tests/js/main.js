import sqlite3InitModule from "../../../src/jswasm/sqlite3.mjs";
import { initUi } from "./ui.js";
import { createTestHarness } from "./test-harness.js";
import { registerOpfsTests, setSqliteReferences } from "./opfs-tests.js";

globalThis.sqlite3InitModule = sqlite3InitModule;

const ui = initUi();
const harness = createTestHarness(ui);
registerOpfsTests({ T: harness.T, error: ui.error });

const main = async () => {
  ui.log("Loading and initializing sqlite3 WASM module...");
  sqlite3InitModule.__isUnderTest = true;
  const sqlite3 = await sqlite3InitModule({
    print: ui.log,
    printErr: ui.error,
  });
  harness.T.assert(!!sqlite3.util);
  ui.log("Done initializing WASM/JS bits. Running tests...");
  sqlite3.config.warn(
    "Installing sqlite3 bits as global S for local dev/test purposes.",
  );
  globalThis.S = sqlite3;
  setSqliteReferences(sqlite3);
  const { capi, wasm } = sqlite3;
  ui.log("sqlite3 version:", capi.sqlite3_libversion(), capi.sqlite3_sourceid());
  if (wasm.bigIntEnabled) {
    ui.log("BigInt/int64 support is enabled.");
  } else {
    ui.log("BigInt/int64 support is disabled.");
  }
  ui.log("registered vfs list =", capi.sqlite3_js_vfs_list().join(", "));
  await harness.runTests(sqlite3);
};

main().catch((err) => {
  ui.error("Fatal error while running tests:", err);
  ui.reportFinalTestStatus(false);
});
