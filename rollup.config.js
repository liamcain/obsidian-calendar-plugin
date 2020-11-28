import svelte from "rollup-plugin-svelte";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import autoPreprocess from "svelte-preprocess";

export default {
  input: "src/main.ts",
  output: {
    format: "cjs",
    file: "main.js",
    exports: "default",
  },
  external: ["obsidian", "fs", "os", "path"],
  plugins: [
    svelte({
      preprocess: autoPreprocess(),
    }),
    typescript(),
    resolve({
      browser: true,
      dedupe: ["svelte"],
    }),
    commonjs({
      include: "node_modules/**",
    }),
  ],
};
