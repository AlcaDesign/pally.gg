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

const node = {
	entryPoints: { 'pally.node': entryFile },
	platform: 'node',
};
const browser = {
	platform: 'browser',
	minify: true,
};
const esm = {
	outExtension: { '.js': '.mjs' },
	format: 'esm',
};
const cjs = {
	outExtension: { '.js': '.cjs' },
	format: 'cjs',
};
const iife = {
	outExtension: { '.js': '.js' },
	format: 'iife',
};

// Node ESM
build({ ...opts, ...node,    ...esm  });
// Node CJS
build({ ...opts, ...node,    ...cjs  });
// Browser ESM
build({ ...opts, ...browser, ...esm  });
// Browser IIFE
build({ ...opts, ...browser, ...iife });