/**
 * SQLite3 Constants and Definitions
 *
 * This file contains all SQLite constants used throughout the WebAssembly module.
 * These constants are used for configuration, error codes, data types, and various
 * SQLite operation flags.
 *
 * Based on SQLite C API version 3.45+ constants.
 */

// ============================================================================
// RESULT CODES (Primary and Extended)
// ============================================================================

/** Primary result codes */
export const SQLITE_OK = 0; /* Successful result */
export const SQLITE_ERROR = 1; /* Generic error */
export const SQLITE_INTERNAL = 2; /* Internal logic error */
export const SQLITE_PERM = 3; /* Access permission denied */
export const SQLITE_ABORT = 4; /* Callback routine requested an abort */
export const SQLITE_BUSY = 5; /* The database file is locked */
export const SQLITE_LOCKED = 6; /* A table in the database is locked */
export const SQLITE_NOMEM = 7; /* A malloc() failed */
export const SQLITE_READONLY = 8; /* Attempt to write a readonly database */
export const SQLITE_INTERRUPT = 9; /* Operation terminated by sqlite3_interrupt() */
export const SQLITE_IOERR = 10; /* Some kind of disk I/O error occurred */
export const SQLITE_CORRUPT = 11; /* The database disk image is malformed */
export const SQLITE_NOTFOUND = 12; /* Unknown opcode in sqlite3_file_control() */
export const SQLITE_FULL = 13; /* Insertion failed because database is full */
export const SQLITE_CANTOPEN = 14; /* Unable to open the database file */
export const SQLITE_PROTOCOL = 15; /* Database lock protocol error */
export const SQLITE_EMPTY = 16; /* (Internal) Database table is empty */
export const SQLITE_SCHEMA = 17; /* The database schema changed */
export const SQLITE_TOOBIG = 18; /* String or BLOB exceeds size limit */
export const SQLITE_CONSTRAINT = 19; /* Abort due to constraint violation */
export const SQLITE_MISMATCH = 20; /* Data type mismatch */
export const SQLITE_MISUSE = 21; /* Library used incorrectly */
export const SQLITE_NOLFS = 22; /* Uses OS features not supported on host */
export const SQLITE_AUTH = 23; /* Authorization denied */
export const SQLITE_FORMAT = 24; /* Not used */
export const SQLITE_RANGE = 25; /* 2nd parameter to sqlite3_bind out of range */
export const SQLITE_NOTADB = 26; /* File opened that is not a database file */
export const SQLITE_NOTICE = 27; /* Notifications from sqlite3_log() */
export const SQLITE_WARNING = 28; /* Warnings from sqlite3_log() */
export const SQLITE_ROW = 100; /* sqlite3_step() has another row ready */
export const SQLITE_DONE = 101; /* sqlite3_step() has finished executing */

// ============================================================================
// DATA TYPES
// ============================================================================

export const SQLITE_INTEGER = 1;
export const SQLITE_FLOAT = 2;
export const SQLITE_TEXT = 3;
export const SQLITE_BLOB = 4;
export const SQLITE_NULL = 5;

// ============================================================================
// OPEN FLAGS
// ============================================================================

