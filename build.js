const esbuild = require('esbuild');
const isWatch = process.argv.includes('--watch');

const buildOpts = {
  entryPoints: ['src/main.js'],
  bundle: true,
  outfile: 'dist/bundle.js',
  format: 'iife',
  target: ['es2018'],
  minify: !isWatch,
  sourcemap: isWatch,
  // 全局暴露函数（供 HTML onclick 调用）
  globalName: 'CatTreasure',
  footer: {
    js: '// Expose globals for HTML onclick\nif(typeof window!=="undefined"){Object.assign(window,CatTreasure);}'
  }
};

if (isWatch) {
  esbuild.context(buildOpts).then(ctx => ctx.watch());
  console.log('👀 Watching for changes...');
} else {
  esbuild.buildSync(buildOpts);
  console.log('✅ Build complete: dist/bundle.js');
}
