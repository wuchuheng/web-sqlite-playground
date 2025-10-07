import type {
  SQLiteOpenFlags,
  SQLiteResultCode,
  SQLite3Stmt,
  SQLiteDataType,
  SQLite3Value,
  SQLite3Db,
  WasmPtr,
  AllocPtr,
  SQLite3File,
  SQLiteAccessFlag,
  SQLiteLockLevel,
  SQLiteSyncFlag,
  SQLiteInt64,
  SQLiteValue,
} from "./base-types";

// Forward declarations for types that will be defined in the main sqlite3.d.ts
export interface Statement {
  // This will be properly defined in sqlite3.d.ts
  finalize(): number;
  reset(): Statement;
  step(): boolean;
  bind(
    params: Record<string, SQLiteValue> | SQLiteValue[] | SQLiteValue
  ): Statement;
  get(
    column?: number | string | string[] | number[]
  ): SQLiteValue | SQLiteValue[];
  // Add minimal interface needed for wasi.ts
}

export interface Database {
  // This will be properly defined in sqlite3.d.ts
  isOpen(): boolean;
  close(): void;
  // Add minimal interface needed for wasi.ts
}

/**
 * SQLite Virtual File System (VFS) Interface
 *
 * The VFS interface provides an abstraction layer for file system operations.
 * It allows SQLite to work with different storage backends including
 * traditional file systems, in-memory storage, and custom implementations.
 *
 * This interface mirrors the sqlite3_vfs structure from the SQLite C API,
 * adapted for WebAssembly usage with pointer-based parameters.
 *
 * @see https://www.sqlite.org/c3ref/vfs.html
 */
export interface VFSInterface {
  /**
   * Version number of this VFS implementation
   * Should be 1, 2, or 3 depending on features supported
   */
  iVersion: number;

  /**
   * Size of the subclassed sqlite3_file structure
   * SQLite will allocate this much memory for file objects
   */
  szOsFile: number;

  /**
   * Maximum pathname length supported by this VFS
   * SQLite will allocate mxPathname+1 bytes for path buffers
   */
  mxPathname: number;

  /**
   * Next VFS in the linked list (managed by SQLite)
   * Set to null for most implementations
   */
  pNext: WasmPtr | null;

  /**
   * Name of this VFS implementation
   * Must be a unique string identifier
   */
  zName: string;

  /**
   * Application data pointer
   * Available for VFS implementation use
   */
  pAppData: WasmPtr | null;

  // ===== CORE VFS METHODS =====

  /**
   * Open a file
   *
   * @param zName - Pointer to filename in UTF-8 (null for temporary file)
   * @param pFile - Pointer to sqlite3_file structure to initialize
   * @param flags - Combination of SQLITE_OPEN_* flags
   * @param pOutFlags - Pointer to receive actual flags used
   * @returns SQLite result code
   */
  xOpen: (
    zName: WasmPtr | null,
    pFile: SQLite3File,
    flags: SQLiteOpenFlags,
    pOutFlags: WasmPtr
  ) => SQLiteResultCode;

  /**
   * Delete a file
   *
   * @param zName - Pointer to filename in UTF-8
   * @param syncDir - If true, sync directory changes to disk
   * @returns SQLite result code
   */
  xDelete: (zName: WasmPtr, syncDir: number) => SQLiteResultCode;

  /**
   * Check file access permissions
   *
   * @param zName - Pointer to filename in UTF-8
   * @param flags - SQLITE_ACCESS_* flag specifying test type
   * @param pResOut - Pointer to receive result (0 or non-zero)
   * @returns SQLite result code
   */
  xAccess: (
    zName: WasmPtr,
    flags: SQLiteAccessFlag,
    pResOut: WasmPtr
  ) => SQLiteResultCode;

  /**
   * Convert relative path to full pathname
   *
   * @param zName - Pointer to relative path in UTF-8
   * @param nOut - Size of output buffer
   * @param zOut - Pointer to output buffer for full path
   * @returns SQLite result code
   */
  xFullPathname: (
    zName: WasmPtr,
    nOut: number,
    zOut: WasmPtr
  ) => SQLiteResultCode;

  // ===== FILE I/O METHODS =====

  /**
   * Close a file
   *
   * @param pFile - File handle from xOpen
   * @returns SQLite result code
   */
  xClose: (pFile: SQLite3File) => SQLiteResultCode;

  /**
   * Read data from file
   *
   * @param pFile - File handle
   * @param pBuf - Pointer to buffer for data
   * @param iAmt - Number of bytes to read
   * @param iOfst - Offset in file to start reading
   * @returns SQLite result code
   */
  xRead: (
    pFile: SQLite3File,
    pBuf: WasmPtr,
    iAmt: number,
    iOfst: SQLiteInt64
  ) => SQLiteResultCode;

  /**
   * Write data to file
   *
   * @param pFile - File handle
   * @param pBuf - Pointer to data to write
   * @param iAmt - Number of bytes to write
   * @param iOfst - Offset in file to start writing
   * @returns SQLite result code
   */
  xWrite: (
    pFile: SQLite3File,
    pBuf: WasmPtr,
    iAmt: number,
    iOfst: SQLiteInt64
  ) => SQLiteResultCode;

  /**
   * Truncate file to specified size
   *
   * @param pFile - File handle
   * @param size - New file size in bytes
   * @returns SQLite result code
   */
  xTruncate: (pFile: SQLite3File, size: SQLiteInt64) => SQLiteResultCode;

  /**
   * Sync file data to storage
   *
   * @param pFile - File handle
   * @param flags - SQLITE_SYNC_* flags controlling sync behavior
   * @returns SQLite result code
   */
  xSync: (pFile: SQLite3File, flags: SQLiteSyncFlag) => SQLiteResultCode;

  /**
   * Get current file size
   *
   * @param pFile - File handle
   * @param pSize - Pointer to receive file size
   * @returns SQLite result code
   */
  xFileSize: (pFile: SQLite3File, pSize: WasmPtr) => SQLiteResultCode;

  // ===== FILE LOCKING METHODS =====

  /**
   * Acquire a lock on the file
   *
   * @param pFile - File handle
   * @param eLock - Lock level to acquire
   * @returns SQLite result code
   */
  xLock: (pFile: SQLite3File, eLock: SQLiteLockLevel) => SQLiteResultCode;

  /**
   * Release a lock on the file
   *
   * @param pFile - File handle
   * @param eLock - Lock level to release to
   * @returns SQLite result code
   */
  xUnlock: (pFile: SQLite3File, eLock: SQLiteLockLevel) => SQLiteResultCode;

  /**
   * Check if another process holds a reserved lock
   *
   * @param pFile - File handle
   * @param pResOut - Pointer to receive result (0 or non-zero)
   * @returns SQLite result code
   */
  xCheckReservedLock: (
    pFile: SQLite3File,
    pResOut: WasmPtr
  ) => SQLiteResultCode;

  // ===== ADVANCED METHODS =====

  /**
   * File control operation for custom commands
   *
   * @param pFile - File handle
   * @param op - Operation code
   * @param pArg - Operation-specific argument
   * @returns SQLite result code
   */
  xFileControl: (
    pFile: SQLite3File,
    op: number,
    pArg: WasmPtr
  ) => SQLiteResultCode;

  /**
   * Get the sector size for atomic writes
   *
   * @param pFile - File handle
   * @returns Sector size in bytes
   */
  xSectorSize: (pFile: SQLite3File) => number;

  /**
   * Get device characteristics bitmask
   *
   * @param pFile - File handle
   * @returns Bitmask of SQLITE_IOCAP_* flags
   */
  xDeviceCharacteristics: (pFile: SQLite3File) => number;
}

export interface WasmMemoryInterface {
  // This will be properly defined in sqlite3.d.ts
  ptrSizeof: number;
  ptrIR: string;
  // Add minimal interface needed for wasi.ts
}

/**
 * MAIN TYPE DEFINITIONS BELOW
 */

/**
 * SQLite3 WebAssembly Module Interface
 *
 * This interface provides access to the SQLite3 C API through WebAssembly.
 * It includes memory management, database operations, and low-level SQLite functions.
 * Most users should prefer the higher-level Database and Statement interfaces.
 *
 * The module provides direct access to SQLite3 C functions with '_sqlite3_' prefix.
 * All functions return SQLite result codes and require manual memory management.
 *
 * @example
 * ```typescript
 * // Low-level usage (not recommended for most users)
 * const module = await sqlite3InitModule();
 *
 * const dbPtr = module._malloc(8); // Allocate space for database pointer
 * const result = module._sqlite3_open(":memory:", dbPtr);
 *
 * if (result === SQLITE_OK) {
 *   // Database opened successfully
 *   const db = module.getValue(dbPtr, "*");
 *   // ... use database
 *   module._sqlite3_close_v2(db);
 * }
 *
 * module._free(dbPtr);
 * ```
 */
export declare interface SQLite3Module {
  // WebAssembly Memory Management
  // ====================================

  /**
   * Signed 8-bit integer heap view for WebAssembly memory access
   */
  HEAP8: Int8Array;

  /**
   * Unsigned 8-bit integer heap view for WebAssembly memory access
   */
  HEAPU8: Uint8Array;

  /**
   * Signed 16-bit integer heap view for WebAssembly memory access
   */
  HEAP16: Int16Array;

  /**
   * Unsigned 16-bit integer heap view for WebAssembly memory access
   */
  HEAPU16: Uint16Array;

  /**
   * Signed 32-bit integer heap view for WebAssembly memory access
   */
  HEAP32: Int32Array;

  /**
   * Unsigned 32-bit integer heap view for WebAssembly memory access
   */
  HEAPU32: Uint32Array;

  /**
   * 32-bit floating point heap view for WebAssembly memory access
   */
  HEAPF32: Float32Array;

  /**
   * 64-bit floating point heap view for WebAssembly memory access
   */
  HEAPF64: Float64Array;

  /**
   * Signed 64-bit integer heap view for WebAssembly memory access
   */
  HEAP64: BigInt64Array;

  /**
   * Unsigned 64-bit integer heap view for WebAssembly memory access
   */
  HEAPU64: BigUint64Array;

  /**
   * WebAssembly memory buffer instance
   */
  wasmMemory: WebAssembly.Memory;

  // Core SQLite3 Database Functions
  // ====================================

  /**
   * Get the SQLite library version string
   *
   * @returns Pointer to UTF-8 encoded version string (e.g., "3.45.0")
   */
  _sqlite3_libversion: () => WasmPtr;

  /**
   * Get the SQLite library version number
   *
   * Returns the version as X*1000000 + Y*1000 + Z where X.Y.Z is the version number.
   *
   * @returns Version number (e.g., 3045000 for version 3.45.0)
   */
  _sqlite3_libversion_number: () => number;

  /**
   * Open a SQLite database connection
   *
   * @param filename - Pointer to UTF-8 encoded database filename
   * @param ppDb - Pointer to store the database connection pointer
   * @returns SQLite result code (SQLITE_OK on success)
   *
   * @example
   * ```typescript
   * const filenamePtr = module.stringToNewUTF8(":memory:");
   * const dbPtr = module._malloc(8);
   * const result = module._sqlite3_open(filenamePtr, dbPtr);
   * ```
   */
  _sqlite3_open: (filename: WasmPtr, ppDb: WasmPtr) => SQLiteResultCode;

  /**
   * Open a SQLite database connection with UTF-16 filename
   *
   * @param filename - Pointer to UTF-16 encoded database filename
   * @param ppDb - Pointer to store the database connection pointer
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_open16: (filename: WasmPtr, ppDb: WasmPtr) => SQLiteResultCode;

  /**
   * Open a SQLite database connection with advanced options
   *
   * @param filename - Pointer to UTF-8 encoded database filename
   * @param ppDb - Pointer to store the database connection pointer
   * @param flags - Bitwise OR of SQLite open flags
   * @param zVfs - Pointer to VFS name (null for default)
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_open_v2: (
    filename: WasmPtr,
    ppDb: WasmPtr,
    flags: SQLiteOpenFlags,
    zVfs: WasmPtr
  ) => SQLiteResultCode;

  /**
   * Close a SQLite database connection
   *
   * @param db - Database connection pointer
   * @returns SQLite result code (SQLITE_OK on success, SQLITE_BUSY if unfinalized statements exist)
   */
  _sqlite3_close: (db: SQLite3Db) => SQLiteResultCode;

