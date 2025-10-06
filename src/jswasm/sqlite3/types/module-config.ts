/**
 * Configuration interface for SQLite3 WebAssembly module initialization
 *
 * This file contains the type definitions for configuring the SQLite3 WebAssembly
 * module during initialization. These options control various aspects of the
 * module's runtime behavior, memory management, and execution environment.
 */

/**
 * Configuration options for SQLite3 WebAssembly module initialization
 *
 * This interface defines the configuration options that can be passed when
 * initializing the SQLite3 WebAssembly module. These options control logging,
 * memory management, file system behavior, and various runtime settings.
 *
 * @example
 * ```typescript
 * const config: SQLite3InitModuleConfig = {
 *   print: console.log,
 *   printErr: console.error,
 *   wasmBinary: new ArrayBuffer(1024 * 1024), // 1MB WASM binary
 *   noExitRuntime: true,
 *   INITIAL_MEMORY: 16 * 1024 * 1024 // 16MB initial memory
 * };
 *
 * const sqlite3Module = await sqlite3InitModule(config);
 * ```
 */
declare interface SQLite3InitModuleConfig {
  /** Standard output function */
  print?: (text: string) => void;
  /** Error output function */
  printErr?: (text: string) => void;
  /** File location resolver */
  locateFile?: (path: string, prefix: string) => string;
  /** WASM binary data */
  wasmBinary?: ArrayBuffer;
  /** Custom WASM instantiation */
  instantiateWasm?: (
    imports: WebAssembly.ModuleImports,
    receiveInstance: (instance: WebAssembly.Instance) => void
  ) => WebAssembly.Instance | void;
  /** Prevent runtime exit */
  noExitRuntime?: boolean;
  /** Skip file system initialization */
  noFSInit?: boolean;
  /** Pre-execution functions */
  preRun?: Array<() => void>;
  /** Post-execution functions */
  postRun?: Array<() => void>;
  /** Memory initializer URL prefix */
  memoryInitializerPrefixURL?: string;
  /** Command line arguments */
  arguments?: string[];
  /** Program name */
  thisProgram?: string;
  /** WebAssembly memory */
  wasmMemory?: WebAssembly.Memory;
  /** Initial memory size */
  INITIAL_MEMORY?: number;
  /** Standard input function */
  stdin?: () => number | null;
  /** Standard output function */
  stdout?: (char: number) => void;
  /** Standard error function */
  stderr?: (char: number) => void;
}

export type { SQLite3InitModuleConfig };
