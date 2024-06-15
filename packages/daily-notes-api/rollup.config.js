import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

import pkg from "./package.json";

export default {
  input: "dist/mjs/index.js",
  output: {
    format: "cjs",
    
    file: "dist/bundled.cjs",
    sourcemap: "inline",
    name: pkg.name,
  },
  external: ["obsidian"],
  plugins: [
    resolve({
      browser: true,
    }),
    commonjs({
      include: "node_modules/**",
      sourceMap: "inline"
    }),
  ],
};