  /**
   * Close a SQLite database connection (v2)
   *
   * This function closes the database and finalizes any prepared statements.
   * Use _sqlite3_close_v2 instead of _sqlite3_close for better resource cleanup.
   * Always returns SQLITE_OK, marks connection as 'zombie' if unfinalized resources exist.
   *
   * @param db - Database connection pointer
   * @returns SQLite result code (always SQLITE_OK)
   */
  _sqlite3_close_v2: (db: SQLite3Db) => SQLiteResultCode;

  /**
   * Execute one or more SQL statements
   *
   * This is a convenience function that wraps prepare, step, and finalize.
   * For complex queries, use the prepare/step/finalize pattern directly.
   *
   * @param db - Database connection pointer
   * @param sql - Pointer to UTF-8 encoded SQL statement(s)
   * @param callback - Optional callback for query results (null for none)
   * @param callbackArg - Argument passed to callback function
   * @param errmsg - Pointer to store error message pointer
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_exec: (
    db: SQLite3Db,
    sql: WasmPtr,
    callback: WasmPtr,
    callbackArg: WasmPtr,
    errmsg: WasmPtr
  ) => SQLiteResultCode;

  /**
   * Prepare a SQL statement for execution (legacy)
   *
   * @param db - Database connection pointer
   * @param sql - Pointer to UTF-8 encoded SQL statement
   * @param nByte - Length of SQL in bytes, or -1 for null-terminated
   * @param ppStmt - Pointer to store the prepared statement pointer
   * @param pzTail - Pointer to store pointer to unused SQL text
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_prepare: (
    db: SQLite3Db,
    sql: WasmPtr,
    nByte: number,
    ppStmt: WasmPtr,
    pzTail: WasmPtr
  ) => SQLiteResultCode;

  /**
   * Prepare a SQL statement for execution (preferred)
   *
   * @param db - Database connection pointer
   * @param sql - Pointer to UTF-8 encoded SQL statement
   * @param nByte - Length of SQL in bytes, or -1 for null-terminated
   * @param ppStmt - Pointer to store the prepared statement pointer
   * @param pzTail - Pointer to store pointer to unused SQL text
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_prepare_v2: (
    db: SQLite3Db,
    sql: WasmPtr,
    nByte: number,
    ppStmt: WasmPtr,
    pzTail: WasmPtr
  ) => SQLiteResultCode;

  /**
   * Prepare a SQL statement with additional flags
   *
   * Same as _sqlite3_prepare_v2 but with additional preparation flags.
   *
   * @param db - Database connection pointer
   * @param sql - Pointer to UTF-8 encoded SQL statement
   * @param nByte - Length of SQL in bytes, or -1 for null-terminated
   * @param prepFlags - Preparation flags (SQLITE_PREPARE_* constants)
   * @param ppStmt - Pointer to store the prepared statement pointer
   * @param pzTail - Pointer to store pointer to unused SQL text
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_prepare_v3: (
    db: SQLite3Db,
    sql: WasmPtr,
    nByte: number,
    prepFlags: number,
    ppStmt: WasmPtr,
    pzTail: WasmPtr
  ) => SQLiteResultCode;

  /**
   * Prepare a SQL statement with UTF-16 encoding (legacy)
   *
   * @param db - Database connection pointer
   * @param sql - Pointer to UTF-16 encoded SQL statement
   * @param nByte - Length of SQL in bytes, or -1 for null-terminated
   * @param ppStmt - Pointer to store the prepared statement pointer
   * @param pzTail - Pointer to store pointer to unused SQL text
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_prepare16: (
    db: SQLite3Db,
    sql: WasmPtr,
    nByte: number,
    ppStmt: WasmPtr,
    pzTail: WasmPtr
  ) => SQLiteResultCode;

  /**
   * Prepare a SQL statement with UTF-16 encoding (preferred)
   *
   * @param db - Database connection pointer
   * @param sql - Pointer to UTF-16 encoded SQL statement
   * @param nByte - Length of SQL in bytes, or -1 for null-terminated
   * @param ppStmt - Pointer to store the prepared statement pointer
   * @param pzTail - Pointer to store pointer to unused SQL text
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_prepare16_v2: (
    db: SQLite3Db,
    sql: WasmPtr,
    nByte: number,
    ppStmt: WasmPtr,
    pzTail: WasmPtr
  ) => SQLiteResultCode;

  /**
   * Prepare a SQL statement with UTF-16 encoding and additional flags
   *
   * @param db - Database connection pointer
   * @param sql - Pointer to UTF-16 encoded SQL statement
   * @param nByte - Length of SQL in bytes, or -1 for null-terminated
   * @param prepFlags - Preparation flags (SQLITE_PREPARE_* constants)
   * @param ppStmt - Pointer to store the prepared statement pointer
   * @param pzTail - Pointer to store pointer to unused SQL text
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_prepare16_v3: (
    db: SQLite3Db,
    sql: WasmPtr,
    nByte: number,
    prepFlags: number,
    ppStmt: WasmPtr,
    pzTail: WasmPtr
  ) => SQLiteResultCode;

  /**
   * Execute a single step of a prepared statement
   *
   * For SELECT queries, returns SQLITE_ROW while there are more rows.
   * For other queries, returns SQLITE_DONE when execution completes.
   *
   * @param stmt - Prepared statement pointer
   * @returns SQLite result code (SQLITE_ROW, SQLITE_DONE, or error code)
   *
   * @example
   * ```typescript
   * while (true) {
   *   const result = module._sqlite3_step(stmt);
   *   if (result === SQLITE_ROW) {
   *     // Process row data
   *   } else if (result === SQLITE_DONE) {
   *     break; // Query completed
   *   } else {
   *     throw new Error('Query failed');
   *   }
   * }
   * ```
   */
  _sqlite3_step: (stmt: SQLite3Stmt) => SQLiteResultCode;

  /**
   * Finalize and delete a prepared statement
   *
   * This function must be called to release resources associated with a prepared
   * statement. After calling finalize, the statement pointer becomes invalid.
   *
   * @param stmt - Prepared statement pointer
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_finalize: (stmt: SQLite3Stmt) => SQLiteResultCode;

  /**
   * Reset a prepared statement back to its initial state
   *
   * Resets the statement so it can be executed again with the same bound parameters.
   * Unlike finalize, the statement remains valid after reset.
   *
   * @param stmt - Prepared statement pointer
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_reset: (stmt: SQLite3Stmt) => SQLiteResultCode;

  // Statement Parameter Binding Operations
  // ======================================

  /**
   * Bind a BLOB value to a prepared statement parameter
   *
   * @param stmt - Prepared statement pointer
   * @param index - Parameter index (1-based)
   * @param value - Pointer to BLOB data
   * @param n - Number of bytes in the BLOB
   * @param destroy - Destructor function pointer (SQLITE_TRANSIENT, SQLITE_STATIC, or custom)
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_bind_blob: (
    stmt: SQLite3Stmt,
    index: number,
    value: WasmPtr,
    n: number,
    destroy: WasmPtr
  ) => SQLiteResultCode;

  /**
   * Bind a floating point value to a prepared statement parameter
   *
   * @param stmt - Prepared statement pointer
   * @param index - Parameter index (1-based)
   * @param value - Double precision floating point value
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_bind_double: (
    stmt: SQLite3Stmt,
    index: number,
    value: number
  ) => SQLiteResultCode;

  /**
   * Bind a 32-bit integer value to a prepared statement parameter
   *
   * @param stmt - Prepared statement pointer
   * @param index - Parameter index (1-based)
   * @param value - 32-bit integer value
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_bind_int: (
    stmt: SQLite3Stmt,
    index: number,
    value: number
  ) => SQLiteResultCode;

  /**
   * Bind a 64-bit integer value to a prepared statement parameter
   *
   * Note: WebAssembly uses JavaScript numbers for 64-bit integers.
   * Values beyond Number.MAX_SAFE_INTEGER may lose precision.
   *
   * @param stmt - Prepared statement pointer
   * @param index - Parameter index (1-based)
   * @param value - 64-bit integer value (as JavaScript number)
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_bind_int64: (
    stmt: SQLite3Stmt,
    index: number,
    value: number
  ) => SQLiteResultCode;

  /**
   * Bind a NULL value to a prepared statement parameter
   *
   * @param stmt - Prepared statement pointer
   * @param index - Parameter index (1-based)
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_bind_null: (stmt: SQLite3Stmt, index: number) => SQLiteResultCode;

  /**
   * Bind a text value to a prepared statement parameter
   *
   * @param stmt - Prepared statement pointer
   * @param index - Parameter index (1-based)
   * @param value - Pointer to UTF-8 encoded text
   * @param n - Number of bytes in text (or -1 for null-terminated)
   * @param destroy - Destructor function pointer (SQLITE_TRANSIENT, SQLITE_STATIC, or custom)
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_bind_text: (
    stmt: SQLite3Stmt,
    index: number,
    value: WasmPtr,
    n: number,
    destroy: WasmPtr
  ) => SQLiteResultCode;

  /**
   * Bind a pointer value to a prepared statement parameter
   *
   * Used for custom pointer types in extensions and advanced use cases.
   *
   * @param stmt - Prepared statement pointer
   * @param index - Parameter index (1-based)
   * @param value - Pointer value to bind
   * @param type - Pointer type identifier
   * @param destroy - Destructor function pointer
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_bind_pointer: (
    stmt: SQLite3Stmt,
    index: number,
    value: WasmPtr,
    type: WasmPtr,
    destroy: WasmPtr
  ) => SQLiteResultCode;

  /**
   * Get the number of parameters in a prepared statement
   *
   * @param stmt - Prepared statement pointer
   * @returns Number of parameters (question marks or named placeholders)
   */
  _sqlite3_bind_parameter_count: (stmt: SQLite3Stmt) => number;

  /**
   * Get the name of a parameter by its index
   *
   * For named parameters (like :name or @name), returns the parameter name.
   * For positional parameters (?), returns 0.
   *
   * @param stmt - Prepared statement pointer
   * @param index - Parameter index (1-based)
   * @returns Pointer to parameter name (>0) or 0 if positional parameter
   */
  _sqlite3_bind_parameter_name: (stmt: SQLite3Stmt, index: number) => WasmPtr;

  /**
   * Get the index of a named parameter
   *
   * @param stmt - Prepared statement pointer
   * @param name - Pointer to parameter name (with or without prefix :, @, or $)
   * @returns Parameter index (1-based) or 0 if not found
   */
  _sqlite3_bind_parameter_index: (stmt: SQLite3Stmt, name: WasmPtr) => number;

  /**
   * Bind a large BLOB value to a prepared statement parameter (64-bit version)
   *
   * @param stmt - Prepared statement pointer
   * @param index - Parameter index (1-based)
   * @param value - Pointer to BLOB data
   * @param n - Number of bytes in the BLOB (64-bit)
   * @param destroy - Destructor function pointer (SQLITE_TRANSIENT, SQLITE_STATIC, or custom)
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_bind_blob64: (
    stmt: SQLite3Stmt,
    index: number,
    value: WasmPtr,
    n: number,
    destroy: WasmPtr
  ) => SQLiteResultCode;

  /**
   * Bind a UTF-16 text value to a prepared statement parameter
   *
   * @param stmt - Prepared statement pointer
   * @param index - Parameter index (1-based)
   * @param value - Pointer to UTF-16 encoded text
   * @param n - Number of bytes in text (or -1 for null-terminated)
   * @param destroy - Destructor function pointer (SQLITE_TRANSIENT, SQLITE_STATIC, or custom)
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_bind_text16: (
    stmt: SQLite3Stmt,
    index: number,
    value: WasmPtr,
    n: number,
    destroy: WasmPtr
  ) => SQLiteResultCode;

  /**
   * Bind a text value with explicit encoding to a prepared statement parameter (64-bit version)
   *
   * @param stmt - Prepared statement pointer
   * @param index - Parameter index (1-based)
   * @param value - Pointer to text data
   * @param n - Number of bytes in text (64-bit, or -1 for null-terminated)
   * @param destroy - Destructor function pointer (SQLITE_TRANSIENT, SQLITE_STATIC, or custom)
   * @param encoding - Text encoding (SQLITE_UTF8, SQLITE_UTF16, etc.)
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_bind_text64: (
    stmt: SQLite3Stmt,
    index: number,
    value: WasmPtr,
    n: number,
    destroy: WasmPtr,
    encoding: number
  ) => SQLiteResultCode;

  /**
   * Bind a sqlite3_value object to a prepared statement parameter
   *
   * @param stmt - Prepared statement pointer
   * @param index - Parameter index (1-based)
   * @param value - Pointer to sqlite3_value object
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_bind_value: (
    stmt: SQLite3Stmt,
    index: number,
    value: WasmPtr
  ) => SQLiteResultCode;

  /**
   * Bind a zero-filled BLOB to a prepared statement parameter
   *
   * @param stmt - Prepared statement pointer
   * @param index - Parameter index (1-based)
   * @param n - Size of the zero-filled BLOB in bytes
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_bind_zeroblob: (
    stmt: SQLite3Stmt,
    index: number,
    n: number
  ) => SQLiteResultCode;

  /**
   * Bind a large zero-filled BLOB to a prepared statement parameter (64-bit version)
   *
   * @param stmt - Prepared statement pointer
   * @param index - Parameter index (1-based)
   * @param n - Size of the zero-filled BLOB in bytes (64-bit)
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_bind_zeroblob64: (
    stmt: SQLite3Stmt,
    index: number,
    n: number
  ) => SQLiteResultCode;

  /**
   * Clear all parameter bindings from a prepared statement
   *
   * This method clears all currently bound parameters, setting them to NULL.
   * Unlike reset(), this only affects parameter bindings, not the statement's
   * execution state.
   *
   * @param stmt - Prepared statement pointer
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_clear_bindings: (stmt: SQLite3Stmt) => SQLiteResultCode;

  // Column Result Access Operations
  // ===============================

  /**
   * Get the number of columns in the result set
   *
   * @param stmt - Prepared statement pointer
   * @returns Number of columns in the result set
   */
  _sqlite3_column_count: (stmt: SQLite3Stmt) => number;

