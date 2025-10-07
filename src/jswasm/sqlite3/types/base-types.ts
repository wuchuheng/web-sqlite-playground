/**
 * Base Types for SQLite3 WebAssembly Module
 *
 * This file contains fundamental types shared across the SQLite3 TypeScript definitions
 * to avoid circular import dependencies between sqlite3.d.ts and wasi.ts.
 */

// ============================================================================
// BASIC VALUE TYPES
// ============================================================================

/** SQLite value types - union of all possible SQLite column values */
export type SQLiteValue =
  | string
  | number
  | bigint
  | Uint8Array
  | ArrayBuffer
  | boolean
  | null
  | undefined;

/** WebAssembly pointer types (based on ptrIR and ptrSizeof from source) */
export type WasmPtr = number; // 32-bit pointer
export type WasmPtr64 = bigint; // 64-bit pointer when BigInt enabled

/**
 * SQLite 64-bit integer type in WebAssembly context
 *
 * IMPORTANT: Due to WebAssembly limitations, SQLite3's 64-bit integers are
 * represented as JavaScript numbers, not BigInt. This applies to:
 * - sqlite3_int64 parameters and return values
 * - Row IDs and change counts
 * - Memory sizes and offsets
 *
 * JavaScript numbers can safely represent integers up to 2^53 - 1 (Number.MAX_SAFE_INTEGER).
 * For values beyond this range, precision may be lost.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER
 */
export type SQLiteInt64 = number;

/**
 * Conditional 64-bit integer type based on BigInt enablement
 *
 * When bigIntEnabled is true in the SQLite3ApiConfig, some high-level APIs
 * may return BigInt for better precision. However, the underlying WebAssembly
 * functions always use JavaScript numbers.
 */
export type SQLiteInt64OrBigInt = number | bigint;

/**
 * Memory allocation result type
 *
 * WebAssembly memory allocation functions return a pointer (positive number) on success,
 * or 0 on allocation failure. This type makes it explicit that 0 represents failure,
 * not a valid memory address.
 *
 * @example
 * ```typescript
 * const ptr: AllocPtr = _sqlite3_malloc(1024);
 * if (ptr === 0) {
 *   throw new Error("Memory allocation failed");
 * }
 * // ptr is guaranteed to be > 0 here
 * ```
 */
export type AllocPtr = number; // 0 = allocation failure, >0 = valid pointer

/** SQLite3 object handles (based on actual C pointer types) */
export type SQLite3Db = number; // sqlite3*
export type SQLite3Stmt = number; // sqlite3_stmt*
export type SQLite3Value = number; // sqlite3_value*
export type SQLite3Context = number; // sqlite3_context*
export type SQLite3Backup = number; // sqlite3_backup*

/** Heap view types for WebAssembly memory access */
export type HeapView =
  | Int8Array
  | Int16Array
  | Int32Array
  | Uint8Array
  | Uint16Array
  | Uint32Array
  | Float32Array
  | Float64Array
  | BigInt64Array
  | BigUint64Array;

/**
 * SQLite result codes from the SQLite C API
 *
 * These codes indicate the success or failure of SQLite operations. The most common codes are:
 * - SQLITE_OK (0): Operation successful
 * - SQLITE_ROW (100): Query has another row ready
 * - SQLITE_DONE (101): Query has finished executing
 * - SQLITE_ERROR (1): General SQL error or missing database
 * - SQLITE_BUSY (5): Database file is locked
 * - SQLITE_READONLY (8): Attempt to write a readonly database
 *
 * @example
 * ```typescript
 * const result = sqlite3_step(stmt);
 * if (result === SQLITE_ROW) {
 *   // Process row data
 * } else if (result === SQLITE_DONE) {
 *   // Query completed
 * } else if (result !== SQLITE_OK) {
 *   console.error('SQLite error:', sqlite3_errmsg(db));
 * }
 * ```
 */
