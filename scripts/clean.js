// Clean script for production build
import { rmSync, existsSync } from 'fs';
import path from 'path';

console.log('🧹 Cleaning build artifacts...');

const cleanPaths = [
    'com.laxe4k.timecard-plugin.sdPlugin/bin/plugin.js',
    'com.laxe4k.timecard-plugin.sdPlugin/bin/plugin.js.map',
    'com.laxe4k.timecard-plugin.sdPlugin/bin/package.json',
    'com.laxe4k.timecard-plugin.sdPlugin/logs',
    'dist'
];

cleanPaths.forEach(cleanPath => {
    if (existsSync(cleanPath)) {
        rmSync(cleanPath, { recursive: true, force: true });
        console.log(`   ✅ Removed: ${cleanPath}`);
    }
});

console.log('✨ Clean completed!');
