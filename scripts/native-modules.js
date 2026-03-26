/**
 * Copies @napi-rs/canvas native modules into the plugin's bin directory
 * so they are available at runtime alongside plugin.js.
 * Uses recursive file-by-file copy to avoid cpSync crash on .node binaries.
 */
import { mkdirSync, readdirSync, rmSync, existsSync, copyFileSync, statSync } from "node:fs";
import { resolve, join } from "node:path";

function copyDirRecursive(src, dest) {
	mkdirSync(dest, { recursive: true });
	for (const entry of readdirSync(src)) {
		const srcPath = join(src, entry);
		const destPath = join(dest, entry);
		if (statSync(srcPath).isDirectory()) {
			copyDirRecursive(srcPath, destPath);
		} else {
			copyFileSync(srcPath, destPath);
		}
	}
}

const sdPlugin = "com.laxe4k.timecard-plugin.sdPlugin";
const dest = resolve(sdPlugin, "bin", "node_modules", "@napi-rs");

// Clean and recreate destination
if (existsSync(dest)) {
	rmSync(dest, { recursive: true, force: true });
}

// Copy @napi-rs/canvas
const canvasSrc = resolve("node_modules", "@napi-rs", "canvas");
copyDirRecursive(canvasSrc, join(dest, "canvas"));
console.log("Copied @napi-rs/canvas");

// Copy platform-specific binary packages (e.g. canvas-win32-x64-msvc)
const napiDir = resolve("node_modules", "@napi-rs");
for (const entry of readdirSync(napiDir)) {
	if (entry.startsWith("canvas-")) {
		copyDirRecursive(join(napiDir, entry), join(dest, entry));
		console.log(`Copied @napi-rs/${entry}`);
	}
}

console.log("Native modules copied successfully.");
