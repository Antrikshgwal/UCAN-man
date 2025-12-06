import esbuild from "esbuild";

esbuild.build({
  entryPoints: ["src/webview/app.ts"],
  bundle: true,
  outfile: "dist/webview.js",
  platform: "browser",
  format: "iife",
  sourcemap: true,
}).catch(() => process.exit(1));