export type SQLiteResultCode =
  | 0 /* SQLITE_OK */
  | 1 /* SQLITE_ERROR */
  | 2 /* SQLITE_INTERNAL */
  | 3 /* SQLITE_PERM */
  | 4 /* SQLITE_ABORT */
  | 5 /* SQLITE_BUSY */
  | 6 /* SQLITE_LOCKED */
  | 7 /* SQLITE_NOMEM */
  | 8 /* SQLITE_READONLY */
  | 9 /* SQLITE_INTERRUPT */
  | 10 /* SQLITE_IOERR */
  | 11 /* SQLITE_CORRUPT */
  | 12 /* SQLITE_NOTFOUND */
  | 13 /* SQLITE_FULL */
  | 14 /* SQLITE_CANTOPEN */
  | 15 /* SQLITE_PROTOCOL */
  | 16 /* SQLITE_EMPTY */
  | 17 /* SQLITE_SCHEMA */
  | 18 /* SQLITE_TOOBIG */
  | 19 /* SQLITE_CONSTRAINT */
  | 20 /* SQLITE_MISMATCH */
  | 21 /* SQLITE_MISUSE */
  | 22 /* SQLITE_NOLFS */
  | 23 /* SQLITE_AUTH */
  | 24 /* SQLITE_FORMAT */
  | 25 /* SQLITE_RANGE */
  | 26 /* SQLITE_NOTADB */
  | 27 /* SQLITE_NOTICE */
  | 28 /* SQLITE_WARNING */
  | 100 /* SQLITE_ROW */
  | 101 /* SQLITE_DONE */;

/**
 * SQLite data types for column type information
 *
 * These values are returned by sqlite3_column_type() to indicate the storage class
 * of a value in the database. SQLite uses dynamic typing, so the declared type
 * of a column is only a hint - the actual storage class is determined at runtime.
 *
 * - SQLITE_INTEGER (1): Signed integer values (stored as 1, 2, 3, 4, 6, or 8 bytes)
 * - SQLITE_FLOAT (2): Floating point values (8-byte IEEE floating point)
 * - SQLITE_TEXT (3): Text strings (stored using database encoding)
 * - SQLITE_BLOB (4): Binary Large Objects (stored exactly as provided)
 * - SQLITE_NULL (5): NULL value
 *
 * @example
 * ```typescript
 * const columnType = sqlite3_column_type(stmt, 0);
 * switch (columnType) {
 *   case SQLITE_INTEGER:
 *     const value = sqlite3_column_int(stmt, 0);
 *     break;
 *   case SQLITE_TEXT:
 *     const text = sqlite3_column_text(stmt, 0);
 *     break;
 *   case SQLITE_NULL:
 *     // Handle NULL value
 *     break;
 * }
 * ```
 */
export type SQLiteDataType =
  | 1 /* SQLITE_INTEGER */
  | 2 /* SQLITE_FLOAT */
  | 3 /* SQLITE_TEXT */
  | 4 /* SQLITE_BLOB */
  | 5 /* SQLITE_NULL */;

/**
 * SQLite open flags for database connection configuration
 *
 * These flags control how SQLite databases are opened and accessed. They can be
 * combined using bitwise OR to specify multiple options.
 *
 * - SQLITE_OPEN_READONLY (0x00000001): Open database for read-only access
 * - SQLITE_OPEN_READWRITE (0x00000002): Open database for read/write access
 * - SQLITE_OPEN_CREATE (0x00000004): Create database if it doesn't exist
 * - SQLITE_OPEN_DELETEONCLOSE (0x00000008): Delete file when closed (VFS only)
 * - SQLITE_OPEN_EXCLUSIVE (0x00000010): Reserve file for exclusive access
 * - SQLITE_OPEN_AUTOPROXY (0x00000020): VFS is an automatic proxy for another VFS
 *
 * @example
 * ```typescript
 * // Open database for read/write access, create if doesn't exist
 * const flags = SQLITE_OPEN_READWRITE | SQLITE_OPEN_CREATE;
 * const result = sqlite3_open_v2("mydb.sqlite", flags, null);
 * ```
 */
