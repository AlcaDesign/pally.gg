const { build } = require('esbuild');

const entryFile = 'src/index.ts';

/** @type {import('esbuild').BuildOptions} */
const opts = {
	entryPoints: { pally: entryFile },
	bundle: true,
	outdir: 'dist',
	sourcemap: true,
	sourcesContent: false,
};

/** @type {import('esbuild').BuildOptions} */
const node = {
	entryPoints: { 'pally.node': entryFile },
	platform: 'node',
};
/** @type {import('esbuild').BuildOptions} */
const browser = {
	platform: 'browser',
	minify: true,
};
/** @type {import('esbuild').BuildOptions} */
const esm = {
	outExtension: { '.js': '.mjs' },
	format: 'esm',
};
/** @type {import('esbuild').BuildOptions} */
const cjs = {
	outExtension: { '.js': '.cjs' },
	format: 'cjs',
};
/** @type {import('esbuild').BuildOptions} */
const iife = {
	outExtension: { '.js': '.js' },
	format: 'iife',
	globalName: 'Pally',
};

// Node ESM
build({ ...opts, ...node,    ...esm  });
// Node CJS
build({ ...opts, ...node,    ...cjs  });
// Browser ESM
build({ ...opts, ...browser, ...esm  });
// Browser IIFE
build({ ...opts, ...browser, ...iife });