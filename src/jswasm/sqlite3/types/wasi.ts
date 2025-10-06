import type {
  Statement,
  SQLite3BusyHandlerCallback,
  SQLiteOpenFlags,
  SQLiteResultCode,
  SQLite3Stmt,
  SQLiteDataType,
  SQLite3Value,
  SQLite3Db,
  Database,
  VFSInterface,
  WasmMemoryInterface,
} from "../sqlite3.d";
/** WebAssembly pointer types (based on ptrIR and ptrSizeof from source) */
export type WasmPtr = number; // 32-bit pointer
export type WasmPtr64 = bigint; // 64-bit pointer when BigInt enabled

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
  _sqlite3_libversion: () => string;

  /**
   * Get the SQLite library version number
   *
   * Returns the version as X*1000000 + Y*1000 + Z where X.Y.Z is the version number.
   *
   * @returns Version number (e.g., 3045000 for version 3.45.0)
   */
  _sqlite3_libversion_number: () => string;

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
   * This function closes the database and finalizes any prepared statements.
   * Use _sqlite3_close_v2 instead of _sqlite3_close for better resource cleanup.
   *
   * @param db - Database connection pointer
   * @returns SQLite result code (SQLITE_OK on success)
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
    callback: SQLite3BusyHandlerCallback,
    callbackArg: WasmPtr,
    errmsg: WasmPtr
  ) => SQLiteResultCode;

  /**
   * Prepare a SQL statement for execution
   *
   * Compiles SQL text into a prepared statement that can be executed multiple times.
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
   * @param prepFlags - Preparation flags (currently must be 0)
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
   * Note: The WebAssembly module uses JavaScript numbers instead of BigInt
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
   * For positional parameters (?), returns null.
   *
   * @param stmt - Prepared statement pointer
   * @param index - Parameter index (1-based)
   * @returns Pointer to parameter name or null if positional parameter
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
   * Note: The WebAssembly module returns this as a JavaScript number, not BigInt
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
   * Set a subtype on a function result
   *
   * Used for custom subtypes in extensions.
   *
   * @param context - Function context pointer
   * @param subtype - Subtype value
   */
  _sqlite3_result_subtype: (context: number, subtype: number) => void;

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
  _sqlite3_busy_handler: (db: number, callback: number, data: number) => number;

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
  _sqlite3_errcode: (db: number) => number;

  /**
   * Get the most recent extended error code for a database connection
   *
   * Provides more detailed error information than _sqlite3_errcode.
   *
   * @param db - Database connection pointer
   * @returns Extended SQLite result code
   */
  _sqlite3_extended_errcode: (db: number) => number;

  /**
   * Get the most recent error message for a database connection
   *
   * @param db - Database connection pointer
   * @returns Pointer to UTF-8 error message string
   */
  _sqlite3_errmsg: (db: number) => number;

  /**
   * Get an error message for a specific SQLite result code
   *
   * @param code - SQLite result code
   * @returns Pointer to UTF-8 error message string
   */
  _sqlite3_errstr: (code: number) => number;

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
   * @param n - Number of bytes to allocate
   * @returns Pointer to allocated memory, or null if allocation failed
   */
  _sqlite3_malloc: (n: number) => number;

  /**
   * Allocate 64-bit memory using SQLite's memory allocator
   *
   * Note: The WebAssembly module uses JavaScript numbers instead of BigInt
   *
   * @param n - Number of bytes to allocate (as JavaScript number)
   * @returns Pointer to allocated memory, or null if allocation failed
   */
  _sqlite3_malloc64: (n: number) => number;

  /**
   * Reallocate memory using SQLite's memory allocator
   *
   * @param old - Pointer to previously allocated memory
   * @param n - New size in bytes
   * @returns Pointer to reallocated memory, or null if reallocation failed
   */
  _sqlite3_realloc: (old: number, n: number) => number;

  /**
   * Reallocate 64-bit memory using SQLite's memory allocator
   *
   * Note: The WebAssembly module uses JavaScript numbers instead of BigInt
   *
   * @param old - Pointer to previously allocated memory
   * @param n - New size in bytes (as JavaScript number)
   * @returns Pointer to reallocated memory, or null if reallocation failed
   */
  _sqlite3_realloc64: (old: number, n: number) => number;

  /**
   * Free memory allocated with SQLite's memory allocator
   *
   * @param ptr - Pointer to memory to free
   */
  _sqlite3_free: (ptr: number) => void;

  /**
   * Get the size of a memory allocation
   *
   * @param ptr - Pointer to memory allocated with sqlite3_malloc
   * @returns Size of the memory allocation in bytes
   */
  _sqlite3_msize: (ptr: number) => number;

  // Virtual File System (VFS) Operations
  // ====================================

  /**
   * Find a Virtual File System by name
   *
   * @param zVfsName - Pointer to VFS name (or null for default)
   * @returns VFS pointer or null if not found
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
   * Serialize a database into memory
   *
   * @param db - Database connection pointer
   * @param zSchema - Pointer to schema name (main, temp, etc.)
   * @param piSize - Pointer to store the size of serialized database
   * @param mFlags - Serialization flags
   * @returns Pointer to serialized database data
   */
  _sqlite3_serialize: (
    db: number,
    zSchema: number,
    piSize: number,
    mFlags: number
  ) => number;

  /**
   * Deserialize a database from memory
   *
   * @param db - Database connection pointer
   * @param zSchema - Pointer to schema name (main, temp, etc.)
   * @param pData - Pointer to serialized database data
   * @param szData - Size of the data in bytes
   * @param szBuf - Size of the buffer
   * @param mFlags - Deserialization flags
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_deserialize: (
    db: number,
    zSchema: number,
    pData: number,
    szData: number,
    szBuf: number,
    mFlags: number
  ) => number; // Note: parameters are numbers, not bigints

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
   * @returns Pointer to parameter value, or null if not found
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
   * @returns Pointer to parameter name, or null if not found
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
  _sqlite3_sourceid: () => string;

  /**
   * Initialize SQLite library
   *
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_initialize: () => number;

  /**
   * Shutdown SQLite library
   *
   * @returns SQLite result code (SQLITE_OK on success)
   */
  _sqlite3_shutdown: () => number;

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
   * @returns Pointer to auxiliary data, or null if not found
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
   * @returns Pointer to compile option name
   */
  _sqlite3_compileoption_get: number; // This is actually a property, not a function

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
