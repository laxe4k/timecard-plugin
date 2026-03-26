// Package script for production distribution
import { mkdirSync, existsSync, writeFileSync, readFileSync, rmSync, readdirSync, statSync, copyFileSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

// Recursive copy that works with .node binaries (cpSync crashes on them)
function copyDirRecursive(src, dest, filter) {
    mkdirSync(dest, { recursive: true });
    for (const entry of readdirSync(src)) {
        const srcPath = path.join(src, entry);
        const destPath = path.join(dest, entry);
        if (filter && !filter(srcPath, destPath)) continue;
        if (statSync(srcPath).isDirectory()) {
            copyDirRecursive(srcPath, destPath, filter);
        } else {
            copyFileSync(srcPath, destPath);
        }
    }
}

console.log('📦 Creating production package...');

const distDir = 'dist';
const pluginDir = 'com.laxe4k.timecard-plugin.sdPlugin';
const tempPluginDir = path.join(distDir, 'temp-plugin');

// Create dist directory
if (!existsSync(distDir)) {
    mkdirSync(distDir, { recursive: true });
}

// Clean temp directory if exists
if (existsSync(tempPluginDir)) {
    rmSync(tempPluginDir, { recursive: true, force: true });
}

// Copy plugin files to temp directory
console.log('   📁 Copying plugin files...');
copyDirRecursive(pluginDir, tempPluginDir, (src) => {
    if (src.includes('/logs/') || src.includes('\\logs\\')) return false;
    if (src.endsWith('.log')) return false;
    if (src.endsWith('.map')) return false;
    return true;
});

// Create version info
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const manifest = JSON.parse(readFileSync(path.join(pluginDir, 'manifest.json'), 'utf8'));

const versionInfo = {
    name: packageJson.name,
    version: packageJson.version,
    description: packageJson.description,
    author: packageJson.author,
    buildDate: new Date().toISOString(),
    streamDeckVersion: manifest.SDKVersion,
    minSoftwareVersion: manifest.Software.MinimumVersion
};

writeFileSync(
    path.join(tempPluginDir, 'build-info.json'), 
    JSON.stringify(versionInfo, null, 2)
);

// Create .streamDeckPlugin FILE (ZIP archive)
const pluginFileName = `com.laxe4k.timecard-plugin.streamDeckPlugin`;
const tempZipFile = path.join(distDir, 'temp-plugin.zip');
const pluginFilePath = path.join(distDir, pluginFileName);

console.log('   🗜️  Creating .streamDeckPlugin file...');

try {
    // Remove existing files if they exist
    if (existsSync(pluginFilePath)) {
        rmSync(pluginFilePath, { force: true });
    }
    if (existsSync(tempZipFile)) {
        rmSync(tempZipFile, { force: true });
    }

    // Create ZIP file first - use different approach for better compatibility
    const zipCommand = `powershell "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory('${tempPluginDir}', '${tempZipFile}')"`;
    execSync(zipCommand, { stdio: 'pipe' });
    
    // Rename ZIP to .streamDeckPlugin
    const renameCommand = `move "${tempZipFile}" "${pluginFilePath}"`;
    execSync(renameCommand, { stdio: 'pipe' });
    
    console.log(`   ✅ Created: ${pluginFileName}`);
    
    // Verify the file was created correctly
    if (existsSync(pluginFilePath)) {
        const stats = readFileSync(pluginFilePath);
        console.log(`   📊 File size: ${Math.round(stats.length / 1024)}KB`);
        
        // Check if it's a valid ZIP by trying to read it
        try {
            const testCommand = `powershell "Add-Type -AssemblyName System.IO.Compression.FileSystem; $zip = [System.IO.Compression.ZipFile]::OpenRead('${pluginFilePath}'); $zip.Entries.Count; $zip.Dispose()"`;
            const entryCount = execSync(testCommand, { stdio: 'pipe', encoding: 'utf8' }).trim();
            console.log(`   📁 ZIP entries: ${entryCount} files`);
        } catch (zipTestError) {
            console.log(`   ⚠️  ZIP validation failed: ${zipTestError.message}`);
        }
    }
    
} catch (error) {
    console.error('   ❌ Failed to create .streamDeckPlugin file:', error.message);
    console.log('   💡 Try manually: Create ZIP of plugin folder and rename to .streamDeckPlugin');
    
    // Fallback: copy the folder for manual installation
    const fallbackDir = path.join(distDir, 'manual-install');
    if (existsSync(fallbackDir)) {
        rmSync(fallbackDir, { recursive: true, force: true });
    }
    cpSync(tempPluginDir, fallbackDir, { recursive: true });
    console.log(`   📁 Created fallback folder: ${fallbackDir}`);
}

// Create installation readme
const installReadme = `# Timecard Plugin — Installation

## Méthode 1 : Installation directe (recommandée)
1. Double-cliquer sur le fichier \`${pluginFileName}\`
2. Stream Deck installe automatiquement le plugin

## Méthode 2 : Installation manuelle
1. Renommer le fichier en \`.zip\`
2. Extraire l'archive
3. Copier le dossier extrait dans le répertoire plugins :
   - **Windows** : \`%APPDATA%\\Elgato\\StreamDeck\\Plugins\\\`
   - **macOS** : \`~/Library/Application Support/com.elgato.StreamDeck/Plugins/\`

## Utilisation

1. Ajouter l'action **Timecard Display** sur une touche
2. Choisir un préset (BE, CA, CH, FR) ou configurer un fuseau horaire personnalisé
3. L'image se met à jour automatiquement chaque seconde

## Informations

- **Version** : ${versionInfo.version}
- **Auteur** : ${versionInfo.author}
`;

writeFileSync(path.join(distDir, 'INSTALLATION.md'), installReadme);

// Clean up temp directory
rmSync(tempPluginDir, { recursive: true, force: true });

console.log(`✅ Production package created in: ${distDir}/`);
console.log('');
console.log('📋 Distribution contents:');
console.log(`   - ${pluginFileName} (Ready to install - DOUBLE-CLICK THIS FILE)`);
console.log(`   - INSTALLATION.md (Installation instructions)`);

console.log('');
console.log('🚀 Ready for distribution!');
