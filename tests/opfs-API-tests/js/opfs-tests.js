const sahPoolConfig = {
  name: "opfs-sahpool-tester1",
  clearOnInit: true,
  initialCapacity: 6,
};

let capi;
let wasm;

const hasOpfs = () =>
  !!(
    globalThis.FileSystemHandle &&
    globalThis.FileSystemDirectoryHandle &&
    globalThis.FileSystemFileHandle &&
    globalThis.FileSystemFileHandle.prototype.createSyncAccessHandle &&
    navigator?.storage?.getDirectory
  );

export function setSqliteReferences(sqlite3) {
  capi = sqlite3.capi;
  wasm = sqlite3.wasm;
}

export function registerOpfsTests({ T, error }) {
  T.g(
    "OPFS: Origin-Private File System",
    (sqlite3) =>
      sqlite3.capi.sqlite3_vfs_find("opfs") || 'requires "opfs" VFS',
  )
    .t({
      name: "OPFS db sanity checks",
      async test(sqlite3) {
        T.assert(capi.sqlite3_vfs_find("opfs"));
        const opfs = sqlite3.opfs;
        const filename = (this.opfsDbFile = "/dir/sqlite3-opfs-tests.db");
        const fileUri = `file://${filename}?delete-before-open=1`;
        const initSql = [
          "create table p(a);",
          "insert into p(a) values(1),(2),(3)",
        ];
        let db = new sqlite3.oo1.OpfsDb(fileUri);
        try {
          db.exec(initSql);
          T.assert(3 === db.selectValue("select count(*) from p"));
          db.close();
          db = new sqlite3.oo1.OpfsDb(filename);
          db.exec("insert into p(a) values(4),(5),(6)");
          T.assert(6 === db.selectValue("select count(*) from p"));
          this.opfsDbExport = capi.sqlite3_js_db_export(db);
          T.assert(this.opfsDbExport instanceof Uint8Array).assert(
            this.opfsDbExport.byteLength > 0 &&
              this.opfsDbExport.byteLength % 512 === 0,
          );
        } finally {
          db.close();
        }
        T.assert(await opfs.entryExists(filename));
        try {
          db = new sqlite3.oo1.OpfsDb(fileUri);
          db.exec(initSql);
          T.assert(3 === db.selectValue("select count(*) from p"));
        } finally {
          if (db) db.close();
        }
      },
    })
    .t({
      name: "OPFS import",
      async test(sqlite3) {
        let db;
        const filename = this.opfsDbFile;
        try {
          const exp = this.opfsDbExport;
          delete this.opfsDbExport;
          this.opfsImportSize = await sqlite3.oo1.OpfsDb.importDb(
            filename,
            exp,
          );
          db = new sqlite3.oo1.OpfsDb(this.opfsDbFile);
          T.assert(6 === db.selectValue("select count(*) from p")).assert(
            this.opfsImportSize === exp.byteLength,
          );
          db.close();
          const unlink = (this.opfsUnlink = (fn = filename) =>
            sqlite3.util.sqlite3__wasm_vfs_unlink("opfs", fn));
          this.opfsUnlink(filename);
          T.assert(!(await sqlite3.opfs.entryExists(filename)));
          let cursor = 0;
          const blockSize = 512;
          const reader = async () => {
            if (cursor >= exp.byteLength) {
              return undefined;
            }
            const next = exp.subarray(
              cursor,
              Math.min(cursor + blockSize, exp.byteLength),
            );
            cursor += blockSize;
            return next;
          };
          this.opfsImportSize = await sqlite3.oo1.OpfsDb.importDb(
            filename,
            reader,
          );
          db = new sqlite3.oo1.OpfsDb(this.opfsDbFile);
          T.assert(6 === db.selectValue("select count(*) from p")).assert(
            this.opfsImportSize === exp.byteLength,
          );
        } finally {
          if (db) db.close();
        }
      },
    })
    .t({
      name: "(Internal-use) OPFS utility APIs",
      async test(sqlite3) {
        const filename = this.opfsDbFile;
        const unlink = this.opfsUnlink;
        T.assert(filename && unlink);
        delete this.opfsDbFile;
        delete this.opfsUnlink;
        const opfs = sqlite3.opfs;
        const fSize = this.opfsImportSize;
        delete this.opfsImportSize;
        let sh;
        try {
          T.assert(await opfs.entryExists(filename));
          const [dirHandle, filenamePart] = await opfs.getDirForFilename(
            filename,
            false,
          );
          const fh = await dirHandle.getFileHandle(filenamePart);
          sh = await fh.createSyncAccessHandle();
          T.assert(fSize === (await sh.getSize()));
          await sh.close();
          sh = undefined;
          unlink();
          T.assert(!(await opfs.entryExists(filename)));
        } finally {
          if (sh) await sh.close();
          unlink();
        }

        const testDir = `/sqlite3-opfs-${opfs.randomFilename(12)}`;
        const aDir = `${testDir}/test/dir`;
        T.assert(await opfs.mkdir(aDir), "mkdir failed")
          .assert(
            await opfs.mkdir(aDir),
            "mkdir must pass if the dir exists",
          )
          .assert(
            !(await opfs.unlink(`${testDir}/test`)),
            "delete 1 should have failed (dir not empty)",
          )
          .assert(
            await opfs.unlink(`${testDir}/test/dir`),
            "delete 2 failed",
          )
          .assert(
            !(await opfs.unlink(`${testDir}/test/dir`)),
            "delete 2b should have failed (dir already deleted)",
          )
          .assert(
            await opfs.unlink(testDir, true),
            "delete 3 failed",
          )
          .assert(
            !(await opfs.entryExists(testDir)),
            `entryExists(${testDir}) should have failed`,
          );
      },
    });

  T.g(
    "OPFS SyncAccessHandle Pool VFS",
    (sqlite3) => hasOpfs() || "requires OPFS APIs",
  ).t({
    name: "SAH sanity checks",
    async test(sqlite3) {
      T.assert(!sqlite3.capi.sqlite3_vfs_find(sahPoolConfig.name)).assert(
        sqlite3.capi.sqlite3_js_vfs_list().indexOf(sahPoolConfig.name) < 0,
      );
      const inst = sqlite3.installOpfsSAHPoolVfs;
      const catcher = (e) => {
        error(
          "Cannot load SAH pool VFS.",
          "This might not be a problem,",
          "depending on the environment.",
        );
        return false;
      };
      let u1;
      let u2;
      const P1 = inst(sahPoolConfig)
        .then((u) => (u1 = u))
        .catch(catcher);
      const P2 = inst(sahPoolConfig)
        .then((u) => (u2 = u))
        .catch(catcher);
      await Promise.all([P1, P2]);
      if (!(await P1)) return;
      T.assert(u1 === u2)
        .assert(sahPoolConfig.name === u1.vfsName)
        .assert(sqlite3.capi.sqlite3_vfs_find(sahPoolConfig.name))
        .assert(u1.getCapacity() >= sahPoolConfig.initialCapacity)
        .assert(u1.getCapacity() + 2 === (await u2.addCapacity(2)))
        .assert(2 === (await u2.reduceCapacity(2)))
        .assert(
          sqlite3.capi
            .sqlite3_js_vfs_list()
            .indexOf(sahPoolConfig.name) >= 0,
        );

      T.assert(0 === u1.getFileCount());
      const dbName = "/foo.db";
      let db = new u1.OpfsSAHPoolDb(dbName);
      T.assert(db instanceof sqlite3.oo1.DB).assert(
        1 === u1.getFileCount(),
      );
      db.exec([
        "pragma locking_mode=exclusive;",
        "pragma journal_mode=wal;",
        "create table t(a);",
        "insert into t(a) values(1),(2),(3)",
      ]);
      T.assert(2 === u1.getFileCount())
        .assert(3 === db.selectValue("select count(*) from t"))
        .assert(
          db.selectValue("pragma journal_mode") === "wal" ||
            wasm.compileOptionUsed("OMIT_WAL"),
        );
      db.close();
      T.assert(1 === u1.getFileCount());
      db = new u2.OpfsSAHPoolDb(dbName);
      T.assert(1 === u1.getFileCount())
        .mustThrowMatching(
          () => u1.pauseVfs(),
          (err) =>
            capi.SQLITE_MISUSE === err.resultCode &&
            /^SQLITE_MISUSE: Cannot pause VFS /.test(err.message),
          "Cannot pause VFS with opened db.",
        );
      db.close();
      T.assert(u2 === u2.pauseVfs())
        .assert(u2.isPaused())
        .assert(0 === capi.sqlite3_vfs_find(u2.vfsName))
        .mustThrowMatching(
          () => new u2.OpfsSAHPoolDb(dbName),
          /.+no such vfs: .+/,
          "VFS is not available",
        )
        .assert(u2 === (await u2.unpauseVfs()))
        .assert(
          u2 === (await u1.unpauseVfs()),
          "unpause is a no-op if the VFS is not paused",
        )
        .assert(0 !== capi.sqlite3_vfs_find(u2.vfsName));
      const fileNames = u1.getFileNames();
      T.assert(1 === fileNames.length)
        .assert(dbName === fileNames[0])
        .assert(1 === u1.getFileCount());

      const dbytes = u1.exportFile(dbName);
      T.assert(dbytes.length >= 4096);
      const dbName2 = "/exported.db";
      let nWrote = u1.importDb(dbName2, dbytes);
      T.assert(2 === u1.getFileCount()).assert(
        dbytes.byteLength === nWrote,
      );
      let db2 = new u1.OpfsSAHPoolDb(dbName2);
      T.assert(db2 instanceof sqlite3.oo1.DB)
        .assert(
          "wal" !== db2.selectValue("pragma journal_mode"),
        )
        .assert(3 === db2.selectValue("select count(*) from t"));
      db2.close();
      T.assert(true === u1.unlink(dbName2))
        .assert(false === u1.unlink(dbName2))
        .assert(1 === u1.getFileCount())
        .assert(1 === u1.getFileNames().length);

      let cursor = 0;
      const blockSize = 1024;
      const reader = async () => {
        if (cursor >= dbytes.byteLength) return undefined;
        const next = dbytes.subarray(
          cursor,
          Math.min(cursor + blockSize, dbytes.byteLength),
        );
        cursor += blockSize;
        return next;
      };
      nWrote = await u1.importDb(dbName2, reader);
      T.assert(2 === u1.getFileCount());
      db2 = new u1.OpfsSAHPoolDb(dbName2);
      T.assert(db2 instanceof sqlite3.oo1.DB).assert(
        3 === db2.selectValue("select count(*) from t"),
      );
      db2.close();
      T.assert(true === u1.unlink(dbName2)).assert(
        dbytes.byteLength === nWrote,
      );

      T.assert(true === u1.unlink(dbName))
        .assert(false === u1.unlink(dbName))
        .assert(0 === u1.getFileCount())
        .assert(0 === u1.getFileNames().length);

      const conf2 = JSON.parse(JSON.stringify(sahPoolConfig));
      conf2.name += "-test2";
      const POther = await inst(conf2);
      T.assert(0 === POther.getFileCount()).assert(
        true === (await POther.removeVfs()),
      );

      T.assert(true === (await u2.removeVfs()))
        .assert(false === (await u1.removeVfs()))
        .assert(!sqlite3.capi.sqlite3_vfs_find(sahPoolConfig.name));

      let cErr;
      let u3;
      conf2.$testThrowPhase2 = new Error("Testing throwing during init.");
      conf2.name = `${sahPoolConfig.name}-err`;
      const P3 = await inst(conf2)
        .then((u) => (u3 = u))
        .catch((e) => (cErr = e));
      T.assert(P3 === conf2.$testThrowPhase2)
        .assert(cErr === P3)
        .assert(u3 === undefined)
        .assert(!sqlite3.capi.sqlite3_vfs_find(conf2.name));
      delete conf2.$testThrowPhase2;
      T.assert(
        cErr === (await inst(conf2).catch((e) => e)),
        "Init result is cached even if it failed",
      );

      cErr = undefined;
      u3 = undefined;
      conf2.forceReinitIfPreviouslyFailed = true;
      conf2.verbosity = 3;
      const P3b = await inst(conf2)
        .then((u) => (u3 = u))
        .catch((e) => (cErr = e));
      T.assert(cErr === undefined)
        .assert(P3b === u3)
        .assert(P3b === (await inst(conf2)))
        .assert(true === (await u3.removeVfs()))
        .assert(false === (await P3b.removeVfs()));
    },
  });
}