  /**
   * Get the name of a column by index
   *
   * @param stmt - Prepared statement pointer
   * @param index - Column index (0-based)
   * @returns Pointer to column name (const char*)
   */
  _sqlite3_column_name: (stmt: SQLite3Stmt, index: number) => WasmPtr;

  /**
   * Get the SQLite data type of a column
   *
   * @param stmt - Prepared statement pointer
   * @param index - Column index (0-based)
   * @returns SQLite data type constant (SQLITE_INTEGER, SQLITE_TEXT, etc.)
   */
  _sqlite3_column_type: (stmt: SQLite3Stmt, index: number) => SQLiteDataType;

  /**
   * Get BLOB data from a column
   *
   * @param stmt - Prepared statement pointer
   * @param index - Column index (0-based)
   * @returns Pointer to BLOB data (const void*)
   */
  _sqlite3_column_blob: (stmt: SQLite3Stmt, index: number) => WasmPtr;

  /**
   * Get the number of bytes in a column value
   *
   * For BLOB and TEXT columns, returns the size in bytes.
   * For other types, the return value has different meanings.
   *
   * @param stmt - Prepared statement pointer
   * @param index - Column index (0-based)
   * @returns Number of bytes in the column value
   */
  _sqlite3_column_bytes: (stmt: SQLite3Stmt, index: number) => number;

  /**
   * Get a floating point value from a column
   *
   * @param stmt - Prepared statement pointer
   * @param index - Column index (0-based)
   * @returns Column value as floating point number
   */
  _sqlite3_column_double: (stmt: SQLite3Stmt, index: number) => number;

  /**
   * Get a 32-bit integer value from a column
   *
   * @param stmt - Prepared statement pointer
   * @param index - Column index (0-based)
   * @returns Column value as 32-bit integer
   */
  _sqlite3_column_int: (stmt: SQLite3Stmt, index: number) => number;

  /**
   * Get a 64-bit integer value from a column
   *
   * Note: WebAssembly returns 64-bit integers as JavaScript numbers.
   * Values beyond Number.MAX_SAFE_INTEGER may lose precision.
   *
   * @param stmt - Prepared statement pointer
   * @param index - Column index (0-based)
   * @returns Column value as 64-bit integer (as JavaScript number)
   */
  _sqlite3_column_int64: (stmt: SQLite3Stmt, index: number) => number;

  /**
   * Get text data from a column
   *
   * @param stmt - Prepared statement pointer
   * @param index - Column index (0-based)
   * @returns Pointer to UTF-8 text (const unsigned char*)
   */
  _sqlite3_column_text: (stmt: SQLite3Stmt, index: number) => WasmPtr;

  /**
   * Get the sqlite3_value pointer for a column
   *
   * Used in custom functions and advanced use cases where direct
   * access to the underlying SQLite value object is needed.
   *
   * @param stmt - Prepared statement pointer
   * @param index - Column index (0-based)
   * @returns Pointer to sqlite3_value object
   */
  _sqlite3_column_value: (stmt: SQLite3Stmt, index: number) => SQLite3Value;

  /**
   * Get the declared data type of a column
   *
   * Returns the data type as declared in the CREATE TABLE statement,
   * or the actual data type if no type was declared.
   *
   * @param stmt - Prepared statement pointer
   * @param index - Column index (0-based)
   * @returns Pointer to declared type name (const char*)
   */
  _sqlite3_column_decltype: (stmt: SQLite3Stmt, index: number) => WasmPtr;

  /**
   * Get the number of bytes in a column value (UTF-16 version)
   *
   * For BLOB and TEXT columns, returns the size in bytes using UTF-16 encoding.
   * For other types, the return value has different meanings.
   *
   * @param stmt - Prepared statement pointer
   * @param index - Column index (0-based)
   * @returns Number of bytes in the column value (UTF-16)
   */
  _sqlite3_column_bytes16: (stmt: SQLite3Stmt, index: number) => number;

  /**
   * Get UTF-16 text data from a column
   *
   * @param stmt - Prepared statement pointer
   * @param index - Column index (0-based)
   * @returns Pointer to UTF-16 text (const void*)
   */
  _sqlite3_column_text16: (stmt: SQLite3Stmt, index: number) => WasmPtr;

  /**
   * Get the name of a column by index (UTF-16 version)
   *
   * @param stmt - Prepared statement pointer
   * @param index - Column index (0-based)
   * @returns Pointer to column name in UTF-16 (const void*)
   */
  _sqlite3_column_name16: (stmt: SQLite3Stmt, index: number) => WasmPtr;

  /**
   * Get the declared data type of a column (UTF-16 version)
   *
   * Returns the data type as declared in the CREATE TABLE statement,
   * or the actual data type if no type was declared.
   *
   * @param stmt - Prepared statement pointer
   * @param index - Column index (0-based)
   * @returns Pointer to declared type name in UTF-16 (const void*)
   */
  _sqlite3_column_decltype16: (stmt: SQLite3Stmt, index: number) => WasmPtr;

  /**
   * Get the name of the database for a column
   *
   * @param stmt - Prepared statement pointer
   * @param index - Column index (0-based)
   * @returns Pointer to database name (const char*)
   */
  _sqlite3_column_database_name: (stmt: SQLite3Stmt, index: number) => WasmPtr;

  /**
   * Get the name of the database for a column (UTF-16 version)
   *
   * @param stmt - Prepared statement pointer
   * @param index - Column index (0-based)
   * @returns Pointer to database name in UTF-16 (const void*)
   */
  _sqlite3_column_database_name16: (
    stmt: SQLite3Stmt,
    index: number
  ) => WasmPtr;

  /**
   * Get the name of the table for a column
   *
   * @param stmt - Prepared statement pointer
   * @param index - Column index (0-based)
   * @returns Pointer to table name (const char*)
   */
  _sqlite3_column_table_name: (stmt: SQLite3Stmt, index: number) => WasmPtr;

  /**
   * Get the name of the table for a column (UTF-16 version)
   *
   * @param stmt - Prepared statement pointer
   * @param index - Column index (0-based)
   * @returns Pointer to table name in UTF-16 (const void*)
   */
  _sqlite3_column_table_name16: (stmt: SQLite3Stmt, index: number) => WasmPtr;

  /**
   * Get the origin name of a column
   *
   * @param stmt - Prepared statement pointer
   * @param index - Column index (0-based)
   * @returns Pointer to origin column name (const char*)
   */
  _sqlite3_column_origin_name: (stmt: SQLite3Stmt, index: number) => WasmPtr;

  /**
   * Get the origin name of a column (UTF-16 version)
   *
   * @param stmt - Prepared statement pointer
   * @param index - Column index (0-based)
   * @returns Pointer to origin column name in UTF-16 (const void*)
   */
  _sqlite3_column_origin_name16: (stmt: SQLite3Stmt, index: number) => WasmPtr;

  /**
   * Get the number of columns in the current row
   *
   * Similar to _sqlite3_column_count but may differ in certain edge cases.
   *
   * @param stmt - Prepared statement pointer
   * @returns Number of columns in the current result row
   */
  _sqlite3_data_count: (stmt: SQLite3Stmt) => number;

  // Custom Function Value Operations
  // ===============================

  /**
   * Get BLOB data from a sqlite3_value
   *
   * Used in custom SQL functions to extract BLOB values from arguments.
   *
   * @param value - sqlite3_value pointer
   * @returns Pointer to BLOB data
   */
  _sqlite3_value_blob: (value: number) => number;

  /**
   * Get the number of bytes in a sqlite3_value
   *
   * For BLOB and TEXT values, returns the size in bytes.
   *
   * @param value - sqlite3_value pointer
   * @returns Number of bytes in the value
   */
  _sqlite3_value_bytes: (value: number) => number;

  /**
   * Get a floating point value from a sqlite3_value
   *
   * @param value - sqlite3_value pointer
   * @returns Value as floating point number
   */
  _sqlite3_value_double: (value: number) => number;

  /**
   * Get a 32-bit integer value from a sqlite3_value
   *
   * @param value - sqlite3_value pointer
   * @returns Value as 32-bit integer
   */
  _sqlite3_value_int: (value: number) => number;

  /**
   * Get a 64-bit integer value from a sqlite3_value
   *
   * @param value - sqlite3_value pointer
   * @returns Value as 64-bit integer (as JavaScript number)
   */
  _sqlite3_value_int64: (value: number) => number;

  /**
   * Get text data from a sqlite3_value
   *
   * @param value - sqlite3_value pointer
   * @returns Pointer to UTF-8 text
   */
  _sqlite3_value_text: (value: number) => number;

  /**
   * Get the number of bytes in a sqlite3_value (UTF-16 version)
   *
   * For BLOB and TEXT values, returns the size in bytes using UTF-16 encoding.
   *
   * @param value - sqlite3_value pointer
   * @returns Number of bytes in the value (UTF-16)
   */
  _sqlite3_value_bytes16: (value: number) => number;

  /**
   * Get UTF-16 text data from a sqlite3_value
   *
   * @param value - sqlite3_value pointer
   * @returns Pointer to UTF-16 text
   */
  _sqlite3_value_text16: (value: number) => number;

  /**
   * Get UTF-16 Little Endian text data from a sqlite3_value
   *
   * @param value - sqlite3_value pointer
   * @returns Pointer to UTF-16LE text
   */
  _sqlite3_value_text16le: (value: number) => number;

  /**
   * Get UTF-16 Big Endian text data from a sqlite3_value
   *
   * @param value - sqlite3_value pointer
   * @returns Pointer to UTF-16BE text
   */
  _sqlite3_value_text16be: (value: number) => number;

  /**
   * Get the encoding of a sqlite3_value
   *
   * @param value - sqlite3_value pointer
   * @returns Encoding constant (SQLITE_UTF8, SQLITE_UTF16, etc.)
   */
  _sqlite3_value_encoding: (value: number) => number;

  /**
   * Get the data type of a sqlite3_value
   *
   * @param value - sqlite3_value pointer
   * @returns SQLite data type constant
   */
  _sqlite3_value_type: (value: number) => number;

  /**
   * Get the numeric data type of a sqlite3_value
   *
   * Similar to _sqlite3_value_type but with different handling for
   * numeric conversions and affinity.
   *
   * @param value - sqlite3_value pointer
   * @returns Numeric data type constant
   */
  _sqlite3_value_numeric_type: (value: number) => number;

  /**
   * Get the subtype of a sqlite3_value
   *
   * Used for custom subtypes in extensions.
   *
   * @param value - sqlite3_value pointer
   * @returns Subtype value
   */
  _sqlite3_value_subtype: (value: number) => number;

  /**
   * Get a pointer value from a sqlite3_value
   *
   * Used for custom pointer types in extensions.
   *
   * @param value - sqlite3_value pointer
   * @param type - Pointer type identifier
   * @returns Pointer value
   */
  _sqlite3_value_pointer: (value: number, type: number) => number;

