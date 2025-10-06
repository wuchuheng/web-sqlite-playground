# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is `@wuchuheng/web-sqlite`, a TypeScript library that provides SQLite3 database functionality in web browsers using WebAssembly and OPFS (Origin Private File System). The library enables client-side SQL database operations with persistent storage.

## Development Commands

### Building and Development

-   `pnpm build` - Compile TypeScript and build the library with Vite
-   `pnpm dev` - Start Vite development server
-   `pnpm dev:watch` - Watch TypeScript compilation and Vite build simultaneously
-   `pnpm preview` - Preview the built library

### Testing and Examples

-   `pnpm test:api` - Run API tests on port 8080
-   `pnpm test:opfs-api` - Run OPFS API tests on port 8082
-   `pnpm examples:demo1` - Run demo1 example
-   `pnpm examples:simple-demo` - Run simple demo example
-   `pnpm tmp` - Development server for src/ directory

### Publishing

-   `pnpm release` - Publish to npm registry

## Architecture

### Core Components

**Main Entry Point (`src/index.ts`)**

-   Exports `init()` function that creates a Web Worker for SQLite operations
-   Uses Vite's worker inline loading to embed the worker in the bundle

**Web Worker (`src/worker.ts`)**

-   Loads SQLite3 WASM module (`src/jswasm/sqlite3.wasm`)
-   Provides WASM import bindings for Emscripten compatibility
-   Handles system calls and file operations required by SQLite
-   Logs available exported functions from the WASM module

**WASM Resources (`src/jswasm/`)**

-   `sqlite3.wasm` - The SQLite3 WebAssembly binary
-   `sqlite3/index.mjs` - JavaScript module for WASM initialization
-   `sqlite3/index.d.ts` - TypeScript definitions for SQLite3 module
-   `sqlite3-opfs-async-proxy.js` - OPFS async operations proxy

### Development Server

-   Custom HTTP server (`scripts/http-server.ts`) with SharedArrayBuffer headers
-   Essential for OPFS functionality - sets `Cross-Origin-Embedder-Policy: require-corp` and `Cross-Origin-Opener-Policy: same-origin`
-   Serves examples and tests with proper MIME types for WASM files

### Build Configuration

-   Uses Vite with DTS plugin for TypeScript declaration generation
-   Builds ES module format library
-   Supports worker plugins for consistent build process
-   Targets modern browsers with ESNext

## Key Technical Details

### WebAssembly Integration

The worker.ts file implements comprehensive WASM import bindings including:

-   System call stubs (`__syscall_*` functions)
-   Emscripten runtime functions (`emscripten_*`)
-   File descriptor operations (`fd_*`)
-   Environment and memory management

### OPFS Requirements

Examples and tests must be served with specific CORS headers for SharedArrayBuffer support. The custom HTTP server handles this automatically.

### Module Structure

-   ES modules throughout (`"type": "module"` in package.json)
-   TypeScript with strict mode and modern target (ES2022)
-   Vite-based build system with worker support

## File Structure Patterns

-   Library code in `src/`
-   Examples in `examples/` (HTML + JS modules)
-   Tests in `tests/` (browser-based testing)
-   Build tooling in `scripts/`
-   WASM binaries and JavaScript bindings in `src/jswasm/`

## Development Notes

-   The library is designed to work in browsers with OPFS support
-   Workers are inlined during build for better distribution
-   All database operations happen in the worker thread
-   The main thread only handles initialization and communication
