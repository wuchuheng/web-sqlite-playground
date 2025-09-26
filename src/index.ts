import wasmUrl from "./test.wasm?url";

/**
 * Demonstrates WebAssembly instantiation and function calling.
 * Loads the WASM module and calls the exported add function.
 */
export const hello = async () => {
  console.log("Hello, world!");

  // 1. Input handling
  const responsePromise = fetch(wasmUrl);
  const { instance } = await WebAssembly.instantiateStreaming(responsePromise);

  // 2. Core processing
  // Access the exported add function from the WASM instance
  const addFunction = instance.exports.add as (
    arg1: number,
    arg2: number
  ) => number;
  debugger;

  // Call the add function with example arguments
  const result = addFunction(5, 3);

  // 3. Output handling
  console.log(`WASM add(5, 3) = ${result}`);
  return result;
};