export type SQLiteOpenFlags =
  | 0x00000001 /* SQLITE_OPEN_READONLY */
  | 0x00000002 /* SQLITE_OPEN_READWRITE */
  | 0x00000004 /* SQLITE_OPEN_CREATE */
  | 0x00000008 /* SQLITE_OPEN_DELETEONCLOSE */
  | 0x00000010 /* SQLITE_OPEN_EXCLUSIVE */
  | 0x00000020 /* SQLITE_OPEN_AUTOPROXY */
  | 0x00000040 /* SQLITE_OPEN_URI */
  | 0x00000080 /* SQLITE_OPEN_MEMORY */
  | 0x00000100 /* SQLITE_OPEN_MAIN_DB */
  | 0x00000200 /* SQLITE_OPEN_TEMP_DB */
  | 0x00000400 /* SQLITE_OPEN_TRANSIENT_DB */
  | 0x00000800 /* SQLITE_OPEN_MAIN_JOURNAL */
  | 0x00001000 /* SQLITE_OPEN_TEMP_JOURNAL */
  | 0x00002000 /* SQLITE_OPEN_SUBJOURNAL */
  | 0x00004000 /* SQLITE_OPEN_SUPER_JOURNAL */
  | 0x00008000 /* SQLITE_OPEN_NOMUTEX */
  | 0x00010000 /* SQLITE_OPEN_FULLMUTEX */
  | 0x00020000 /* SQLITE_OPEN_SHAREDCACHE */
  | 0x00040000 /* SQLITE_OPEN_PRIVATECACHE */
  | 0x00080000 /* SQLITE_OPEN_WAL */;

// ============================================================================
// VFS (Virtual File System) TYPES
// ============================================================================

/**
 * SQLite file handle type
 *
 * Represents an open file in the SQLite VFS system. This is an opaque
 * pointer that is passed to file operation methods.
 */
export type SQLite3File = WasmPtr;

/**
 * VFS access flags for xAccess method
 *
 * These flags are used to specify what type of access to test when
 * calling the xAccess method of a VFS.
 *
 * - SQLITE_ACCESS_EXISTS (0): Test for file existence
 * - SQLITE_ACCESS_READWRITE (1): Test if file/directory is readable and writable
 * - SQLITE_ACCESS_READ (2): Test if file is readable (currently unused)
 */
export type SQLiteAccessFlag =
  | 0 /* SQLITE_ACCESS_EXISTS */
  | 1 /* SQLITE_ACCESS_READWRITE */
  | 2 /* SQLITE_ACCESS_READ */;

/**
 * File lock levels for VFS file locking
 *
 * SQLite uses different lock levels for transaction safety:
 * - SQLITE_LOCK_NONE (0): No lock
 * - SQLITE_LOCK_SHARED (1): Shared lock for reading
 * - SQLITE_LOCK_RESERVED (2): Reserved lock for intended writing
 * - SQLITE_LOCK_PENDING (3): Pending lock for imminent writing
 * - SQLITE_LOCK_EXCLUSIVE (4): Exclusive lock for writing
 */
export type SQLiteLockLevel =
  | 0 /* SQLITE_LOCK_NONE */
  | 1 /* SQLITE_LOCK_SHARED */
  | 2 /* SQLITE_LOCK_RESERVED */
  | 3 /* SQLITE_LOCK_PENDING */
  | 4 /* SQLITE_LOCK_EXCLUSIVE */;

/**
 * Sync flags for the xSync method
 *
 * These flags control how aggressively data is synced to storage:
 * - SQLITE_SYNC_NORMAL (0x02): Normal sync level
 * - SQLITE_SYNC_FULL (0x03): Full sync to ensure data persistence
 * - SQLITE_SYNC_DATAONLY (0x10): Sync data but not metadata
 */
export type SQLiteSyncFlag =
  | 0x02 /* SQLITE_SYNC_NORMAL */
  | 0x03 /* SQLITE_SYNC_FULL */
  | 0x10 /* SQLITE_SYNC_DATAONLY */;
