import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
  ],

  // Worker configuration for module support
  worker: {
    format: "es", // Use ES modules format for workers
    plugins: () => [
      // Apply the same plugins to workers
      dts({
        insertTypesEntry: true,
      }),
    ],
  },

  build: {
    // Automatically clean the output directory before build
    emptyOutDir: true,
    lib: {
      // Entry point of your library
      entry: "src/index.ts",
      formats: ["es"],
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      // Externalize dependencies that shouldn't be bundled
      // Add any peer dependencies here
      external: [],
    },
    // Generate sourcemaps for better debugging
    // Target modern browsers
    target: "esnext",
  },
});