export const SQLITE_OPEN_READONLY = 0x00000001; /* Ok for sqlite3_open_v2() */
export const SQLITE_OPEN_READWRITE = 0x00000002; /* Ok for sqlite3_open_v2() */
export const SQLITE_OPEN_CREATE = 0x00000004; /* Ok for sqlite3_open_v2() */
export const SQLITE_OPEN_DELETEONCLOSE = 0x00000008; /* VFS only */
export const SQLITE_OPEN_EXCLUSIVE = 0x00000010; /* VFS only */
export const SQLITE_OPEN_AUTOPROXY = 0x00000020; /* VFS only */
export const SQLITE_OPEN_URI = 0x00000040; /* Ok for sqlite3_open_v2() */
export const SQLITE_OPEN_MEMORY = 0x00000080; /* Ok for sqlite3_open_v2() */
export const SQLITE_OPEN_MAIN_DB = 0x00000100; /* VFS only */
export const SQLITE_OPEN_TEMP_DB = 0x00000200; /* VFS only */
export const SQLITE_OPEN_TRANSIENT_DB = 0x00000400; /* VFS only */
export const SQLITE_OPEN_MAIN_JOURNAL = 0x00000800; /* VFS only */
export const SQLITE_OPEN_TEMP_JOURNAL = 0x00001000; /* VFS only */
export const SQLITE_OPEN_SUBJOURNAL = 0x00002000; /* VFS only */
export const SQLITE_OPEN_SUPER_JOURNAL = 0x00004000; /* VFS only */
export const SQLITE_OPEN_NOMUTEX = 0x00008000; /* Ok for sqlite3_open_v2() */
export const SQLITE_OPEN_FULLMUTEX = 0x00010000; /* Ok for sqlite3_open_v2() */
export const SQLITE_OPEN_SHAREDCACHE = 0x00020000; /* Ok for sqlite3_open_v2() */
export const SQLITE_OPEN_PRIVATECACHE = 0x00040000; /* Ok for sqlite3_open_v2() */
export const SQLITE_OPEN_WAL = 0x00080000; /* VFS only */

// ============================================================================
// TEXT ENCODING
// ============================================================================

export const SQLITE_UTF8 = 1;
export const SQLITE_UTF16LE = 2;
export const SQLITE_UTF16BE = 3;
export const SQLITE_UTF16 = 4; /* Use native byte order */
export const SQLITE_ANY = 5; /* Deprecated */
export const SQLITE_UTF16_ALIGNED = 8; /* sqlite3_create_collation only */

// ============================================================================
// DESTRUCTOR CONSTANTS
// ============================================================================

/** Data is constant and will never change - no destructor needed */
export const SQLITE_STATIC = 0;

/** Data will be copied immediately - SQLite will make its own copy */
export const SQLITE_TRANSIENT = -1;

/**
 * No destructor callback (null function pointer)
 * Used for xDestroy parameters in function registration APIs
 */
export const SQLITE_NO_DESTRUCTOR = 0;

// ============================================================================
// PREPARE FLAGS
// ============================================================================

export const SQLITE_PREPARE_PERSISTENT = 0x01;
export const SQLITE_PREPARE_NORMALIZE = 0x02;
export const SQLITE_PREPARE_NO_VTAB = 0x04;

// ============================================================================
// CONFIGURATION OPTIONS
// ============================================================================

export const SQLITE_CONFIG_SINGLETHREAD = 1; /* nil */
export const SQLITE_CONFIG_MULTITHREAD = 2; /* nil */
export const SQLITE_CONFIG_SERIALIZED = 3; /* nil */
export const SQLITE_CONFIG_MALLOC = 4; /* sqlite3_mem_methods* */
export const SQLITE_CONFIG_GETMALLOC = 5; /* sqlite3_mem_methods* */
export const SQLITE_CONFIG_SCRATCH = 6; /* No longer used */
export const SQLITE_CONFIG_PAGECACHE = 7; /* void*, int sz, int N */
export const SQLITE_CONFIG_HEAP = 8; /* void*, int nByte, int min */
export const SQLITE_CONFIG_MEMSTATUS = 9; /* boolean */
export const SQLITE_CONFIG_MUTEX = 10; /* sqlite3_mutex_methods* */
export const SQLITE_CONFIG_GETMUTEX = 11; /* sqlite3_mutex_methods* */
export const SQLITE_CONFIG_LOOKASIDE = 13; /* int int */
export const SQLITE_CONFIG_PCACHE = 14; /* no-op */
export const SQLITE_CONFIG_GETPCACHE = 15; /* no-op */
export const SQLITE_CONFIG_LOG = 16; /* xFunc, void* */
export const SQLITE_CONFIG_URI = 17; /* int */
export const SQLITE_CONFIG_PCACHE2 = 18; /* sqlite3_pcache_methods2* */
export const SQLITE_CONFIG_GETPCACHE2 = 19; /* sqlite3_pcache_methods2* */
export const SQLITE_CONFIG_COVERING_INDEX_SCAN = 20; /* int */
export const SQLITE_CONFIG_SQLLOG = 21; /* xSqllog, void* */
export const SQLITE_CONFIG_MMAP_SIZE = 22; /* sqlite3_int64, sqlite3_int64 */
export const SQLITE_CONFIG_WIN32_HEAPSIZE = 23; /* int nByte */
export const SQLITE_CONFIG_PCACHE_HDRSZ = 24; /* int *psz */
export const SQLITE_CONFIG_PMASZ = 25; /* unsigned int szPma */
export const SQLITE_CONFIG_STMTJRNL_SPILL = 26; /* int nByte */
export const SQLITE_CONFIG_SMALL_MALLOC = 27; /* boolean */
export const SQLITE_CONFIG_SORTERREF_SIZE = 28; /* int nByte */
export const SQLITE_CONFIG_MEMDB_MAXSIZE = 29; /* sqlite3_int64 */

