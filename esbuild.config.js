import esbuild from 'esbuild';

const isWatch = process.argv.includes("--watch");

const options = {
  entryPoints: ['src/extension/main.ts'],
  bundle: true,
  outfile: 'out/extension.js',
  platform: 'node',
  format: 'esm',
  external: ['vscode'],
  sourcemap: true,
};

if (isWatch) {
  // New API: use context() + watch()
  esbuild.context(options).then(ctx => {
    ctx.watch();
    console.log("Watching for changes...");
  });
} else {
  esbuild.build(options).catch(() => process.exit(1));
}