  /**
   * Check if a value is unchanged from the previous row in an UPDATE
   *
   * Used in custom functions to detect unchanged columns during updates.
   *
   * @param value - sqlite3_value pointer
   * @returns Non-zero if unchanged, zero if changed
   */
  _sqlite3_value_nochange: (value: number) => number;

  /**
   * Check if a value came from a bound parameter
   *
   * @param value - sqlite3_value pointer
   * @returns Non-zero if from bound parameter, zero otherwise
   */
  _sqlite3_value_frombind: (value: number) => number;

  /**
   * Duplicate a sqlite3_value
   *
   * Creates a new copy of a sqlite3_value that must be freed with
   * _sqlite3_value_free when no longer needed.
   *
   * @param value - sqlite3_value pointer to duplicate
   * @returns Pointer to duplicated sqlite3_value
   */
  _sqlite3_value_dup: (value: number) => number;

  /**
   * Free a duplicated sqlite3_value
   *
   * Must be called on values created with _sqlite3_value_dup.
   *
   * @param value - sqlite3_value pointer to free
   */
  _sqlite3_value_free: (value: number) => void;

  // Custom Function Result Operations
  // ================================

  /**
   * Set a BLOB result in a custom function
   *
   * @param context - Function context pointer
   * @param value - Pointer to BLOB data
   * @param n - Number of bytes in BLOB
   * @param destroy - Destructor function pointer
   */
  _sqlite3_result_blob: (
    context: number,
    value: number,
    n: number,
    destroy: number
  ) => void;

  /**
   * Set a floating point result in a custom function
   *
   * @param context - Function context pointer
   * @param value - Double precision floating point value
   */
  _sqlite3_result_double: (context: number, value: number) => void;

  /**
   * Set an error result in a custom function
   *
   * @param context - Function context pointer
   * @param value - Pointer to error message
   * @param n - Length of error message in bytes
   */
  _sqlite3_result_error: (context: number, value: number, n: number) => void;

  /**
   * Set a "string or BLOB too big" error in a custom function
   *
   * @param context - Function context pointer
   */
  _sqlite3_result_error_toobig: (context: number) => void;

  /**
   * Set an "out of memory" error in a custom function
   *
   * @param context - Function context pointer
   */
  _sqlite3_result_error_nomem: (context: number) => void;

  /**
   * Set an error result by error code in a custom function
   *
   * @param context - Function context pointer
   * @param code - SQLite error code
   */
  _sqlite3_result_error_code: (context: number, code: number) => void;

  /**
   * Set a 32-bit integer result in a custom function
   *
   * @param context - Function context pointer
   * @param value - 32-bit integer value
   */
  _sqlite3_result_int: (context: number, value: number) => void;

  /**
   * Set a 64-bit integer result in a custom function
   *
   * @param context - Function context pointer
   * @param value - 64-bit integer value (as JavaScript number)
   */
  _sqlite3_result_int64: (context: number, value: number) => void;

  /**
   * Set a NULL result in a custom function
   *
   * @param context - Function context pointer
   */
  _sqlite3_result_null: (context: number) => void;

  /**
   * Set a text result in a custom function
   *
   * @param context - Function context pointer
   * @param value - Pointer to UTF-8 text
   * @param n - Length of text in bytes (or -1 for null-terminated)
   * @param destroy - Destructor function pointer
   */
  _sqlite3_result_text: (
    context: number,
    value: number,
    n: number,
    destroy: number
  ) => void;

  /**
   * Set a large BLOB result in a custom function (64-bit version)
   *
   * @param context - Function context pointer
   * @param value - Pointer to BLOB data
   * @param n - Number of bytes in BLOB (64-bit)
   * @param destroy - Destructor function pointer
   */
  _sqlite3_result_blob64: (
    context: number,
    value: number,
    n: number,
    destroy: number
  ) => void;

  /**
   * Set a UTF-16 text result in a custom function
   *
   * @param context - Function context pointer
   * @param value - Pointer to UTF-16 text
   * @param n - Length of text in bytes (or -1 for null-terminated)
   * @param destroy - Destructor function pointer
   */
  _sqlite3_result_text16: (
    context: number,
    value: number,
    n: number,
    destroy: number
  ) => void;

  /**
   * Set a UTF-16 Little Endian text result in a custom function
   *
   * @param context - Function context pointer
   * @param value - Pointer to UTF-16LE text
   * @param n - Length of text in bytes (or -1 for null-terminated)
   * @param destroy - Destructor function pointer
   */
  _sqlite3_result_text16le: (
    context: number,
    value: number,
    n: number,
    destroy: number
  ) => void;

  /**
   * Set a UTF-16 Big Endian text result in a custom function
   *
   * @param context - Function context pointer
   * @param value - Pointer to UTF-16BE text
   * @param n - Length of text in bytes (or -1 for null-terminated)
   * @param destroy - Destructor function pointer
   */
  _sqlite3_result_text16be: (
    context: number,
    value: number,
    n: number,
    destroy: number
  ) => void;

  /**
   * Set a text result with explicit encoding in a custom function (64-bit version)
   *
   * @param context - Function context pointer
   * @param value - Pointer to text data
   * @param n - Length of text in bytes (64-bit, or -1 for null-terminated)
   * @param destroy - Destructor function pointer
   * @param encoding - Text encoding (SQLITE_UTF8, SQLITE_UTF16, etc.)
   */
  _sqlite3_result_text64: (
    context: number,
    value: number,
    n: number,
    destroy: number,
    encoding: number
  ) => void;

  /**
   * Set a sqlite3_value result in a custom function
   *
   * @param context - Function context pointer
   * @param value - sqlite3_value pointer to copy
   */
  _sqlite3_result_value: (context: number, value: number) => void;

  /**
   * Set a subtype for the result value in a custom function
   *
   * @param context - Function context pointer
   * @param subtype - Subtype value
   */
  _sqlite3_result_subtype: (context: number, subtype: number) => void;

  /**
   * Set a pointer result in a custom function
   *
   * Used for custom pointer types in extensions.
   *
   * @param context - Function context pointer
   * @param value - Pointer value
   * @param type - Pointer type identifier
   * @param destroy - Destructor function pointer
   */
  _sqlite3_result_pointer: (
    context: number,
    value: number,
    type: number,
    destroy: number
  ) => void;

  /**
   * Set a zero-filled BLOB result in a custom function
   *
   * @param context - Function context pointer
   * @param n - Number of bytes in the BLOB
   */
  _sqlite3_result_zeroblob: (context: number, n: number) => void;

  /**
   * Set a 64-bit zero-filled BLOB result in a custom function
   *
   * @param context - Function context pointer
   * @param n - Number of bytes in the BLOB (as JavaScript number)
   */
  _sqlite3_result_zeroblob64: (context: number, n: number) => void;

  // Database Metadata and Operations
  // ===============================

  /**
   * Get the row ID of the most recent successful INSERT
   *
   * @param db - Database connection pointer
   * @returns Row ID of last inserted row (as JavaScript number)
   */
  _sqlite3_last_insert_rowid: (db: number) => number;

  /**
   * Set the last insert row ID value
   *
   * Used for special cases where you need to manually set this value.
   *
   * @param db - Database connection pointer
   * @param value - Row ID value to set
   */
  _sqlite3_set_last_insert_rowid: (db: number, value: number) => void;

  /**
   * Get the number of rows affected by the most recent SQL statement
   *
   * @param db - Database connection pointer
   * @returns Number of rows modified by last statement
   */
  _sqlite3_changes: (db: number) => number;

  /**
   * Get the 64-bit count of rows affected by the most recent SQL statement
   *
   * @param db - Database connection pointer
   * @returns Number of rows modified by last statement (as JavaScript number)
   */
  _sqlite3_changes64: (db: number) => number;

  /**
   * Get the total number of rows affected since the database connection opened
   *
   * @param db - Database connection pointer
   * @returns Total number of rows modified during this connection
   */
  _sqlite3_total_changes: (db: number) => number;

  /**
   * Get the 64-bit total number of rows affected since connection opened
   *
   * @param db - Database connection pointer
   * @returns Total number of rows modified during this connection (as JavaScript number)
   */
  _sqlite3_total_changes64: (db: number) => number;

  /**
   * Interrupt a long-running database operation
   *
   * Causes pending database operations to abort and return SQLITE_INTERRUPT.
   * This is useful for implementing timeouts or cancellation.
   *
   * @param db - Database connection pointer
   */
  _sqlite3_interrupt: (db: number) => void;

  /**
   * Check if a database operation has been interrupted
   *
   * @param db - Database connection pointer
   * @returns Non-zero if operation was interrupted, zero otherwise
   */
  _sqlite3_is_interrupted: (db: number) => number;

  /**
   * Register a busy handler callback
   *
   * Called when the database is locked and cannot be accessed.
   *
   * @param db - Database connection pointer
   * @param callback - Callback function pointer
   * @param data - User data pointer passed to callback
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_busy_handler: (
    db: SQLite3Db,
    callback: WasmPtr,
    data: WasmPtr
  ) => SQLiteResultCode;

  /**
   * Set a busy timeout
   *
   * Automatically calls sqlite3_sleep() when database is locked.
   *
   * @param db - Database connection pointer
   * @param ms - Timeout in milliseconds
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_busy_timeout: (db: number, ms: number) => number;

  /**
   * Register a progress handler callback
   *
   * Called periodically during long-running SQL operations.
   *
   * @param db - Database connection pointer
   * @param nOps - Number of virtual machine instructions between callbacks
   * @param callback - Callback function pointer
   * @param data - User data pointer passed to callback
   */
  _sqlite3_progress_handler: (
    db: number,
    nOps: number,
    callback: number,
    data: number
  ) => void;

  /**
   * Check if auto-commit mode is enabled
   *
   * @param db - Database connection pointer
   * @returns Non-zero if auto-commit is enabled, zero if in a transaction
   */
  _sqlite3_get_autocommit: (db: number) => number;

  /**
   * Get the database connection for a prepared statement
   *
   * @param stmt - Prepared statement pointer
   * @returns Database connection pointer
   */
  _sqlite3_db_handle: (stmt: number) => number;

  /**
   * Get the current transaction state
   *
   * @param db - Database connection pointer
   * @param schema - Schema name pointer (or null for main schema)
   * @returns Transaction state code
   */
  _sqlite3_txn_state: (db: number, schema: number) => number;

  // Error Handling and Diagnostics
  // ==============================

  /**
   * Get the most recent error code for a database connection
   *
   * @param db - Database connection pointer
   * @returns SQLite result code of the most recent error
   */
  _sqlite3_errcode: (db: SQLite3Db) => SQLiteResultCode;

  /**
   * Get the most recent extended error code for a database connection
   *
   * Provides more detailed error information than _sqlite3_errcode.
   *
   * @param db - Database connection pointer
   * @returns Extended SQLite result code
   */
  _sqlite3_extended_errcode: (db: SQLite3Db) => SQLiteResultCode;

  /**
   * Get the most recent error message for a database connection
   *
   * @param db - Database connection pointer
   * @returns Pointer to UTF-8 error message string
   */
  _sqlite3_errmsg: (db: SQLite3Db) => WasmPtr;

  /**
   * Get an error message for a specific SQLite result code
   *
   * @param code - SQLite result code
   * @returns Pointer to UTF-8 error message string
   */
  _sqlite3_errstr: (code: SQLiteResultCode) => WasmPtr;

  /**
   * Get the byte offset of an error in SQL text
   *
   * Useful for pinpointing syntax errors in SQL statements.
   *
   * @param db - Database connection pointer
   * @returns Byte offset of the error in SQL, or -1 if not applicable
   */
  _sqlite3_error_offset: (db: number) => number;

  // Memory Management Operations
  // ============================

  /**
   * Allocate memory using SQLite's memory allocator
   *
   * Allocates n bytes of memory using SQLite's internal memory allocator.
   * The memory allocated by this function must be freed using _sqlite3_free().
   *
   * @param n - Number of bytes to allocate (must be > 0)
   * @returns Pointer to allocated memory (>0), or 0 if allocation failed
   *
   * @example
   * ```typescript
   * const ptr = module._sqlite3_malloc(1024);
   * if (ptr === 0) {
   *   throw new Error("Out of memory");
   * }
   * // Use memory...
   * module._sqlite3_free(ptr);
   * ```
   */
  _sqlite3_malloc: (n: number) => AllocPtr;

