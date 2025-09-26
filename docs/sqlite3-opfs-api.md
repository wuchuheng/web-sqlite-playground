# SQLite3 WASM + OPFS API Guide

This guide explains how to use the SQLite3 WebAssembly bundle shipped in `src/jswasm` with Origin Private File System (OPFS) persistence. It covers module loading, the high-level OO1 API, worker-based access via the promise-friendly Worker #1 adapter, and helper utilities for managing OPFS storage.

## 1. Prerequisites
- **Serve over HTTP/HTTPS.** Browsers refuse to load `.wasm` modules from `file://` URLs.
- **Enable SharedArrayBuffer (SAB).** Your server must emit `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` headers; without them OPFS features remain inaccessible.
- **Browser support.** You need the OPFS APIs (`navigator.storage.getDirectory`, `FileSystemSyncAccessHandle`, `SharedArrayBuffer`, `Atomics`).
- **Load the correct bundle.** Import `sqlite3.mjs` for ES modules, `sqlite3.js` for classic scripts, or the `*-bundler-friendly` variants when bundling.

## 2. Architecture Overview
```
+---------------------------+
| Main Thread / UI          |  sqlite3InitModule()
|  - sqlite3 namespace      |<--------------------------+
+-------------+-------------+                           |
              | sqlite3Worker1Promiser()                |
              v                                         |
+---------------------------+   initWorker1API()        |
| Worker #1 (sqlite3-worker1)|--------------------------+
|  - sqlite3.oo1.DB handles  |
+-------------+--------------+
              |
              v  OPFS async proxy (sqlite3-opfs-async-proxy.js)
+---------------------------+
| Origin Private File System|
|  - sqlite3.opfs utilities |
+---------------------------+
```

## 3. Bootstrapping the Module
```js
import sqlite3InitModule from './src/jswasm/sqlite3.mjs';

const sqlite3 = await sqlite3InitModule({
  print: console.log,
  printErr: console.error
});

if (!sqlite3.opfs) {
  throw new Error('OPFS VFS unavailable. Check COOP/COEP headers.');
}

console.log('Loaded SQLite', sqlite3.version.libVersion);
```

Once resolved, the returned `sqlite3` namespace exposes:
- `config`: logging hooks, feature flags, VFS registry.
- `version`: bundle metadata.
- `capi` / `wasm`: low-level C API surface.
- `util`: helpers for strings, TypedArrays, assertions.
- `oo1`: idiomatic object wrappers (`DB`, `Stmt`, etc.).
- `opfs`: available after the async OPFS VFS spins up.
- `installOpfsSAHPoolVfs(options)`: optional Sync Access Handle pool.

## 4. High-Level OO1 API with OPFS

### 4.1 Creating Databases
```js
const db = new sqlite3.oo1.OpfsDb('/databases/tasks.db');
```
`OpfsDb` extends `sqlite3.oo1.DB`, forcing the `opfs` VFS and installing a 10s busy timeout. You can still open in-memory DBs (`':memory:'`) or point to other VFSes by passing `{ filename, flags, vfs }` to `new sqlite3.oo1.DB(...)`.

### 4.2 Executing SQL
```js
db.exec(`
  CREATE TABLE IF NOT EXISTS todo (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0
  )
`);

db.exec({
  sql: 'INSERT INTO todo(title, done) VALUES (?, ?)',
  bind: ['Write docs', 0],
  returnValue: 'this'
});

const rows = db.exec({
  sql: 'SELECT id, title, done FROM todo ORDER BY id',
  rowMode: 'object',
  resultRows: []
}).resultRows;

console.table(rows);
```

`DB.exec()` accepts:
- `sql`: string or array (multiple statements `;`-joined internally).
- `bind`: single value, array, or object.
- `rowMode`: `'array'`, `'object'`, column index, or `'$columnName'`.
- `resultRows`: array to collect rows automatically.
- `callback(row, stmt)`: streaming row handler (set `countChanges` to capture affected-row counts).
- `lastInsertRowId`, `countChanges`: include metadata in the result object.

### 4.3 Prepared Statements
```js
const stmt = db.prepare('SELECT title FROM todo WHERE done = ?');
try {
  stmt.bind([0]);
  while (stmt.step()) {
    console.log(stmt.getString(0));
  }
} finally {
  stmt.finalize();
}
```

`Stmt` exposes `bind`, `step`, `get*` helpers (`get`, `getInt`, `getBlob`, `getJSON`), metadata (`getColumnNames`, `isReadOnly`) and lifecycle methods (`reset`, `clearBindings`, `finalize`).