// ============================================================================
// DATABASE CONFIGURATION OPTIONS
// ============================================================================

export const SQLITE_DBCONFIG_MAINDBNAME = 1000; /* const char* */
export const SQLITE_DBCONFIG_LOOKASIDE = 1001; /* void* int int */
export const SQLITE_DBCONFIG_ENABLE_FKEY = 1002; /* int int* */
export const SQLITE_DBCONFIG_ENABLE_TRIGGER = 1003; /* int int* */
export const SQLITE_DBCONFIG_ENABLE_FTS3_TOKENIZER = 1004; /* int int* */
export const SQLITE_DBCONFIG_ENABLE_LOAD_EXTENSION = 1005; /* int int* */
export const SQLITE_DBCONFIG_NO_CKPT_ON_CLOSE = 1006; /* int int* */
export const SQLITE_DBCONFIG_ENABLE_QPSG = 1007; /* int int* */
export const SQLITE_DBCONFIG_TRIGGER_EQP = 1008; /* int int* */
export const SQLITE_DBCONFIG_RESET_DATABASE = 1009; /* int int* */
export const SQLITE_DBCONFIG_DEFENSIVE = 1010; /* int int* */
export const SQLITE_DBCONFIG_WRITABLE_SCHEMA = 1011; /* int int* */
export const SQLITE_DBCONFIG_LEGACY_ALTER_TABLE = 1012; /* int int* */
export const SQLITE_DBCONFIG_DQS_DML = 1013; /* int int* */
export const SQLITE_DBCONFIG_DQS_DDL = 1014; /* int int* */
export const SQLITE_DBCONFIG_ENABLE_VIEW = 1015; /* int int* */
export const SQLITE_DBCONFIG_LEGACY_FILE_FORMAT = 1016; /* int int* */
export const SQLITE_DBCONFIG_TRUSTED_SCHEMA = 1017; /* int int* */
export const SQLITE_DBCONFIG_MAX = 1017; /* Largest DBCONFIG */

// ============================================================================
// AUTHORIZER ACTION CODES
// ============================================================================

export const SQLITE_DENY = 1; /* Abort the SQL statement with an error */
export const SQLITE_IGNORE = 2; /* Don't allow access, but don't generate an error */

