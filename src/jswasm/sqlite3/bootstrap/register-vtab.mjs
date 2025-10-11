export function registerVtab(sqlite3ApiBootstrap) {
    sqlite3ApiBootstrap.initializers.push(function (
                    sqlite3
                ) {
                    if (!sqlite3.wasm.exports.sqlite3_declare_vtab) {
                        return;
                    }
                    const wasm = sqlite3.wasm,
                        capi = sqlite3.capi,
                        toss = sqlite3.util.toss3;
                    const vtab = Object.create(null);
                    sqlite3.vtab = vtab;

                    const sii = capi.sqlite3_index_info;

                    sii.prototype.nthConstraint = function (n, asPtr = false) {
                        if (n < 0 || n >= this.$nConstraint) return false;
                        const ptr =
                            this.$aConstraint +
                            sii.sqlite3_index_constraint.structInfo.sizeof * n;
                        return asPtr ? ptr : new sii.sqlite3_index_constraint(ptr);
                    };

                    sii.prototype.nthConstraintUsage = function (n, asPtr = false) {
                        if (n < 0 || n >= this.$nConstraint) return false;
                        const ptr =
                            this.$aConstraintUsage +
                            sii.sqlite3_index_constraint_usage.structInfo.sizeof *
                                n;
                        return asPtr
                            ? ptr
                            : new sii.sqlite3_index_constraint_usage(ptr);
                    };

                    sii.prototype.nthOrderBy = function (n, asPtr = false) {
                        if (n < 0 || n >= this.$nOrderBy) return false;
                        const ptr =
                            this.$aOrderBy +
                            sii.sqlite3_index_orderby.structInfo.sizeof * n;
                        return asPtr ? ptr : new sii.sqlite3_index_orderby(ptr);
                    };

                    const __xWrapFactory = function (methodName, StructType) {
                        return function (ptr, removeMapping = false) {
                            if (0 === arguments.length) ptr = new StructType();
                            if (ptr instanceof StructType) {
                                this.set(ptr.pointer, ptr);
                                return ptr;
                            } else if (!wasm.isPtr(ptr)) {
                                sqlite3.SQLite3Error.toss(
                                    "Invalid argument to",
                                    methodName + "()"
                                );
                            }
                            let rc = this.get(ptr);
                            if (removeMapping) this.delete(ptr);
                            return rc;
                        }.bind(new Map());
                    };

                    const StructPtrMapper = function (name, StructType) {
                        const __xWrap = __xWrapFactory(name, StructType);

                        return Object.assign(Object.create(null), {
                            StructType,

                            create: (ppOut) => {
                                const rc = __xWrap();
                                wasm.pokePtr(ppOut, rc.pointer);
                                return rc;
                            },

                            get: (pCObj) => __xWrap(pCObj),

                            unget: (pCObj) => __xWrap(pCObj, true),

                            dispose: (pCObj) => {
                                const o = __xWrap(pCObj, true);
                                if (o) o.dispose();
                            },
                        });
                    };

                    vtab.xVtab = StructPtrMapper("xVtab", capi.sqlite3_vtab);

                    vtab.xCursor = StructPtrMapper(
                        "xCursor",
                        capi.sqlite3_vtab_cursor
                    );

                    vtab.xIndexInfo = (pIdxInfo) =>
                        new capi.sqlite3_index_info(pIdxInfo);

                    vtab.xError = function f(methodName, err, defaultRc) {
                        if (f.errorReporter instanceof Function) {
                            try {
                                f.errorReporter(
                                    "sqlite3_module::" +
                                        methodName +
                                        "(): " +
                                        err.message
                                );
                            } catch (e) {}
                        }
                        let rc;
                        if (err instanceof sqlite3.WasmAllocError)
                            rc = capi.SQLITE_NOMEM;
                        else if (arguments.length > 2) rc = defaultRc;
                        else if (err instanceof sqlite3.SQLite3Error)
                            rc = err.resultCode;
                        return rc || capi.SQLITE_ERROR;
                    };
                    vtab.xError.errorReporter = 1
                        ? console.error.bind(console)
                        : false;

                    vtab.xRowid = (ppRowid64, value) =>
                        wasm.poke(ppRowid64, value, "i64");

                    vtab.setupModule = function (opt) {
                        let createdMod = false;
                        const mod =
                            this instanceof capi.sqlite3_module
                                ? this
                                : opt.struct ||
                                  (createdMod = new capi.sqlite3_module());
                        try {
                            const methods =
                                opt.methods || toss("Missing 'methods' object.");
                            for (const e of Object.entries({
                                xConnect: "xCreate",
                                xDisconnect: "xDestroy",
                            })) {
                                const k = e[0],
                                    v = e[1];
                                if (true === methods[k]) methods[k] = methods[v];
                                else if (true === methods[v])
                                    methods[v] = methods[k];
                            }
                            if (opt.catchExceptions) {
                                const fwrap = function (methodName, func) {
                                    if (
                                        ["xConnect", "xCreate"].indexOf(
                                            methodName
                                        ) >= 0
                                    ) {
                                        return function (
                                            pDb,
                                            pAux,
                                            argc,
                                            argv,
                                            ppVtab,
                                            pzErr
                                        ) {
                                            try {
                                                return func(...arguments) || 0;
                                            } catch (e) {
                                                if (
                                                    !(
                                                        e instanceof
                                                        sqlite3.WasmAllocError
                                                    )
                                                ) {
                                                    wasm.dealloc(
                                                        wasm.peekPtr(pzErr)
                                                    );
                                                    wasm.pokePtr(
                                                        pzErr,
                                                        wasm.allocCString(e.message)
                                                    );
                                                }
                                                return vtab.xError(methodName, e);
                                            }
                                        };
                                    } else {
                                        return function (...args) {
                                            try {
                                                return func(...args) || 0;
                                            } catch (e) {
                                                return vtab.xError(methodName, e);
                                            }
                                        };
                                    }
                                };
                                const mnames = [
                                    "xCreate",
                                    "xConnect",
                                    "xBestIndex",
                                    "xDisconnect",
                                    "xDestroy",
                                    "xOpen",
                                    "xClose",
                                    "xFilter",
                                    "xNext",
                                    "xEof",
                                    "xColumn",
                                    "xRowid",
                                    "xUpdate",
                                    "xBegin",
                                    "xSync",
                                    "xCommit",
                                    "xRollback",
                                    "xFindFunction",
                                    "xRename",
                                    "xSavepoint",
                                    "xRelease",
                                    "xRollbackTo",
                                    "xShadowName",
                                ];
                                const remethods = Object.create(null);
                                for (const k of mnames) {
                                    const m = methods[k];
                                    if (!(m instanceof Function)) continue;
                                    else if (
                                        "xConnect" === k &&
                                        methods.xCreate === m
                                    ) {
                                        remethods[k] = methods.xCreate;
                                    } else if (
                                        "xCreate" === k &&
                                        methods.xConnect === m
                                    ) {
                                        remethods[k] = methods.xConnect;
                                    } else {
                                        remethods[k] = fwrap(k, m);
                                    }
                                }
                                mod.installMethods(remethods, false);
                            } else {
                                mod.installMethods(methods, !!opt.applyArgcCheck);
                            }
                            if (0 === mod.$iVersion) {
                                let v;
                                if ("number" === typeof opt.iVersion)
                                    v = opt.iVersion;
                                else if (mod.$xShadowName) v = 3;
                                else if (
                                    mod.$xSavePoint ||
                                    mod.$xRelease ||
                                    mod.$xRollbackTo
                                )
                                    v = 2;
                                else v = 1;
                                mod.$iVersion = v;
                            }
                        } catch (e) {
                            if (createdMod) createdMod.dispose();
                            throw e;
                        }
                        return mod;
                    };

                    capi.sqlite3_module.prototype.setupModule = function (opt) {
                        return vtab.setupModule.call(this, opt);
                    };
                });
    }
