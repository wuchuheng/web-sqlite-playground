export function registerVfs(sqlite3ApiBootstrap) {
    sqlite3ApiBootstrap.initializers.push(function (
                    sqlite3
                ) {
                    const wasm = sqlite3.wasm,
                        capi = sqlite3.capi,
                        toss = sqlite3.util.toss3;
                    const vfs = Object.create(null);
                    sqlite3.vfs = vfs;

                    capi.sqlite3_vfs.prototype.registerVfs = function (
                        asDefault = false
                    ) {
                        if (!(this instanceof sqlite3.capi.sqlite3_vfs)) {
                            toss("Expecting a sqlite3_vfs-type argument.");
                        }
                        const rc = capi.sqlite3_vfs_register(
                            this,
                            asDefault ? 1 : 0
                        );
                        if (rc) {
                            toss(
                                "sqlite3_vfs_register(",
                                this,
                                ") failed with rc",
                                rc
                            );
                        }
                        if (this.pointer !== capi.sqlite3_vfs_find(this.$zName)) {
                            toss(
                                "BUG: sqlite3_vfs_find(vfs.$zName) failed for just-installed VFS",
                                this
                            );
                        }
                        return this;
                    };

                    vfs.installVfs = function (opt) {
                        let count = 0;
                        const propList = ["io", "vfs"];
                        for (const key of propList) {
                            const o = opt[key];
                            if (o) {
                                ++count;
                                o.struct.installMethods(
                                    o.methods,
                                    !!o.applyArgcCheck
                                );
                                if ("vfs" === key) {
                                    if (
                                        !o.struct.$zName &&
                                        "string" === typeof o.name
                                    ) {
                                        o.struct.addOnDispose(
                                            (o.struct.$zName = wasm.allocCString(
                                                o.name
                                            ))
                                        );
                                    }
                                    o.struct.registerVfs(!!o.asDefault);
                                }
                            }
                        }
                        if (!count)
                            toss(
                                "Misuse: installVfs() options object requires at least",
                                "one of:",
                                propList
                            );
                        return this;
                    };
                });
    }