  /**
   * Allocate 64-bit memory using SQLite's memory allocator
   *
   * Allocates n bytes of memory using SQLite's internal memory allocator with
   * 64-bit size parameter support. The memory allocated by this function must
   * be freed using _sqlite3_free().
   *
   * Note: Despite the name, WebAssembly uses JavaScript numbers instead of BigInt
   * for size parameters due to WebAssembly limitations.
   *
   * @param n - Number of bytes to allocate (as JavaScript number, must be > 0)
   * @returns Pointer to allocated memory (>0), or 0 if allocation failed
   *
   * @example
   * ```typescript
   * const ptr = module._sqlite3_malloc64(2048);
   * if (ptr === 0) {
   *   throw new Error("Out of memory");
   * }
   * // Use memory...
   * module._sqlite3_free(ptr);
   * ```
   */
  _sqlite3_malloc64: (n: number) => AllocPtr;

  /**
   * Reallocate memory using SQLite's memory allocator
   *
   * Changes the size of the memory block pointed to by old to n bytes.
   * If old is 0, this behaves like _sqlite3_malloc(n).
   * If n is 0, this behaves like _sqlite3_free(old) and returns 0.
   *
   * @param old - Pointer to previously allocated memory (0 for new allocation)
   * @param n - New size in bytes (0 to free memory)
   * @returns Pointer to reallocated memory (>0), or 0 if reallocation failed
   *
   * @example
   * ```typescript
   * let ptr = module._sqlite3_malloc(512);
   * if (ptr === 0) throw new Error("Initial allocation failed");
   *
   * ptr = module._sqlite3_realloc(ptr, 1024);
   * if (ptr === 0) throw new Error("Reallocation failed");
   *
   * module._sqlite3_free(ptr);
   * ```
   */
  _sqlite3_realloc: (old: WasmPtr, n: number) => AllocPtr;

  /**
   * Reallocate 64-bit memory using SQLite's memory allocator
   *
   * Changes the size of the memory block pointed to by old to n bytes.
   * If old is 0, this behaves like _sqlite3_malloc64(n).
   * If n is 0, this behaves like _sqlite3_free(old) and returns 0.
   *
   * Note: Despite the name, WebAssembly uses JavaScript numbers instead of BigInt
   * for size parameters due to WebAssembly limitations.
   *
   * @param old - Pointer to previously allocated memory (0 for new allocation)
   * @param n - New size in bytes (as JavaScript number, 0 to free memory)
   * @returns Pointer to reallocated memory (>0), or 0 if reallocation failed
   *
   * @example
   * ```typescript
   * let ptr = module._sqlite3_malloc64(512);
   * if (ptr === 0) throw new Error("Initial allocation failed");
   *
   * ptr = module._sqlite3_realloc64(ptr, 2048);
   * if (ptr === 0) throw new Error("Reallocation failed");
   *
   * module._sqlite3_free(ptr);
   * ```
   */
  _sqlite3_realloc64: (old: WasmPtr, n: number) => AllocPtr;

  /**
   * Free memory allocated with SQLite's memory allocator
   *
   * Frees memory that was previously allocated with _sqlite3_malloc(),
   * _sqlite3_malloc64(), _sqlite3_realloc(), or _sqlite3_realloc64().
   *
   * Passing 0 (null pointer) is safe and does nothing.
   * Passing an invalid pointer results in undefined behavior.
   *
   * @param ptr - Pointer to memory to free (0 is safe and ignored)
   *
   * @example
   * ```typescript
   * const ptr = module._sqlite3_malloc(1024);
   * if (ptr !== 0) {
   *   // Use memory...
   *   module._sqlite3_free(ptr);
   * }
   * ```
   */
  _sqlite3_free: (ptr: WasmPtr) => void;

  /**
   * Get the size of a memory allocation
   *
   * Returns the size of the memory allocation pointed to by ptr.
   * The ptr must be a valid pointer returned by _sqlite3_malloc(),
   * _sqlite3_malloc64(), _sqlite3_realloc(), or _sqlite3_realloc64().
   *
   * @param ptr - Pointer to memory allocated with SQLite allocator (must be valid, not 0)
   * @returns Size of the memory allocation in bytes, or undefined behavior for invalid ptr
   *
   * @example
   * ```typescript
   * const ptr = module._sqlite3_malloc(1024);
   * if (ptr !== 0) {
   *   const size = module._sqlite3_msize(ptr); // Returns 1024 (or more)
   *   module._sqlite3_free(ptr);
   * }
   * ```
   */
  _sqlite3_msize: (ptr: WasmPtr) => number;

  // Virtual File System (VFS) Operations
  // ====================================

  /**
   * Find a Virtual File System by name
   *
   * @param zVfsName - Pointer to VFS name (0 for default VFS)
   * @returns VFS pointer (>0) or 0 if not found
   */
  _sqlite3_vfs_find: (zVfsName: number) => number;

  /**
   * Register a new Virtual File System
   *
   * @param vfs - VFS object pointer
   * @param makeDflt - Non-zero to make this the default VFS
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_vfs_register: (vfs: number, makeDflt: number) => number;

  /**
   * Unregister a Virtual File System
   *
   * @param vfs - VFS object pointer
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_vfs_unregister: (vfs: number) => number;

  /**
   * Low-level file control operation
   *
   * Used for advanced file system operations and extensions.
   *
   * @param db - Database connection pointer
   * @param zDbName - Pointer to database name
   * @param op - File control operation code
   * @param pArg - Operation-specific argument pointer
   * @returns SQLite result code
   */
  _sqlite3_file_control: (
    db: number,
    zDbName: number,
    op: number,
    pArg: number
  ) => number;

  // File I/O Utility Operations
  // ===========================

  /**
   * Create a temporary file name
   *
   * @param db - Database connection pointer
   * @param zBuf - Buffer to receive temporary filename
   * @param nBuf - Size of buffer in bytes
   * @param zDir - Directory for temporary file (null for default)
   * @returns SQLite result code
   */
  _sqlite3_temp_filename: (
    db: number,
    zBuf: WasmPtr,
    nBuf: number,
    zDir: WasmPtr | null
  ) => SQLiteResultCode;

  /**
   * Check if a file exists and is accessible
   *
   * @param zPath - Pointer to file path in UTF-8
   * @param flags - Access flags (SQLITE_ACCESS_*)
   * @param pResOut - Pointer to receive result (0 or non-zero)
   * @returns SQLite result code
   */
  _sqlite3_access: (
    zPath: WasmPtr,
    flags: SQLiteAccessFlag,
    pResOut: WasmPtr
  ) => SQLiteResultCode;

  /**
   * Get full pathname from relative path
   *
   * @param zPath - Pointer to relative path
   * @param nOut - Size of output buffer
   * @param zOut - Pointer to output buffer for full path
   * @returns SQLite result code
   */
  _sqlite3_fullpathname: (
    zPath: WasmPtr,
    nOut: number,
    zOut: WasmPtr
  ) => SQLiteResultCode;

  // Status and Configuration Operations
  // ===================================

  /**
   * Get SQLite performance status information
   *
   * @param op - Status parameter code
   * @param pCurrent - Pointer to store current value
   * @param pHighwater - Pointer to store high-water mark
   * @param resetFlag - Non-zero to reset high-water mark
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_status: (
    op: number,
    pCurrent: number,
    pHighwater: number,
    resetFlag: number
  ) => number;

  /**
   * Get 64-bit SQLite performance status information
   *
   * @param op - Status parameter code
   * @param pCurrent - Pointer to store current value
   * @param pHighwater - Pointer to store high-water mark
   * @param resetFlag - Non-zero to reset high-water mark
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_status64: (
    op: number,
    pCurrent: number,
    pHighwater: number,
    resetFlag: number
  ) => number;

  /**
   * Get database connection status information
   *
   * @param db - Database connection pointer
   * @param op - Status parameter code
   * @param pCurrent - Pointer to store current value
   * @param pHighwater - Pointer to store high-water mark
   * @param resetFlag - Non-zero to reset high-water mark
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_db_status: (
    db: number,
    op: number,
    pCurrent: number,
    pHighwater: number,
    resetFlag: number
  ) => number;

  /**
   * Set or get a database connection limit
   *
   * @param db - Database connection pointer
   * @param id - Limit identifier (e.g., SQLITE_LIMIT_LENGTH)
   * @param newVal - New limit value, or -1 to get current limit
   * @returns Previous limit value
   */
  _sqlite3_limit: (db: number, id: number, newVal: number) => number;

  /**
   * Enable or disable extended result codes
   *
   * @param db - Database connection pointer
   * @param onoff - Non-zero to enable, zero to disable
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_extended_result_codes: (db: number, onoff: number) => number;

  // Configuration Operations
  // ========================

  /**
   * Configure SQLite library-wide options
   *
   * @param option - Configuration option (SQLITE_CONFIG_*)
   * @param ... - Variable arguments depending on option
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_config: (option: number, ...args: number[]) => SQLiteResultCode;

  /**
   * Configure database-specific options
   *
   * @param db - Database connection pointer
   * @param op - Configuration option (SQLITE_DBCONFIG_*)
   * @param ... - Variable arguments depending on option
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_db_config: (
    db: SQLite3Db,
    op: number,
    ...args: number[]
  ) => SQLiteResultCode;

  /**
   * Initialize SQLite library
   *
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_initialize: () => SQLiteResultCode;

  /**
   * Shutdown SQLite library
   *
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_shutdown: () => SQLiteResultCode;

  // Custom Function Creation Operations
  // ==================================

  /**
   * Create a new SQL function
   *
   * @param db - Database connection pointer
   * @param zFunctionName - Pointer to function name
   * @param nArg - Number of arguments (-1 for variable arguments)
   * @param eTextRep - Text encoding preference
   * @param pApp - Application data pointer
   * @param xFunc - Scalar function callback pointer
   * @param xStep - Aggregate step callback pointer
   * @param xFinal - Aggregate final callback pointer
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_create_function: (
    db: number,
    zFunctionName: number,
    nArg: number,
    eTextRep: number,
    pApp: number,
    xFunc: number,
    xStep: number,
    xFinal: number
  ) => number;
  /**
   * Create a new SQL function with destructor callback
   *
   * @param db - Database connection pointer
   * @param zFunctionName - Pointer to function name
   * @param nArg - Number of arguments (-1 for variable arguments)
   * @param eTextRep - Text encoding preference
   * @param pApp - Application data pointer
   * @param xFunc - Scalar function callback pointer
   * @param xStep - Aggregate step callback pointer
   * @param xFinal - Aggregate final callback pointer
   * @param xDestroy - Destructor callback pointer
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_create_function_v2: (
    db: number,
    zFunctionName: number,
    nArg: number,
    eTextRep: number,
    pApp: number,
    xFunc: number,
    xStep: number,
    xFinal: number,
    xDestroy: number
  ) => number;
  /**
   * Create a new window function
   *
   * @param db - Database connection pointer
   * @param zFunctionName - Pointer to function name
   * @param nArg - Number of arguments (-1 for variable arguments)
   * @param eTextRep - Text encoding preference
   * @param pApp - Application data pointer
   * @param xStep - Aggregate step callback pointer
   * @param xFinal - Aggregate final callback pointer
   * @param xValue - Window value callback pointer
   * @param xInverse - Window inverse callback pointer
   * @param xDestroy - Destructor callback pointer
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_create_window_function: (
    db: number,
    zFunctionName: number,
    nArg: number,
    eTextRep: number,
    pApp: number,
    xStep: number,
    xFinal: number,
    xValue: number,
    xInverse: number,
    xDestroy: number
  ) => number;

  /**
   * Overload a SQL function with different argument counts
   *
   * @param db - Database connection pointer
   * @param zFuncName - Pointer to function name
   * @param nArg - Number of arguments
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_overload_function: (
    db: number,
    zFuncName: number,
    nArg: number
  ) => number;

  // Module and Virtual Table Operations
  // =================================

  /**
   * Register a virtual table module
   *
   * @param db - Database connection pointer
   * @param zName - Pointer to module name
   * @param module - Pointer to module structure
   * @param pAux - Auxiliary data pointer
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_create_module: (
    db: number,
    zName: number,
    module: number,
    pAux: number
  ) => number;

  /**
   * Register a virtual table module with destructor
   *
   * @param db - Database connection pointer
   * @param zName - Pointer to module name
   * @param module - Pointer to module structure
   * @param pAux - Auxiliary data pointer
   * @param xDestroy - Destructor callback pointer
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_create_module_v2: (
    db: number,
    zName: number,
    module: number,
    pAux: number,
    xDestroy: number
  ) => number;

  /**
   * Remove virtual table modules from database
   *
   * @param db - Database connection pointer
   * @param azKeep - Pointer to array of module names to keep (null to remove all)
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_drop_modules: (db: number, azKeep: number) => number;

  /**
   * Declare the schema for a virtual table
   *
   * @param db - Database connection pointer
   * @param zSQL - Pointer to CREATE TABLE statement for virtual table
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_declare_vtab: (db: number, zSQL: number) => number;

  /**
   * Determine conflict resolution mode for virtual table
   *
   * @param ctx - Virtual table context pointer
   * @returns Conflict resolution mode (SQLITE_ROLLBACK, SQLITE_IGNORE, etc.)
   */
  _sqlite3_vtab_on_conflict: (ctx: number) => number;

