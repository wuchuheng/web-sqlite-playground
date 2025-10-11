export function registerVersionInfo(sqlite3ApiBootstrap) {
    sqlite3ApiBootstrap.initializers.push(function (
                    sqlite3
                ) {
                    sqlite3.version = {
                        libVersion: "3.50.4",
                        libVersionNumber: 3050004,
                        sourceId:
                            "2025-07-30 19:33:53 4d8adfb30e03f9cf27f800a2c1ba3c48fb4ca1b08b0f5ed59a4d5ecbf45e20a3",
                        downloadVersion: 3500400,
                    };
                });
    }