export const SQLITE_CREATE_INDEX = 1; /* Index Name      Table Name      */
export const SQLITE_CREATE_TABLE = 2; /* Table Name      NULL            */
export const SQLITE_CREATE_TEMP_INDEX = 3; /* Index Name      Table Name      */
export const SQLITE_CREATE_TEMP_TABLE = 4; /* Table Name      NULL            */
export const SQLITE_CREATE_TEMP_TRIGGER = 5; /* Trigger Name    Table Name      */
export const SQLITE_CREATE_TEMP_VIEW = 6; /* View Name       NULL            */
export const SQLITE_CREATE_TRIGGER = 7; /* Trigger Name    Table Name      */
export const SQLITE_CREATE_VIEW = 8; /* View Name       NULL            */
export const SQLITE_DELETE = 9; /* Table Name      NULL            */
export const SQLITE_DROP_INDEX = 10; /* Index Name      Table Name      */
export const SQLITE_DROP_TABLE = 11; /* Table Name      NULL            */
export const SQLITE_DROP_TEMP_INDEX = 12; /* Index Name      Table Name      */
export const SQLITE_DROP_TEMP_TABLE = 13; /* Table Name      NULL            */
export const SQLITE_DROP_TEMP_TRIGGER = 14; /* Trigger Name    Table Name      */
export const SQLITE_DROP_TEMP_VIEW = 15; /* View Name       NULL            */
export const SQLITE_DROP_TRIGGER = 16; /* Trigger Name    Table Name      */
export const SQLITE_DROP_VIEW = 17; /* View Name       NULL            */
export const SQLITE_INSERT = 18; /* Table Name      NULL            */
export const SQLITE_PRAGMA = 19; /* Pragma Name     1st arg or NULL */
export const SQLITE_READ = 20; /* Table Name      Column Name     */
export const SQLITE_SELECT = 21; /* NULL            NULL            */
export const SQLITE_TRANSACTION = 22; /* Operation       NULL            */
export const SQLITE_UPDATE = 23; /* Table Name      Column Name     */
export const SQLITE_ATTACH = 24; /* Filename        NULL            */
export const SQLITE_DETACH = 25; /* Database Name   NULL            */
export const SQLITE_ALTER_TABLE = 26; /* Database Name   Table Name      */
export const SQLITE_REINDEX = 27; /* Index Name      NULL            */
export const SQLITE_ANALYZE = 28; /* Table Name      NULL            */
export const SQLITE_CREATE_VTABLE = 29; /* Table Name      Module Name     */
export const SQLITE_DROP_VTABLE = 30; /* Table Name      Module Name     */
export const SQLITE_FUNCTION = 31; /* NULL            Function Name   */
export const SQLITE_SAVEPOINT = 32; /* Operation       Savepoint Name */
export const SQLITE_COPY = 0; /* No longer used */
export const SQLITE_RECURSIVE = 33; /* NULL            NULL            */

// ============================================================================
// LIMIT CATEGORIES
// ============================================================================

export const SQLITE_LIMIT_LENGTH = 0;
export const SQLITE_LIMIT_SQL_LENGTH = 1;
export const SQLITE_LIMIT_COLUMN = 2;
export const SQLITE_LIMIT_EXPR_DEPTH = 3;
export const SQLITE_LIMIT_COMPOUND_SELECT = 4;
export const SQLITE_LIMIT_VDBE_OP = 5;
export const SQLITE_LIMIT_FUNCTION_ARG = 6;
export const SQLITE_LIMIT_ATTACHED = 7;
export const SQLITE_LIMIT_LIKE_PATTERN_LENGTH = 8;
export const SQLITE_LIMIT_VARIABLE_NUMBER = 9;
export const SQLITE_LIMIT_TRIGGER_DEPTH = 10;
export const SQLITE_LIMIT_WORKER_THREADS = 11;

// ============================================================================
// STATUS PARAMETERS
// ============================================================================

export const SQLITE_STATUS_MEMORY_USED = 0;
export const SQLITE_STATUS_PAGECACHE_USED = 1;
export const SQLITE_STATUS_PAGECACHE_OVERFLOW = 2;
export const SQLITE_STATUS_SCRATCH_USED = 3; /* NOT USED */
export const SQLITE_STATUS_SCRATCH_OVERFLOW = 4; /* NOT USED */
export const SQLITE_STATUS_MALLOC_SIZE = 5;
export const SQLITE_STATUS_PARSER_STACK = 6;
export const SQLITE_STATUS_PAGECACHE_SIZE = 7;
export const SQLITE_STATUS_SCRATCH_SIZE = 8; /* NOT USED */
export const SQLITE_STATUS_MALLOC_COUNT = 9;