  /**
   * Get collation sequence for virtual table column
   *
   * @param ctx - Virtual table context pointer
   * @param index - Column index
   * @returns Pointer to collation sequence name
   */
  _sqlite3_vtab_collation: (ctx: number, index: number) => number;

  /**
   * Check if virtual table IN constraint is supported
   *
   * @param ctx - Virtual table context pointer
   * @param idx - Constraint index
   * @param handle - Pointer to store IN constraint handle
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_vtab_in: (ctx: number, idx: number, handle: number) => number;

  /**
   * Get first value from virtual table IN constraint
   *
   * @param handle - IN constraint handle
   * @param ctx - Virtual table context pointer
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_vtab_in_first: (handle: number, ctx: number) => number;

  /**
   * Get next value from virtual table IN constraint
   *
   * @param handle - IN constraint handle
   * @param ctx - Virtual table context pointer
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_vtab_in_next: (handle: number, ctx: number) => number;

  /**
   * Get right-hand side value for virtual table constraint
   *
   * @param ctx - Virtual table context pointer
   * @param iVal - Constraint index
   * @param value - Pointer to store value
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_vtab_rhs_value: (ctx: number, iVal: number, value: number) => number;

  /**
   * Check if virtual table DISTINCT constraint is present
   *
   * @param ctx - Virtual table context pointer
   * @returns Non-zero if DISTINCT constraint is present
   */
  _sqlite3_vtab_distinct: (ctx: number) => number;

  /**
   * Check if virtual table column value was not changed
   *
   * @param ctx - Virtual table context pointer
   * @returns Non-zero if column value was not changed
   */
  _sqlite3_vtab_nochange: (ctx: number) => number;

  // Collation Sequence Operations
  // ===========================

  /**
   * Create a new collation sequence
   *
   * @param db - Database connection pointer
   * @param zName - Pointer to collation name
   * @param eTextRep - Text encoding preference
   * @param pArg - Application data pointer
   * @param xCompare - Comparison function pointer
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_create_collation: (
    db: number,
    zName: number,
    eTextRep: number,
    pArg: number,
    xCompare: number
  ) => number;

  /**
   * Create a new collation sequence with destructor
   *
   * @param db - Database connection pointer
   * @param zName - Pointer to collation name
   * @param eTextRep - Text encoding preference
   * @param pArg - Application data pointer
   * @param xCompare - Comparison function pointer
   * @param xDestroy - Destructor callback pointer
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_create_collation_v2: (
    db: number,
    zName: number,
    eTextRep: number,
    pArg: number,
    xCompare: number,
    xDestroy: number
  ) => number;

  /**
   * Set collation needed callback
   *
   * @param db - Database connection pointer
   * @param pData - Application data pointer
   * @param xCallback - Callback function pointer
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_collation_needed: (
    db: number,
    pData: number,
    xCallback: number
  ) => number;

  // Database Backup and Serialization Operations
  // ===========================================

  /**
   * Initialize a database backup operation
   *
   * @param pDest - Destination database connection
   * @param zDestName - Pointer to destination database name (usually "main")
   * @param pSource - Source database connection
   * @param zSourceName - Pointer to source database name (usually "main")
   * @returns Backup handle pointer, or 0 on error
   */
  _sqlite3_backup_init: (
    pDest: SQLite3Db,
    zDestName: WasmPtr,
    pSource: SQLite3Db,
    zSourceName: WasmPtr
  ) => WasmPtr;

  /**
   * Copy database pages during backup
   *
   * @param p - Backup handle returned by sqlite3_backup_init
   * @param nPage - Number of pages to copy (-1 to copy all remaining pages)
   * @returns SQLITE_OK, SQLITE_DONE, or error code
   */
  _sqlite3_backup_step: (p: WasmPtr, nPage: number) => SQLiteResultCode;

  /**
   * Finish a backup operation and release resources
   *
   * @param p - Backup handle returned by sqlite3_backup_init
   * @returns Final result code from the backup operation
   */
  _sqlite3_backup_finish: (p: WasmPtr) => SQLiteResultCode;

  /**
   * Get the number of pages remaining to be backed up
   *
   * @param p - Backup handle returned by sqlite3_backup_init
   * @returns Number of pages still to be backed up
   */
  _sqlite3_backup_remaining: (p: WasmPtr) => number;

  /**
   * Get the total number of pages in the source database
   *
   * @param p - Backup handle returned by sqlite3_backup_init
   * @returns Total number of pages in source database
   */
  _sqlite3_backup_pagecount: (p: WasmPtr) => number;

  /**
   * Serialize a database into memory
   *
   * The sqlite3_serialize() interface returns a pointer to memory that is a
   * serialization of the S database on database connection D. If P is not NULL,
   * then the size of the database in bytes is written into *P.
   *
   * @param db - Database connection pointer
   * @param zSchema - Pointer to schema name string ("main", "temp", or attached DB name)
   * @param ppData - Pointer to receive pointer to serialized data (output parameter)
   * @param pSize - Pointer to receive size of serialized data in bytes (output parameter)
   * @param mFlags - Serialization flags (SQLITE_SERIALIZE_*)
   * @returns SQLite result code (SQLITE_OK on success)
   *
   * @example
   * ```typescript
   * const dataPtr = module._malloc(8); // For data pointer
   * const sizePtr = module._malloc(8); // For size
   * const result = module._sqlite3_serialize(db, schemaNamePtr, dataPtr, sizePtr, 0);
   * if (result === SQLITE_OK) {
   *   const serializedDataPtr = module.getValue(dataPtr, "*");
   *   const size = module.getValue(sizePtr, "i64");
   *   // Use serialized data...
   * }
   * ```
   */
  _sqlite3_serialize: (
    db: SQLite3Db,
    zSchema: WasmPtr,
    ppData: WasmPtr,
    pSize: WasmPtr,
    mFlags: number
  ) => SQLiteResultCode;

  /**
   * Deserialize a database from memory
   *
   * The sqlite3_deserialize() interface causes the database connection D to
   * disconnect from database S and then reopen S as an in-memory database based
   * on the serialization contained in P.
   *
   * @param db - Database connection pointer
   * @param zSchema - Pointer to schema name string ("main", "temp", or attached DB name)
   * @param pData - Pointer to serialized database content
   * @param szDb - Number of bytes in the serialized database (actual data size)
   * @param szBuf - Total size of buffer pData[] (may be larger than szDb)
   * @param mFlags - Deserialization flags (SQLITE_DESERIALIZE_*)
   * @returns SQLite result code (SQLITE_OK on success)
   *
   * @example
   * ```typescript
   * const result = module._sqlite3_deserialize(
   *   db,
   *   schemaNamePtr,
   *   serializedDataPtr,
   *   actualDataSize,
   *   bufferSize,
   *   SQLITE_DESERIALIZE_FREEONCLOSE
   * );
   * if (result === SQLITE_OK) {
   *   // Database successfully deserialized
   * }
   * ```
   */
  _sqlite3_deserialize: (
    db: SQLite3Db,
    zSchema: WasmPtr,
    pData: WasmPtr,
    szDb: SQLiteInt64,
    szBuf: SQLiteInt64,
    mFlags: number
  ) => SQLiteResultCode;

  // Random Number Generation
  // ========================

  /**
   * Generate random bytes
   *
   * @param n - Number of random bytes to generate
   * @param pBuf - Pointer to buffer to store random bytes
   */
  _sqlite3_randomness: (n: number, pBuf: number) => void;

  // URI Filename Operations
  // =======================

  /**
   * Get parameter value from database filename URI
   *
   * @param zFilename - Pointer to database filename URI
   * @param zParam - Pointer to parameter name
   * @returns Pointer to parameter value (>0), or 0 if not found
   */
  _sqlite3_uri_parameter: (zFilename: number, zParam: number) => number;

  /**
   * Get boolean parameter value from database filename URI
   *
   * @param zFilename - Pointer to database filename URI
   * @param zParam - Pointer to parameter name
   * @param bDefault - Default value if parameter not found
   * @returns Boolean parameter value (0 or 1)
   */
  _sqlite3_uri_boolean: (
    zFilename: number,
    zParam: number,
    bDefault: number
  ) => number;

  /**
   * Get 64-bit integer parameter value from database filename URI
   *
   * @param zFilename - Pointer to database filename URI
   * @param zParam - Pointer to parameter name
   * @param bDefault - Default value if parameter not found
   * @returns Integer parameter value
   */
  _sqlite3_uri_int64: (
    zFilename: number,
    zParam: number,
    bDefault: number
  ) => number; // Returns number

  /**
   * Get Nth parameter name from database filename URI
   *
   * @param zFilename - Pointer to database filename URI
   * @param n - Parameter index (0-based)
   * @returns Pointer to parameter name (>0), or 0 if not found
   */
  _sqlite3_uri_key: (zFilename: number, n: number) => number;

  // SQLite Utility Functions
  // ========================

  /**
   * Check if SQL statement is complete
   *
   * @param sql - Pointer to SQL string
   * @returns Non-zero if SQL statement is complete
   */
  _sqlite3_complete: (sql: number) => number;

  /**
   * Case-insensitive string comparison
   *
   * @param zA - Pointer to first string
   * @param zB - Pointer to second string
   * @returns Negative if zA < zB, zero if equal, positive if zA > zB
   */
  _sqlite3_stricmp: (zA: number, zB: number) => number;

  /**
   * Case-insensitive string comparison with length limit
   *
   * @param zA - Pointer to first string
   * @param zB - Pointer to second string
   * @param n - Maximum number of characters to compare
   * @returns Negative if zA < zB, zero if equal, positive if zA > zB
   */
  _sqlite3_strnicmp: (zA: number, zB: number, n: number) => number;

  /**
   * String glob pattern matching
   *
   * @param zGlob - Pointer to glob pattern
   * @param zStr - Pointer to string to match
   * @returns Non-zero if string matches glob pattern
   */
  _sqlite3_strglob: (zGlob: number, zStr: number) => number;

  /**
   * String LIKE pattern matching
   *
   * @param zGlob - Pointer to LIKE pattern
   * @param zStr - Pointer to string to match
   * @param esc - Escape character
   * @returns Non-zero if string matches LIKE pattern
   */
  _sqlite3_strlike: (zGlob: number, zStr: number, esc: number) => number;

  /**
   * Check if string is a SQLite keyword
   *
   * @param zKeyword - Pointer to string to check
   * @param n - Length of string
   * @returns Non-zero if string is a SQLite keyword
   */
  _sqlite3_keyword_check: (zKeyword: number, n: number) => number;

  /**
   * Get SQLite keyword name by index
   *
   * @param n - Keyword index
   * @param pzName - Pointer to store keyword name pointer
   * @param pnName - Pointer to store keyword length
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_keyword_name: (n: number, pzName: number, pnName: number) => number;

  /**
   * Get number of SQLite keywords
   *
   * @returns Number of SQLite keywords
   */
  _sqlite3_keyword_count: () => number;

  /**
   * Get SQLite source identifier
   *
   * @returns Pointer to source identifier string
   */
  _sqlite3_sourceid: () => WasmPtr;

  // SQLite Hooks and Callbacks
  // ==========================

  /**
   * Register trace callback
   *
   * @param db - Database connection pointer
   * @param mask - Trace event mask
   * @param callback - Callback function pointer
   * @param data - Application data pointer
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_trace_v2: (
    db: number,
    mask: number,
    callback: number,
    data: number
  ) => number;

  /**
   * Register commit callback
   *
   * @param db - Database connection pointer
   * @param callback - Callback function pointer
   * @param data - Application data pointer
   * @returns Previous callback function pointer
   */
  _sqlite3_commit_hook: (db: number, callback: number, data: number) => number;