### 4.4 Transactions
```js
db.transaction(() => {
  db.exec({ sql: 'UPDATE todo SET done = 1 WHERE id = ?', bind: [1] });
});

db.savepoint(() => {
  // ... nested work ...
});
```

## 5. Worker #1 Promiser API

For long-running work, run SQLite in a dedicated worker using the Promise-friendly adapter at `src/jswasm/sqlite3-worker1-promiser.mjs`.

```js
import promiserFactory from './src/jswasm/sqlite3-worker1-promiser.mjs';

const worker = await promiserFactory({
  debug: (...a) => console.debug('[worker]', ...a),
  onerror: console.error
});

const open = await worker('open', { filename: '/databases/tasks.db' });
console.log(open.result);

const query = await worker('exec', {
  sql: 'SELECT id, title FROM todo',
  rowMode: 'object',
  resultRows: []
});

console.table(query.result.resultRows);

await worker('close');
```

### 5.1 Message Types
| Type        | Args (subset)                                                   | Result highlights                         |
|-------------|------------------------------------------------------------------|-------------------------------------------|
| `open`      | `{ filename, vfs?, simulateError? }`                            | `{ dbId, filename, vfs, persistent }`     |
| `close`     | `{ unlink? }`                                                   | `{ filename }`                            |
| `exec`      | Mirrors `DB.exec` options (no `rowMode: 'stmt'`)                | Result rows, `changeCount`, `lastInsertRowId` |
| `config-get`| none                                                            | `bigIntEnabled`, `version`, `vfsList`     |
| `export`    | none                                                            | `byteArray`, `filename`, MIME type        |
| `toss`      | none (throws inside worker; used for testing)                   | Propagated error payload                  |

Row callbacks sent from the worker arrive as `{ type: messageId:row, rowNumber, row, columnNames }` updates, followed by a terminal message with `rowNumber: null`.

## 6. OPFS Utilities (`sqlite3.opfs`)

The async VFS exposes utility helpers once initialized:
- `entryExists(path)`, `mkdir(path)`, `unlink(path, recursive?, throwOnError?)`.
- `treeList()` and `traverse({ directory?, recursive?, callback })` to inspect the OPFS tree.
- `rmfr()` to wipe the OPFS root directory (use with caution).
- `importDb(path, bytes|asyncChunkFetcher)` and `exportFile(name)` for bulk I/O.
- `metrics.dump()` / `metrics.reset()` to inspect async-worker timings.
- `debug.asyncShutdown()` / `debug.asyncRestart()` to control the helper worker if needed.

Example: importing a bundled seed database.
```js
const response = await fetch('/seed.sqlite3');
const bytes = new Uint8Array(await response.arrayBuffer());
await sqlite3.opfs.importDb('/databases/seed.db', bytes);
```

## 7. Sync Access Handle Pool VFS (Optional)

`sqlite3.installOpfsSAHPoolVfs(options)` provisions a managed pool of `FileSystemSyncAccessHandle` instances for improved concurrency.
```js
const pool = await sqlite3.installOpfsSAHPoolVfs({
  name: 'opfs-sahpool',
  initialCapacity: 4,
  clearOnInit: false
});

const PooledDb = pool.OpfsSAHPoolDb;
const pdb = new PooledDb('/databases/pool.db');
```
`pool` exposes `addCapacity`, `reduceCapacity`, `getFileNames`, `reserveMinimumCapacity`, `exportFile`, `wipeFiles`, and pause/resume controls for maintenance.

## 8. Troubleshooting
- **`sqlite3.opfs` is undefined.** Confirm the HTTP response headers enable SharedArrayBuffer, and that you are not serving over `file://`.
- **`Missing required OPFS APIs`.** The browser either blocks OPFS (e.g., in insecure contexts) or lacks synchronous access handles. Test in recent Chromium-based browsers behind HTTPS.
- **Worker callbacks never resolve.** Ensure each message has a unique `messageId` (handled automatically by the promiser) and that the worker script URL points to `sqlite3-worker1-bundler-friendly.mjs` or the plain JS worker.
- **Precision loss for `bigint`.** Enable `sqlite3.config.bigIntEnabled` in the build, or coerce to `Number` when binding.

## 9. Next Steps
- Explore the demo pages in `src/` to see live usage patterns.
- Wrap the OO1 API in your own data-access helpers and add regression tests.
- Use the provided `tests/opfs-API-tests` harness (`pnpm run test:opfs-api`) to manually verify persistence behaviours during development.