// ============================================================================
// DATABASE STATUS PARAMETERS
// ============================================================================

export const SQLITE_DBSTATUS_LOOKASIDE_USED = 0;
export const SQLITE_DBSTATUS_CACHE_USED = 1;
export const SQLITE_DBSTATUS_SCHEMA_USED = 2;
export const SQLITE_DBSTATUS_STMT_USED = 3;
export const SQLITE_DBSTATUS_LOOKASIDE_HIT = 4;
export const SQLITE_DBSTATUS_LOOKASIDE_MISS_SIZE = 5;
export const SQLITE_DBSTATUS_LOOKASIDE_MISS_FULL = 6;
export const SQLITE_DBSTATUS_CACHE_HIT = 7;
export const SQLITE_DBSTATUS_CACHE_MISS = 8;
export const SQLITE_DBSTATUS_CACHE_WRITE = 9;
export const SQLITE_DBSTATUS_DEFERRED_FKS = 10;
export const SQLITE_DBSTATUS_CACHE_USED_SHARED = 11;
export const SQLITE_DBSTATUS_CACHE_SPILL = 12;
export const SQLITE_DBSTATUS_MAX = 12;

// ============================================================================
// STATEMENT STATUS PARAMETERS
// ============================================================================

export const SQLITE_STMTSTATUS_FULLSCAN_STEP = 1;
export const SQLITE_STMTSTATUS_SORT = 2;
export const SQLITE_STMTSTATUS_AUTOINDEX = 3;
export const SQLITE_STMTSTATUS_VM_STEP = 4;
export const SQLITE_STMTSTATUS_REPREPARE = 5;
export const SQLITE_STMTSTATUS_RUN = 6;
export const SQLITE_STMTSTATUS_FILTER_MISS = 7;
export const SQLITE_STMTSTATUS_FILTER_HIT = 8;
export const SQLITE_STMTSTATUS_MEMUSED = 99;

// ============================================================================
// CHECKPOINT MODES
// ============================================================================

export const SQLITE_CHECKPOINT_PASSIVE = 0; /* Do as much as possible w/o blocking */
export const SQLITE_CHECKPOINT_FULL = 1; /* Wait for writers, then checkpoint */
export const SQLITE_CHECKPOINT_RESTART = 2; /* Like FULL but wait for readers */
export const SQLITE_CHECKPOINT_TRUNCATE = 3; /* Like RESTART but also truncate WAL */

// ============================================================================
// VIRTUAL TABLE CONFIGURATION OPTIONS
// ============================================================================

export const SQLITE_VTAB_CONSTRAINT_SUPPORT = 1;
export const SQLITE_VTAB_INNOCUOUS = 2;
export const SQLITE_VTAB_DIRECTONLY = 3;

// ============================================================================
// CONFLICT RESOLUTION MODES
// ============================================================================

export const SQLITE_ROLLBACK = 1;
export const SQLITE_FAIL = 3;
export const SQLITE_REPLACE = 5;

// ============================================================================
// TRACE EVENT CODES
// ============================================================================

export const SQLITE_TRACE_STMT = 0x01;
export const SQLITE_TRACE_PROFILE = 0x02;
export const SQLITE_TRACE_ROW = 0x04;
export const SQLITE_TRACE_CLOSE = 0x08;

// ============================================================================
// SYNCHRONOUS MODES
// ============================================================================

export const SQLITE_SYNC_OFF = 0;
export const SQLITE_SYNC_NORMAL = 1;
export const SQLITE_SYNC_FULL = 2;
export const SQLITE_SYNC_EXTRA = 3;

// ============================================================================
// JOURNAL MODES
// ============================================================================

export const SQLITE_JOURNALMODE_DELETE = 0; /* Commit by deleting journal file */
export const SQLITE_JOURNALMODE_PERSIST = 1; /* Commit by zeroing journal header */
export const SQLITE_JOURNALMODE_OFF = 2; /* Journal omitted.  */
export const SQLITE_JOURNALMODE_TRUNCATE = 3; /* Commit by truncating journal */
export const SQLITE_JOURNALMODE_MEMORY = 4; /* In-memory journal file */
export const SQLITE_JOURNALMODE_WAL = 5; /* Use write-ahead logging */