  /**
   * Register rollback callback
   *
   * @param db - Database connection pointer
   * @param callback - Callback function pointer
   * @param data - Application data pointer
   * @returns Previous callback function pointer
   */
  _sqlite3_rollback_hook: (
    db: number,
    callback: number,
    data: number
  ) => number;

  /**
   * Register update callback
   *
   * @param db - Database connection pointer
   * @param callback - Callback function pointer
   * @param data - Application data pointer
   * @returns Previous callback function pointer
   */
  _sqlite3_update_hook: (db: number, callback: number, data: number) => number;

  /**
   * Register pre-update callback
   *
   * @param db - Database connection pointer
   * @param callback - Callback function pointer
   * @param data - Application data pointer
   * @returns Previous callback function pointer
   */
  _sqlite3_preupdate_hook: (
    db: number,
    callback: number,
    data: number
  ) => number;

  /**
   * Set authorizer callback (legacy)
   *
   * @param db - Database connection pointer
   * @param xAuth - Authorizer callback function pointer
   * @param pUserData - Application data pointer
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_authorizer: (db: number, xAuth: number, pUserData: number) => number;

  /**
   * Set authorizer callback
   *
   * @param db - Database connection pointer
   * @param xAuth - Authorizer callback function pointer
   * @param pUserData - Application data pointer
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_set_authorizer: (
    db: number,
    xAuth: number,
    pUserData: number
  ) => number;

  // Statement Information Operations
  // ================================

  /**
   * Check if prepared statement is read-only
   *
   * @param stmt - Prepared statement pointer
   * @returns Non-zero if statement does not modify database
   */
  _sqlite3_stmt_readonly: (stmt: number) => number;

  /**
   * Check if prepared statement is busy
   *
   * @param stmt - Prepared statement pointer
   * @returns Non-zero if statement has an active cursor
   */
  _sqlite3_stmt_busy: (stmt: number) => number;

  /**
   * Get prepared statement status information
   *
   * @param stmt - Prepared statement pointer
   * @param op - Status parameter code
   * @param resetFlag - Non-zero to reset the counter
   * @returns Status value
   */
  _sqlite3_stmt_status: (stmt: number, op: number, resetFlag: number) => number;

  /**
   * Change statement explain mode
   *
   * @param stmt - Prepared statement pointer
   * @param eMode - Explain mode (SQLITE_EXPLAIN_OFF, SQLITE_EXPLAIN_ON, etc.)
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_stmt_explain: (stmt: number, eMode: number) => number;

  /**
   * Check if statement is an EXPLAIN statement
   *
   * @param stmt - Prepared statement pointer
   * @returns Non-zero if statement is an EXPLAIN statement
   */
  _sqlite3_stmt_isexplain: (stmt: number) => number;

  /**
   * Get SQL text of prepared statement
   *
   * @param stmt - Prepared statement pointer
   * @returns Pointer to SQL text
   */
  _sqlite3_sql: (stmt: number) => number;

  /**
   * Get expanded SQL text of prepared statement
   *
   * @param stmt - Prepared statement pointer
   * @returns Pointer to expanded SQL text (caller must free)
   */
  _sqlite3_expanded_sql: (stmt: number) => number;

  // Auto Extension Operations
  // ========================

  /**
   * Register auto-extension function
   *
   * @param xInit - Extension initialization function pointer
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_auto_extension: (xInit: number) => number;

  /**
   * Cancel auto-extension function
   *
   * @param xInit - Extension initialization function pointer
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_cancel_auto_extension: (xInit: number) => number;

  /**
   * Reset all auto-extensions
   */
  _sqlite3_reset_auto_extension: () => void;

  // Session Extension Operations
  // ===========================

  /**
   * Create a new session object
   *
   * @param db - Database connection pointer
   * @param zDb - Pointer to database name
   * @param ppSession - Pointer to store session object pointer
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3session_create: (
    db: number,
    zDb: number,
    ppSession: number
  ) => number;

  /**
   * Delete a session object
   *
   * @param session - Session object pointer
   */
  _sqlite3session_delete: (session: number) => void;

  /**
   * Attach a table to a session
   *
   * @param session - Session object pointer
   * @param zTab - Pointer to table name (null for all tables)
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3session_attach: (session: number, zTab: number) => number;

  /**
   * Set table filter callback for session
   *
   * @param session - Session object pointer
   * @param xFilter - Filter callback function pointer
   * @param pCtx - Context pointer for callback
   */
  _sqlite3session_table_filter: (
    session: number,
    xFilter: number,
    pCtx: number
  ) => void;

  /**
   * Generate changeset from session
   *
   * @param session - Session object pointer
   * @param pnChangeset - Pointer to store changeset size
   * @returns Pointer to changeset data
   */
  _sqlite3session_changeset: (session: number, pnChangeset: number) => number;

  /**
   * Generate changeset from session using stream interface
   *
   * @param session - Session object pointer
   * @param xOutput - Output callback function pointer
   * @param pOutCtx - Output context pointer
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3session_changeset_strm: (
    session: number,
    xOutput: number,
    pOutCtx: number
  ) => number;

  /**
   * Generate patchset from session
   *
   * @param session - Session object pointer
   * @param pnPatchset - Pointer to store patchset size
   * @returns Pointer to patchset data
   */
  _sqlite3session_patchset: (session: number, pnPatchset: number) => number;

  /**
   * Generate patchset from session using stream interface
   *
   * @param session - Session object pointer
   * @param xOutput - Output callback function pointer
   * @param pOutCtx - Output context pointer
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3session_patchset_strm: (
    session: number,
    xOutput: number,
    pOutCtx: number
  ) => number;

  /**
   * Compare database table to session and generate changeset
   *
   * @param session - Session object pointer
   * @param zTab - Pointer to table name
   * @param zFromDb - Pointer to source database name
   * @param ppChangeset - Pointer to store changeset pointer
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3session_diff: (
    session: number,
    zTab: number,
    zFromDb: number,
    ppChangeset: number
  ) => number;

  /**
   * Enable or disable session
   *
   * @param session - Session object pointer
   * @param enable - Non-zero to enable, zero to disable
   * @returns Previous enable state
   */
  _sqlite3session_enable: (session: number, enable: number) => number;

  /**
   * Enable or disable indirect change tracking
   *
   * @param session - Session object pointer
   * @param enable - Non-zero to enable indirect changes, zero to disable
   * @returns Previous indirect state
   */
  _sqlite3session_indirect: (session: number, enable: number) => number;

  /**
   * Check if session contains no changes
   *
   * @param session - Session object pointer
   * @returns Non-zero if session is empty
   */
  _sqlite3session_isempty: (session: number) => number;

  /**
   * Get memory used by session
   *
   * @param session - Session object pointer
   * @returns Number of bytes used
   */
  _sqlite3session_memory_used: (session: number) => number;

  /**
   * Configure session object
   *
   * @param session - Session object pointer
   * @param config - Configuration option
   * @param value - Configuration value
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3session_object_config: (
    session: number,
    config: number,
    value: number
  ) => number;

  /**
   * Get size of changeset
   *
   * @param session - Session object pointer
   * @returns Size of changeset in bytes
   */
  _sqlite3session_changeset_size: (session: number) => number;

  // Changeset Iterator Operations
  // =============================

  /**
   * Create iterator to read changeset
   *
   * @param ppChangeset - Pointer to store changeset iterator
   * @param nChangeset - Size of changeset data
   * @param pChangeset - Pointer to changeset data
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3changeset_start: (
    ppChangeset: number,
    nChangeset: number,
    pChangeset: number
  ) => number;

  /**
   * Create iterator to read changeset with flags
   *
   * @param ppChangeset - Pointer to store changeset iterator
   * @param nChangeset - Size of changeset data
   * @param pChangeset - Pointer to changeset data
   * @param flags - Iterator flags
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3changeset_start_v2: (
    ppChangeset: number,
    nChangeset: number,
    pChangeset: number,
    flags: number
  ) => number;

  /**
   * Create iterator to read changeset using stream interface
   *
   * @param xInput - Input callback function pointer
   * @param pInCtx - Input context pointer
   * @param ppChangeset - Pointer to store changeset iterator
   * @param flags - Iterator flags
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3changeset_start_strm: (
    xInput: number,
    pInCtx: number,
    ppChangeset: number,
    flags: number
  ) => number;

  /**
   * Create iterator to read changeset v2 using stream interface
   *
   * @param xInput - Input callback function pointer
   * @param pInCtx - Input context pointer
   * @param ppChangeset - Pointer to store changeset iterator
   * @param flags - Iterator flags
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3changeset_start_v2_strm: (
    xInput: number,
    pInCtx: number,
    ppChangeset: number,
    flags: number
  ) => number;

  /**
   * Advance to next operation in changeset
   *
   * @param changeset - Changeset iterator pointer
   * @returns SQLite result code (SQLITE_OK on success, SQLITE_ROW on valid operation, SQLITE_DONE on end)
   */
  _sqlite3changeset_next: (changeset: number) => number;

  /**
   * Get current operation from changeset iterator
   *
   * @param changeset - Changeset iterator pointer
   * @param pOp - Pointer to store operation code
   * @param pnCol - Pointer to store number of columns
   * @param pbIndirect - Pointer to store indirect flag
   * @param pk - Pointer to store primary key information
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3changeset_op: (
    changeset: number,
    pOp: number,
    pnCol: number,
    pbIndirect: number,
    pk: number
  ) => number;

  /**
   * Get primary key information for current changeset operation
   *
   * @param changeset - Changeset iterator pointer
   * @param pOp - Current operation pointer
   * @returns Pointer to primary key information
   */
  _sqlite3changeset_pk: (changeset: number, pOp: number) => number;

