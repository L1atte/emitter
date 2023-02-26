/** @type {import('vite').UserConfig} */
import { defineConfig } from "vite";

export default defineConfig({
	build: {
		outDir: "lib",
		lib: {
      name: 'emitter',
      fileName: 'index',
			entry: "index.ts",
			formats: ["es", "cjs", "umd"],
		},
	},
});