// ============================================================================
// EXPLAIN MODES
// ============================================================================

export const SQLITE_EXPLAIN_OFF = 0;
export const SQLITE_EXPLAIN_ON = 1;
export const SQLITE_EXPLAIN_QUERY_PLAN = 2;

// ============================================================================
// SERIALIZATION FLAGS
// ============================================================================

export const SQLITE_SERIALIZE_NOCOPY = 0x001; /* Do not copy the database */

// ============================================================================
// DESERIALIZE FLAGS
// ============================================================================

export const SQLITE_DESERIALIZE_FREEONCLOSE = 1; /* Call sqlite3_free() on close */
export const SQLITE_DESERIALIZE_RESIZEABLE = 2; /* Resize using sqlite3_realloc64() */
export const SQLITE_DESERIALIZE_READONLY = 4; /* Database is read-only */

// ============================================================================
// FILE CONTROL OPERATION CODES
// ============================================================================

export const SQLITE_FCNTL_LOCKSTATE = 1;
export const SQLITE_FCNTL_GET_LOCKPROXYFILE = 2;
export const SQLITE_FCNTL_SET_LOCKPROXYFILE = 3;
export const SQLITE_FCNTL_LAST_ERRNO = 4;
export const SQLITE_FCNTL_SIZE_HINT = 5;
export const SQLITE_FCNTL_CHUNK_SIZE = 6;
export const SQLITE_FCNTL_FILE_POINTER = 7;
export const SQLITE_FCNTL_SYNC_OMITTED = 8;
export const SQLITE_FCNTL_WIN32_AV_RETRY = 9;
export const SQLITE_FCNTL_PERSIST_WAL = 10;
export const SQLITE_FCNTL_OVERWRITE = 11;
export const SQLITE_FCNTL_VFSNAME = 12;
export const SQLITE_FCNTL_POWERSAFE_OVERWRITE = 13;
export const SQLITE_FCNTL_PRAGMA = 14;
export const SQLITE_FCNTL_BUSYHANDLER = 15;
export const SQLITE_FCNTL_TEMPFILENAME = 16;
export const SQLITE_FCNTL_MMAP_SIZE = 18;
export const SQLITE_FCNTL_TRACE = 19;
export const SQLITE_FCNTL_HAS_MOVED = 20;
export const SQLITE_FCNTL_SYNC = 21;
export const SQLITE_FCNTL_COMMIT_PHASETWO = 22;
export const SQLITE_FCNTL_WIN32_SET_HANDLE = 23;
export const SQLITE_FCNTL_WAL_BLOCK = 24;
export const SQLITE_FCNTL_ZIPVFS = 25;
export const SQLITE_FCNTL_RBU = 26;
export const SQLITE_FCNTL_VFS_POINTER = 27;
export const SQLITE_FCNTL_JOURNAL_POINTER = 28;
export const SQLITE_FCNTL_WIN32_GET_HANDLE = 29;
export const SQLITE_FCNTL_PDB = 30;
export const SQLITE_FCNTL_BEGIN_ATOMIC_WRITE = 31;
export const SQLITE_FCNTL_COMMIT_ATOMIC_WRITE = 32;
export const SQLITE_FCNTL_ROLLBACK_ATOMIC_WRITE = 33;
export const SQLITE_FCNTL_LOCK_TIMEOUT = 34;
export const SQLITE_FCNTL_DATA_VERSION = 35;
export const SQLITE_FCNTL_SIZE_LIMIT = 36;
export const SQLITE_FCNTL_CKPT_DONE = 37;
export const SQLITE_FCNTL_RESERVE_BYTES = 38;
export const SQLITE_FCNTL_CKPT_START = 39;
export const SQLITE_FCNTL_EXTERNAL_READER = 40;
export const SQLITE_FCNTL_CKSM_FILE = 41;
export const SQLITE_FCNTL_RESET_CACHE = 42;