  /**
   * Get old value from current changeset operation
   *
   * @param changeset - Changeset iterator pointer
   * @param pOp - Current operation pointer
   * @param iVal - Column index
   * @param ppValue - Pointer to store value pointer
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3changeset_old: (
    changeset: number,
    pOp: number,
    iVal: number,
    ppValue: number
  ) => number;

  /**
   * Get new value from current changeset operation
   *
   * @param changeset - Changeset iterator pointer
   * @param pOp - Current operation pointer
   * @param iVal - Column index
   * @param ppValue - Pointer to store value pointer
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3changeset_new: (
    changeset: number,
    pOp: number,
    iVal: number,
    ppValue: number
  ) => number;
  /**
   * Get conflict value from current changeset operation
   *
   * @param changeset - Changeset iterator pointer
   * @param pOp - Current operation pointer
   * @param iVal - Column index
   * @param ppValue - Pointer to store conflict value pointer
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3changeset_conflict: (
    changeset: number,
    pOp: number,
    iVal: number,
    ppValue: number
  ) => number;

  /**
   * Get foreign key conflict count
   *
   * @param changeset - Changeset iterator pointer
   * @param pOffset - Pointer to store conflict count offset
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3changeset_fk_conflicts: (
    changeset: number,
    pOffset: number
  ) => number;

  /**
   * Destroy changeset iterator
   *
   * @param changeset - Changeset iterator pointer
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3changeset_finalize: (changeset: number) => number;

  /**
   * Invert changeset
   *
   * @param nInvert - Size of input changeset
   * @param pnInvert - Pointer to store size of inverted changeset
   * @param pIn - Pointer to input changeset data
   * @param ppOut - Pointer to store inverted changeset pointer
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3changeset_invert: (
    nInvert: number,
    pnInvert: number,
    pIn: number,
    ppOut: number
  ) => number;

  /**
   * Invert changeset using stream interface
   *
   * @param xInput - Input callback function pointer
   * @param pInCtx - Input context pointer
   * @param ppOut - Pointer to store inverted changeset pointer
   * @param pnOut - Pointer to store size of inverted changeset
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3changeset_invert_strm: (
    xInput: number,
    pInCtx: number,
    ppOut: number,
    pnOut: number
  ) => number;

  /**
   * Apply changeset to database (v2)
   *
   * @param db - Database connection pointer
   * @param nChangeset - Size of changeset data
   * @param pChangeset - Pointer to changeset data
   * @param xFilter - Filter callback function pointer
   * @param pCtx - Context pointer for callbacks
   * @param xConflict - Conflict resolution callback pointer
   * @param pRebase - Pointer to store rebase information
   * @param flags - Apply flags
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3changeset_apply_v2: (
    db: number,
    nChangeset: number,
    pChangeset: number,
    xFilter: number,
    pCtx: number,
    xConflict: number,
    pRebase: number,
    flags: number
  ) => number;

  /**
   * Apply changeset to database
   *
   * @param db - Database connection pointer
   * @param nChangeset - Size of changeset data
   * @param pChangeset - Pointer to changeset data
   * @param xFilter - Filter callback function pointer
   * @param pCtx - Context pointer for callbacks
   * @param xConflict - Conflict resolution callback pointer
   * @param pRebase - Pointer to store rebase information
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3changeset_apply: (
    db: number,
    nChangeset: number,
    pChangeset: number,
    xFilter: number,
    pCtx: number,
    xConflict: number,
    pRebase: number
  ) => number;

  /**
   * Apply changeset to database using stream interface (v2)
   *
   * @param db - Database connection pointer
   * @param xInput - Input callback function pointer
   * @param pInCtx - Input context pointer
   * @param xFilter - Filter callback function pointer
   * @param pCtx - Context pointer for callbacks
   * @param xConflict - Conflict resolution callback pointer
   * @param pRebase - Pointer to store rebase information
   * @param flags - Apply flags
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3changeset_apply_v2_strm: (
    db: number,
    xInput: number,
    pInCtx: number,
    xFilter: number,
    pCtx: number,
    xConflict: number,
    pRebase: number,
    flags: number
  ) => number;

  /**
   * Apply changeset to database using stream interface
   *
   * @param db - Database connection pointer
   * @param xInput - Input callback function pointer
   * @param pInCtx - Input context pointer
   * @param xFilter - Filter callback function pointer
   * @param pCtx - Context pointer for callbacks
   * @param xConflict - Conflict resolution callback pointer
   * @param pRebase - Pointer to store rebase information
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3changeset_apply_strm: (
    db: number,
    xInput: number,
    pInCtx: number,
    xFilter: number,
    pCtx: number,
    xConflict: number,
    pRebase: number
  ) => number;

  // Change Group Operations
  // =======================

  /**
   * Create new change group
   *
   * @param ppChangeGroup - Pointer to store change group object pointer
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3changegroup_new: (ppChangeGroup: number) => number;

  /**
   * Add changeset to change group
   *
   * @param changeGroup - Change group object pointer
   * @param nData - Size of changeset data
   * @param pData - Pointer to changeset data
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3changegroup_add: (
    changeGroup: number,
    nData: number,
    pData: number
  ) => number;

  /**
   * Get combined changeset from change group
   *
   * @param changeGroup - Change group object pointer
   * @param pnChangeset - Pointer to store changeset size
   * @param ppChangeset - Pointer to store changeset data pointer
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3changegroup_output: (
    changeGroup: number,
    pnChangeset: number,
    ppChangeset: number
  ) => number;

  /**
   * Add changeset to change group using stream interface
   *
   * @param changeGroup - Change group object pointer
   * @param xInput - Input callback function pointer
   * @param pInCtx - Input context pointer
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3changegroup_add_strm: (
    changeGroup: number,
    xInput: number,
    pInCtx: number
  ) => number;

  /**
   * Get combined changeset from change group using stream interface
   *
   * @param changeGroup - Change group object pointer
   * @param xOutput - Output callback function pointer
   * @param pOutCtx - Output context pointer
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3changegroup_output_strm: (
    changeGroup: number,
    xOutput: number,
    pOutCtx: number
  ) => number;

  /**
   * Delete change group object
   *
   * @param changeGroup - Change group object pointer
   */
  _sqlite3changegroup_delete: (changeGroup: number) => number;

  /**
   * Concatenate two changesets
   *
   * @param pnA - Pointer to size of first changeset
   * @param ppA - Pointer to first changeset data
   * @param nB - Size of second changeset
   * @param pB - Pointer to second changeset data
   * @param ppOut - Pointer to store concatenated changeset pointer
   * @param pnOut - Pointer to store concatenated changeset size
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3changeset_concat: (
    pnA: number,
    ppA: number,
    nB: number,
    pB: number,
    ppOut: number,
    pnOut: number
  ) => number;

  /**
   * Concatenate two changesets using stream interface
   *
   * @param xInputA - Input callback for first changeset
   * @param pInCtxA - Input context for first changeset
   * @param xInputB - Input callback for second changeset
   * @param pInCtxB - Input context for second changeset
   * @param xOutput - Output callback function pointer
   * @param pOutCtx - Output context pointer
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3changeset_concat_strm: (
    xInputA: number,
    pInCtxA: number,
    xInputB: number,
    pInCtxB: number,
    xOutput: number,
    pOutCtx: number
  ) => number;

  /**
   * Configure session extension
   *
   * @param op - Configuration operation
   * @param value - Configuration value
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3session_config: (op: number, value: number) => number;

  // Preupdate Operations
  // ====================

  /**
   * Get old value from preupdate operation
   *
   * @param db - Database connection pointer
   * @param iVal - Column index
   * @param ppValue - Pointer to store old value pointer
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_preupdate_old: (db: number, iVal: number, ppValue: number) => number;

  /**
   * Get number of columns in preupdate operation
   *
   * @param db - Database connection pointer
   * @returns Number of columns in the operation
   */
  _sqlite3_preupdate_count: (db: number) => number;

  /**
   * Get nesting depth of preupdate operation
   *
   * @param db - Database connection pointer
   * @returns Nesting depth of triggers and constraints
   */
  _sqlite3_preupdate_depth: (db: number) => number;

  /**
   * Check if preupdate is writing to a BLOB column
   *
   * @param db - Database connection pointer
   * @returns Non-zero if writing to BLOB column
   */
  _sqlite3_preupdate_blobwrite: (db: number) => number;

  /**
   * Get new value from preupdate operation
   *
   * @param db - Database connection pointer
   * @param iVal - Column index
   * @param ppValue - Pointer to store new value pointer
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_preupdate_new: (db: number, iVal: number, ppValue: number) => number;

  // WASM-specific functions (actual signatures from module)
  _sqlite3__wasm_pstack_ptr: () => number;
  _sqlite3__wasm_pstack_restore: (ptr: number) => void;
  _sqlite3__wasm_pstack_alloc: (n: number) => number;
  _sqlite3__wasm_pstack_remaining: () => number;
  _sqlite3__wasm_pstack_quota: () => number;
  _sqlite3__wasm_db_error: (
    db: number,
    errCode: number,
    zMsg: number
  ) => number;
  _sqlite3__wasm_test_struct: (db: number) => number;
  _sqlite3__wasm_enum_json: () => number;
  _sqlite3__wasm_vfs_unlink: (zName: number, zFile: number) => number;
  _sqlite3__wasm_db_vfs: (db: number, zDbName: number) => number;
  _sqlite3__wasm_db_reset: (db: number) => number;
  _sqlite3__wasm_db_export_chunked: (db: number, callback: number) => number;
  _sqlite3__wasm_db_serialize: (
    db: number,
    zSchema: number,
    pSize: number,
    mFlags: number
  ) => number;
  _sqlite3__wasm_vfs_create_file: (
    zName: number,
    zData: number,
    nData: number,
    clearOnError: number
  ) => number;
  _sqlite3__wasm_posix_create_file: (
    zFilename: number,
    zData: number,
    nData: number
  ) => number;
  _sqlite3__wasm_kvvfsMakeKeyOnPstack: (zKey: number, nKey: number) => number;
  _sqlite3__wasm_kvvfs_methods: () => number;
  _sqlite3__wasm_vtab_config: (db: number, op: number, value: number) => number;
  _sqlite3__wasm_db_config_ip: (db: number, op: number, val: number) => number;
  _sqlite3__wasm_db_config_pii: (
    db: number,
    op: number,
    ptr: number,
    len: number
  ) => number;
  _sqlite3__wasm_db_config_s: (db: number, op: number, zVal: number) => number;
  _sqlite3__wasm_config_i: (op: number, val: number) => number;
  _sqlite3__wasm_config_ii: (op: number, val: number, val2: number) => number;
  _sqlite3__wasm_config_j: (op: number, val: number) => number;
  _sqlite3__wasm_qfmt_token: (zToken: number, nToken: number) => number;
  _sqlite3__wasm_init_wasmfs: (pFlags: number) => number;
  _sqlite3__wasm_test_intptr: (ptr: number) => number;
  _sqlite3__wasm_test_voidptr: (ptr: number) => number;
  _sqlite3__wasm_test_int64_max: () => number;
  _sqlite3__wasm_test_int64_min: () => number;
  _sqlite3__wasm_test_int64_times2: (val: number) => number;
  _sqlite3__wasm_test_int64_minmax: (
    val: number,
    min: number,
    max: number
  ) => number;

  // Aggregate Context and Auxiliary Data Operations
  // ===============================================

  /**
   * Get aggregate function context
   *
   * @param ctx - Function context pointer
   * @param n - Size of memory to allocate for aggregate context
   * @returns Pointer to aggregate context memory
   */
  _sqlite3_aggregate_context: (ctx: number, n: number) => number;

  /**
   * Get auxiliary data from function context
   *
   * @param ctx - Function context pointer
   * @param n - Auxiliary data index
   * @returns Pointer to auxiliary data (>0), or 0 if not found
   */
  _sqlite3_get_auxdata: (ctx: number, n: number) => number;

  /**
   * Set auxiliary data for function context
   *
   * @param ctx - Function context pointer
   * @param n - Auxiliary data index
   * @param data - Pointer to auxiliary data
   * @param xDelete - Destructor function pointer
   */
  _sqlite3_set_auxdata: (
    ctx: number,
    n: number,
    data: number,
    xDelete: number
  ) => void;

  /**
   * Get user data from function context
   *
   * @param ctx - Function context pointer
   * @returns User data pointer
   */
  _sqlite3_user_data: (ctx: number) => number;

  /**
   * Get database handle from function context
   *
   * @param ctx - Function context pointer
   * @returns Database connection pointer
   */
  _sqlite3_context_db_handle: (ctx: number) => number;

  // Database Metadata Operations
  // ===========================

  /**
   * Get table column metadata
   *
   * @param db - Database connection pointer
   * @param zDbName - Pointer to database name
   * @param zTableName - Pointer to table name
   * @param zColumnName - Pointer to column name
   * @param pzDataType - Pointer to store data type string pointer
   * @param pzCollSeq - Pointer to store collation sequence string pointer
   * @param pNotNull - Pointer to store NOT NULL flag
   * @param pPrimaryKey - Pointer to store primary key flag
   * @param pAutoinc - Pointer to store auto-increment flag
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_table_column_metadata: (
    db: number,
    zDbName: number,
    zTableName: number,
    zColumnName: number,
    pzDataType: number,
    pzCollSeq: number,
    pNotNull: number,
    pPrimaryKey: number,
    pAutoinc: number
  ) => number;

  /**
   * Get database name by index
   *
   * @param db - Database connection pointer
   * @param n - Database index (0 = main, 1 = temp, etc.)
   * @returns Pointer to database name
   */
  _sqlite3_db_name: (db: number, n: number) => number;

  /**
   * Get database filename
   *
   * @param db - Database connection pointer
   * @param zDbName - Pointer to database name
   * @returns Pointer to database filename
   */
  _sqlite3_db_filename: (db: number, zDbName: number) => number;

  /**
   * Check if database is read-only
   *
   * @param db - Database connection pointer
   * @param zDbName - Pointer to database name
   * @returns Non-zero if database is read-only
   */
  _sqlite3_db_readonly: (db: number, zDbName: number) => number;

  /**
   * Check if SQLite was compiled with specific option
   *
   * @param zOptName - Pointer to compile option name
   * @returns Non-zero if option was used during compilation
   */
  _sqlite3_compileoption_used: (zOptName: number) => number;

  /**
   * Get compile option by index
   *
   * @param n - Compile option index
   * @returns Pointer to compile option name (>0), or 0 if index is out of range
   */
  _sqlite3_compileoption_get: (n: number) => WasmPtr;

  // WASM initialization
  ___wasm_call_ctors: () => void;

  // Export the main SQLite3 API (actual type from module)
  sqlite3: {
    /** Database class */
    DB: new (filename: string, flags?: SQLiteOpenFlags) => Database;
    /** Statement class */
    Stmt: new (db: Database, sql: string) => Statement;
    /** C API namespace */
    capi: SQLite3Module;
    /** WASM interface */
    wasm: WasmMemoryInterface;
    /** Utility functions */
    util: Record<string, unknown>;
    /** Object-oriented interface */
    oo1: Record<string, unknown>;
    /** Virtual File System */
    vfs: Record<string, VFSInterface>;
  }; // This is set by the bootstrap process
}
