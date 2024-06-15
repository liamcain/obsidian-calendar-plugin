import svelte from "rollup-plugin-svelte";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import autoPreprocess from "svelte-preprocess";

import pkg from "./package.json";

export default {
  input: "src/index.ts",
  output: [
    { file: pkg.module, format: "es", name: "obsidian-calendar-ui" },
    { file: pkg.main, format: "umd", name: "obsidian-calendar-ui" },
  ],
  plugins: [
    svelte({
      emitCss: false,
      preprocess: autoPreprocess(),
    }),
    typescript(),
    resolve({
      browser: true,
      dedupe: ["svelte"],
    }),
    commonjs({
      include: /node_modules/,
    }),
  ],
};
