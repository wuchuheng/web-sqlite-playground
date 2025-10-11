export function registerWorker1(sqlite3ApiBootstrap) {
    sqlite3ApiBootstrap.initializers.push(function (
                    sqlite3
                ) {
                    const util = sqlite3.util;
                    sqlite3.initWorker1API = function () {
                        "use strict";
                        const toss = (...args) => {
                            throw new Error(args.join(" "));
                        };
                        if (!(globalThis.WorkerGlobalScope instanceof Function)) {
                            toss(
                                "initWorker1API() must be run from a Worker thread."
                            );
                        }
                        const sqlite3 =
                            this.sqlite3 || toss("Missing this.sqlite3 object.");
                        const DB = sqlite3.oo1.DB;

                        const getDbId = function (db) {
                            let id = wState.idMap.get(db);
                            if (id) return id;
                            id = "db#" + ++wState.idSeq + "@" + db.pointer;

                            wState.idMap.set(db, id);
                            return id;
                        };

                        const wState = {
                            dbList: [],

                            idSeq: 0,

                            idMap: new WeakMap(),

                            xfer: [],
                            open: function (opt) {
                                const db = new DB(opt);
                                this.dbs[getDbId(db)] = db;
                                if (this.dbList.indexOf(db) < 0)
                                    this.dbList.push(db);
                                return db;
                            },
                            close: function (db, alsoUnlink) {
                                if (db) {
                                    delete this.dbs[getDbId(db)];
                                    const filename = db.filename;
                                    const pVfs = util.sqlite3__wasm_db_vfs(
                                        db.pointer,
                                        0
                                    );
                                    db.close();
                                    const ddNdx = this.dbList.indexOf(db);
                                    if (ddNdx >= 0) this.dbList.splice(ddNdx, 1);
                                    if (alsoUnlink && filename && pVfs) {
                                        util.sqlite3__wasm_vfs_unlink(
                                            pVfs,
                                            filename
                                        );
                                    }
                                }
                            },

                            post: function (msg, xferList) {
                                if (xferList && xferList.length) {
                                    globalThis.postMessage(
                                        msg,
                                        Array.from(xferList)
                                    );
                                    xferList.length = 0;
                                } else {
                                    globalThis.postMessage(msg);
                                }
                            },

                            dbs: Object.create(null),

                            getDb: function (id, require = true) {
                                return (
                                    this.dbs[id] ||
                                    (require
                                        ? toss("Unknown (or closed) DB ID:", id)
                                        : undefined)
                                );
                            },
                        };

                        const affirmDbOpen = function (db = wState.dbList[0]) {
                            return db && db.pointer
                                ? db
                                : toss("DB is not opened.");
                        };

                        const getMsgDb = function (msgData, affirmExists = true) {
                            const db =
                                wState.getDb(msgData.dbId, false) ||
                                wState.dbList[0];
                            return affirmExists ? affirmDbOpen(db) : db;
                        };

                        const getDefaultDbId = function () {
                            return wState.dbList[0] && getDbId(wState.dbList[0]);
                        };

                        const isSpecialDbFilename = (n) => {
                            return "" === n || ":" === n[0];
                        };

                        const wMsgHandler = {
                            open: function (ev) {
                                const oargs = Object.create(null),
                                    args = ev.args || Object.create(null);
                                if (args.simulateError) {
                                    toss("Throwing because of simulateError flag.");
                                }
                                const rc = Object.create(null);
                                oargs.vfs = args.vfs;
                                oargs.filename = args.filename || "";
                                const db = wState.open(oargs);
                                rc.filename = db.filename;
                                rc.persistent =
                                    !!sqlite3.capi.sqlite3_js_db_uses_vfs(
                                        db.pointer,
                                        "opfs"
                                    );
                                rc.dbId = getDbId(db);
                                rc.vfs = db.dbVfsName();
                                return rc;
                            },

                            close: function (ev) {
                                const db = getMsgDb(ev, false);
                                const response = {
                                    filename: db && db.filename,
                                };
                                if (db) {
                                    const doUnlink =
                                        ev.args && "object" === typeof ev.args
                                            ? !!ev.args.unlink
                                            : false;
                                    wState.close(db, doUnlink);
                                }
                                return response;
                            },

                            exec: function (ev) {
                                const rc =
                                    "string" === typeof ev.args
                                        ? { sql: ev.args }
                                        : ev.args || Object.create(null);
                                if ("stmt" === rc.rowMode) {
                                    toss(
                                        "Invalid rowMode for 'exec': stmt mode",
                                        "does not work in the Worker API."
                                    );
                                } else if (!rc.sql) {
                                    toss("'exec' requires input SQL.");
                                }
                                const db = getMsgDb(ev);
                                if (rc.callback || Array.isArray(rc.resultRows)) {
                                    db._blobXfer = wState.xfer;
                                }
                                const theCallback = rc.callback;
                                let rowNumber = 0;
                                const hadColNames = !!rc.columnNames;
                                if ("string" === typeof theCallback) {
                                    if (!hadColNames) rc.columnNames = [];

                                    rc.callback = function (row, stmt) {
                                        wState.post(
                                            {
                                                type: theCallback,
                                                columnNames: rc.columnNames,
                                                rowNumber: ++rowNumber,
                                                row: row,
                                            },
                                            wState.xfer
                                        );
                                    };
                                }
                                try {
                                    const changeCount = !!rc.countChanges
                                        ? db.changes(true, 64 === rc.countChanges)
                                        : undefined;
                                    db.exec(rc);
                                    if (undefined !== changeCount) {
                                        rc.changeCount =
                                            db.changes(
                                                true,
                                                64 === rc.countChanges
                                            ) - changeCount;
                                    }
                                    const lastInsertRowId = !!rc.lastInsertRowId
                                        ? sqlite3.capi.sqlite3_last_insert_rowid(db)
                                        : undefined;
                                    if (undefined !== lastInsertRowId) {
                                        rc.lastInsertRowId = lastInsertRowId;
                                    }
                                    if (rc.callback instanceof Function) {
                                        rc.callback = theCallback;

                                        wState.post({
                                            type: theCallback,
                                            columnNames: rc.columnNames,
                                            rowNumber: null,
                                            row: undefined,
                                        });
                                    }
                                } finally {
                                    delete db._blobXfer;
                                    if (rc.callback) rc.callback = theCallback;
                                }
                                return rc;
                            },

                            "config-get": function () {
                                const rc = Object.create(null),
                                    src = sqlite3.config;
                                ["bigIntEnabled"].forEach(function (k) {
                                    if (Object.getOwnPropertyDescriptor(src, k))
                                        rc[k] = src[k];
                                });
                                rc.version = sqlite3.version;
                                rc.vfsList = sqlite3.capi.sqlite3_js_vfs_list();
                                return rc;
                            },

                            export: function (ev) {
                                const db = getMsgDb(ev);
                                const response = {
                                    byteArray: sqlite3.capi.sqlite3_js_db_export(
                                        db.pointer
                                    ),
                                    filename: db.filename,
                                    mimetype: "application/x-sqlite3",
                                };
                                wState.xfer.push(response.byteArray.buffer);
                                return response;
                            },

                            toss: function (ev) {
                                toss("Testing worker exception");
                            },
                        };

                        globalThis.onmessage = async function (ev) {
                            ev = ev.data;
                            let result,
                                dbId = ev.dbId,
                                evType = ev.type;
                            const arrivalTime = performance.now();
                            try {
                                if (
                                    wMsgHandler.hasOwnProperty(evType) &&
                                    wMsgHandler[evType] instanceof Function
                                ) {
                                    result = await wMsgHandler[evType](ev);
                                } else {
                                    toss(
                                        "Unknown db worker message type:",
                                        ev.type
                                    );
                                }
                            } catch (err) {
                                evType = "error";
                                result = {
                                    operation: ev.type,
                                    message: err.message,
                                    errorClass: err.name,
                                    input: ev,
                                };
                                if (err.stack) {
                                    result.stack =
                                        "string" === typeof err.stack
                                            ? err.stack.split(/\n\s*/)
                                            : err.stack;
                                }
                                if (0)
                                    sqlite3.config.warn(
                                        "Worker is propagating an exception to main thread.",
                                        "Reporting it _here_ for the stack trace:",
                                        err,
                                        result
                                    );
                            }
                            if (!dbId) {
                                dbId = result.dbId || getDefaultDbId();
                            }

                            wState.post(
                                {
                                    type: evType,
                                    dbId: dbId,
                                    messageId: ev.messageId,
                                    workerReceivedTime: arrivalTime,
                                    workerRespondTime: performance.now(),
                                    departureTime: ev.departureTime,

                                    result: result,
                                },
                                wState.xfer
                            );
                        };
                        globalThis.postMessage({
                            type: "sqlite3-api",
                            result: "worker1-ready",
                        });
                    }.bind({ sqlite3 });
                });
    }
