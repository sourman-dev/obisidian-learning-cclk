import esbuild from "esbuild";
import { builtinModules } from "module";

const production = process.env.NODE_ENV === "production";

const context = await esbuild.context({
  entryPoints: ["src/main.tsx"],
  bundle: true,
  external: [
    "obsidian",
    "electron",
    "@codemirror/*",
    "@lezer/*",
    ...builtinModules
  ],
  format: "cjs",
  target: "es2018",
  logLevel: "info",
  sourcemap: production ? false : "inline",
  treeShaking: true,
  outfile: "main.js",
  loader: {
    ".tsx": "tsx",
    ".ts": "ts"
  },
  jsx: "automatic",
  minify: production,
  drop: production ? ["console", "debugger"] : []
});

if (production) {
  await context.rebuild();
  await context.dispose();
  console.log("Build complete");
} else {
  await context.watch();
  console.log("Watching for changes...");
}
