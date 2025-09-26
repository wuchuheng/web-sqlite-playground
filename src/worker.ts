import sqliteWasmUrl from "./jswasm/sqlite3.wasm?url";

self.onmessage = async (event) => {
  const { data } = event;
  console.log("Worker received message:", data);

  // Fetch the WASM file and instantiate the module
  const wasmResponse = await fetch(sqliteWasmUrl);
  const sqliteWasmBytes = await wasmResponse.arrayBuffer();

  // Create the wasmImports object (same functions used by both env and wasi_snapshot_preview1)
  const wasmImports = {
    // System calls that SQLite expects
    __syscall_chmod: () => 0,
    __syscall_faccessat: () => 0,
    __syscall_fchmod: () => 0,
    __syscall_fchown32: () => 0,
    __syscall_fcntl64: () => 0,
    __syscall_fstat64: () => 0,
    __syscall_ftruncate64: () => 0,
    __syscall_getcwd: () => 0,
    __syscall_ioctl: () => 0,
    __syscall_lstat64: () => 0,
    __syscall_mkdirat: () => 0,
    __syscall_newfstatat: () => 0,
    __syscall_openat: () => 0,
    __syscall_readlinkat: () => 0,
    __syscall_rmdir: () => 0,
    __syscall_stat64: () => 0,
    __syscall_unlinkat: () => 0,
    __syscall_utimensat: () => 0,

    // Emscripten functions
    _emscripten_get_now_is_monotonic: () => 1,
    _localtime_js: () => 0,
    _mmap_js: () => 0,
    _munmap_js: () => 0,
    _tzset_js: () => 0,
    emscripten_date_now: () => Date.now(),
    emscripten_get_now: () => performance.now(),
    emscripten_resize_heap: () => false,

    // Environment functions
    environ_get: () => 0,
    environ_sizes_get: () => 0,

    // File descriptor operations
    fd_close: () => 0,
    fd_fdstat_get: () => 0,
    fd_read: () => 0,
    fd_seek: () => 0,
    fd_sync: () => 0,
    fd_write: () => 0,
  };

  // Use the same pattern as sqlite3.mjs: both env and wasi_snapshot_preview1 use the same imports
  const imports = {
    env: wasmImports,
    wasi_snapshot_preview1: wasmImports,
  };

  const { instance } = await WebAssembly.instantiate(sqliteWasmBytes, imports);
  console.log("SQLite WASM Module instantiated:", instance);

  // Print all exported functions
  console.log("=== SQLite WASM Exported Functions ===");
  const exports = instance.exports;
  const exportEntries = Object.entries(exports);
  console.log(`Total exports: ${exportEntries.length}`);

  const functions: string[] = [];
  const memory: string[] = [];
  const globals: string[] = [];
  const tables: string[] = [];

  exportEntries.forEach(([name, exportedItem]) => {
    if (typeof exportedItem === "function") {
      functions.push(name);
      console.log(`📋 Function: ${name}`);
    } else if (exportedItem instanceof WebAssembly.Memory) {
      memory.push(name);
      console.log(
        `🧠 Memory: ${name} - ${exportedItem.buffer.byteLength} bytes`
      );
    } else if (exportedItem instanceof WebAssembly.Global) {
      globals.push(name);
      console.log(`🌐 Global: ${name} - value: ${exportedItem.value}`);
    } else if (exportedItem instanceof WebAssembly.Table) {
      tables.push(name);
      console.log(`📊 Table: ${name} - length: ${exportedItem.length}`);
    }
  });

  console.log("=== Summary ===");
  console.log(`Functions: ${functions.length}`, functions);
  console.log(`Memory: ${memory.length}`, memory);
  console.log(`Globals: ${globals.length}`, globals);
  console.log(`Tables: ${tables.length}`, tables);
};
