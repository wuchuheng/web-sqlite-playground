import wasmWorker from "./worker.ts?worker&inline";
/**
 * Demonstrates WebAssembly instantiation and function calling.
 * Loads the WASM module and calls the exported add function.
 */
export const init = async () => {
  const worker = new wasmWorker();
  worker.postMessage({ event: "start" });
};