// ============================================================================
// CHANGESET OPERATION CODES
// ============================================================================

export const SQLITE_CHANGESET_DATA = 1;
export const SQLITE_CHANGESET_NOTFOUND = 2;
export const SQLITE_CHANGESET_CONFLICT = 3;
export const SQLITE_CHANGESET_CONSTRAINT = 4;
export const SQLITE_CHANGESET_FOREIGN_KEY = 5;

// ============================================================================
// SESSION CONFIGURATION OPTIONS
// ============================================================================

export const SQLITE_SESSION_CONFIG_STRMSIZE = 1;

// ============================================================================
// CHANGEGROUP CONFIGURATION OPTIONS
// ============================================================================

export const SQLITE_CHANGESETSTART_INVERT = 0x0002;
export const SQLITE_CHANGESETAPPLY_NOSAVEPOINT = 0x0001;
export const SQLITE_CHANGESETAPPLY_INVERT = 0x0002;
export const SQLITE_CHANGESETAPPLY_IGNORENOOP = 0x0004;

/**
 * Helper function to check if a result code indicates success
 */
export function isSuccessResult(code: number): boolean {
  return code === SQLITE_OK || code === SQLITE_ROW || code === SQLITE_DONE;
}

/**
 * Helper function to check if a result code indicates an error
 */
export function isErrorResult(code: number): boolean {
  return !isSuccessResult(code);
}

/**
 * Get a human-readable description of a result code
 */
export function getResultCodeDescription(code: number): string {
  switch (code) {
    case SQLITE_OK:
      return "Operation successful";
    case SQLITE_ERROR:
      return "Generic error";
    case SQLITE_INTERNAL:
      return "Internal logic error";
    case SQLITE_PERM:
      return "Access permission denied";
    case SQLITE_ABORT:
      return "Callback routine requested an abort";
    case SQLITE_BUSY:
      return "The database file is locked";
    case SQLITE_LOCKED:
      return "A table in the database is locked";
    case SQLITE_NOMEM:
      return "A malloc() failed";
    case SQLITE_READONLY:
      return "Attempt to write a readonly database";
    case SQLITE_INTERRUPT:
      return "Operation terminated by sqlite3_interrupt()";
    case SQLITE_IOERR:
      return "Some kind of disk I/O error occurred";
    case SQLITE_CORRUPT:
      return "The database disk image is malformed";
    case SQLITE_NOTFOUND:
      return "Unknown opcode in sqlite3_file_control()";
    case SQLITE_FULL:
      return "Insertion failed because database is full";
    case SQLITE_CANTOPEN:
      return "Unable to open the database file";
    case SQLITE_PROTOCOL:
      return "Database lock protocol error";
    case SQLITE_EMPTY:
      return "Database table is empty";
    case SQLITE_SCHEMA:
      return "The database schema changed";
    case SQLITE_TOOBIG:
      return "String or BLOB exceeds size limit";
    case SQLITE_CONSTRAINT:
      return "Abort due to constraint violation";
    case SQLITE_MISMATCH:
      return "Data type mismatch";
    case SQLITE_MISUSE:
      return "Library used incorrectly";
    case SQLITE_NOLFS:
      return "Uses OS features not supported on host";
    case SQLITE_AUTH:
      return "Authorization denied";
    case SQLITE_FORMAT:
      return "Not used";
    case SQLITE_RANGE:
      return "2nd parameter to sqlite3_bind out of range";
    case SQLITE_NOTADB:
      return "File opened that is not a database file";
    case SQLITE_NOTICE:
      return "Notifications from sqlite3_log()";
    case SQLITE_WARNING:
      return "Warnings from sqlite3_log()";
    case SQLITE_ROW:
      return "sqlite3_step() has another row ready";
    case SQLITE_DONE:
      return "sqlite3_step() has finished executing";
    default:
      return `Unknown result code: ${code}`;
  }
}
