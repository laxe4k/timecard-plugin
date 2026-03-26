import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import path from "node:path";
import url from "node:url";

const isWatching = !!process.env.ROLLUP_WATCH;
const isProduction = process.env.NODE_ENV === 'production';
const sdPlugin = "com.laxe4k.timecard-plugin.sdPlugin";

/**
 * @type {import('rollup').RollupOptions}
 */
const config = {
	input: "src/plugin.ts",
	external: [/^@napi-rs\/canvas/, "fs", "path"],
	output: {
		file: `${sdPlugin}/bin/plugin.js`,
		sourcemap: isWatching,
		sourcemapPathTransform: (relativeSourcePath, sourcemapPath) => {
			return url.pathToFileURL(path.resolve(path.dirname(sourcemapPath), relativeSourcePath)).href;
		}
	},
	plugins: [
		{
			name: "watch-externals",
			buildStart: function () {
				this.addWatchFile(`${sdPlugin}/manifest.json`);
			},
		},
		typescript({
			mapRoot: isWatching ? "./" : undefined,
			// Production optimizations
			...(isProduction && {
				compilerOptions: {
					removeComments: true,
					declaration: false
				}
			})
		}),
		nodeResolve({
			browser: false,
			exportConditions: ["node"],
			preferBuiltins: true
		}),
		commonjs(),
		// Always minify for production, optionally for development
		(isProduction || !isWatching) && terser({
			compress: {
				drop_console: isProduction, // Remove console.log in production
				drop_debugger: true,
				pure_funcs: isProduction ? ['console.log', 'console.info'] : []
			},
			mangle: isProduction,
			format: {
				comments: false
			}
		}),
		{
			name: "emit-module-package-file",
			generateBundle() {
				this.emitFile({ fileName: "package.json", source: `{ "type": "module" }`, type: "asset" });
			}
		},
	].filter(Boolean) // Remove false values
};

export default config;
