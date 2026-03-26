import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Script de diagnostic pour Stream Deck
// Vérifie l'environnement et la compatibilité du plugin

function checkStreamDeckInstallation() {
    console.log('🔍 Vérification de l\'installation Stream Deck...');
    
    const platform = os.platform();
    const username = os.userInfo().username;
    
    let streamDeckPath;
    let pluginsPath;
    
    if (platform === 'win32') {
        streamDeckPath = path.join('C:', 'Program Files', 'Elgato', 'StreamDeck');
        pluginsPath = path.join('C:', 'Users', username, 'AppData', 'Roaming', 'Elgato', 'StreamDeck', 'Plugins');
    } else if (platform === 'darwin') {
        streamDeckPath = '/Applications/Stream Deck.app';
        pluginsPath = path.join('/Users', username, 'Library', 'Application Support', 'com.elgato.StreamDeck', 'Plugins');
    } else {
        console.log('❌ Plateforme non supportée');
        return false;
    }
    
    console.log(`📍 Plateforme: ${platform}`);
    console.log(`👤 Utilisateur: ${username}`);
    console.log(`📁 Stream Deck: ${streamDeckPath}`);
    console.log(`📁 Plugins: ${pluginsPath}`);
    
    // Vérifier Stream Deck
    if (fs.existsSync(streamDeckPath)) {
        console.log('✅ Stream Deck trouvé');
    } else {
        console.log('❌ Stream Deck non trouvé');
        return false;
    }
    
    // Vérifier le dossier plugins
    if (fs.existsSync(pluginsPath)) {
        console.log('✅ Dossier plugins trouvé');
        
        // Lister les plugins existants
        try {
            const plugins = fs.readdirSync(pluginsPath);
            console.log(`📦 Plugins installés (${plugins.length}):`);
            plugins.forEach(plugin => {
                console.log(`  - ${plugin}`);
            });
        } catch (error) {
            console.log('⚠️ Impossible de lire le dossier plugins');
        }
    } else {
        console.log('⚠️ Dossier plugins non trouvé (sera créé)');
    }
    
    return true;
}

function checkPluginStructure() {
    console.log('\n🔍 Vérification de la structure du plugin...');
    
    const pluginDir = path.join(__dirname, '..', 'com.laxe4k.timecard-plugin.sdPlugin');
    const manifestPath = path.join(pluginDir, 'manifest.json');
    const pluginJsPath = path.join(pluginDir, 'bin', 'plugin.js');
    
    console.log(`📁 Plugin: ${pluginDir}`);
    
    if (!fs.existsSync(pluginDir)) {
        console.log('❌ Dossier plugin non trouvé');
        return false;
    }
    
    console.log('✅ Dossier plugin trouvé');
    
    // Vérifier manifest.json
    if (fs.existsSync(manifestPath)) {
        console.log('✅ manifest.json trouvé');
        try {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            console.log(`📋 Nom: ${manifest.Name}`);
            console.log(`🔢 Version: ${manifest.Version}`);
            console.log(`👨‍💻 Auteur: ${manifest.Author}`);
            console.log(`🆔 UUID: ${manifest.UUID}`);
            console.log(`📦 SDK Version: ${manifest.SDKVersion}`);
            
            if (manifest.Actions && manifest.Actions.length > 0) {
                console.log(`🎯 Actions: ${manifest.Actions.length}`);
                manifest.Actions.forEach(action => {
                    console.log(`  - ${action.Name} (${action.UUID})`);
                });
            }
        } catch (error) {
            console.log('❌ manifest.json invalide:', error.message);
            return false;
        }
    } else {
        console.log('❌ manifest.json non trouvé');
        return false;
    }
    
    // Vérifier plugin.js
    if (fs.existsSync(pluginJsPath)) {
        console.log('✅ plugin.js trouvé');
        const stats = fs.statSync(pluginJsPath);
        console.log(`📏 Taille: ${Math.round(stats.size / 1024)}KB`);
    } else {
        console.log('❌ plugin.js non trouvé');
        return false;
    }
    
    return true;
}

function checkPackageFile() {
    console.log('\n🔍 Vérification du package .streamDeckPlugin...');
    
    const packagePath = path.join(__dirname, '..', 'dist', 'com.laxe4k.timecard-plugin.streamDeckPlugin');
    
    if (fs.existsSync(packagePath)) {
        console.log('✅ Package .streamDeckPlugin trouvé');
        const stats = fs.statSync(packagePath);
        console.log(`📏 Taille: ${Math.round(stats.size / 1024)}KB`);
        console.log(`📅 Créé le: ${stats.mtime.toLocaleString()}`);
        return true;
    } else {
        console.log('❌ Package .streamDeckPlugin non trouvé');
        return false;
    }
}

function generateReport() {
    console.log('\n📊 RAPPORT DE DIAGNOSTIC');
    console.log('=' .repeat(50));
    
    const streamDeckOk = checkStreamDeckInstallation();
    const pluginOk = checkPluginStructure();
    const packageOk = checkPackageFile();
    
    console.log('\n📋 RÉSUMÉ:');
    console.log(`Stream Deck: ${streamDeckOk ? '✅' : '❌'}`);
    console.log(`Plugin: ${pluginOk ? '✅' : '❌'}`);
    console.log(`Package: ${packageOk ? '✅' : '❌'}`);
    
    if (streamDeckOk && pluginOk && packageOk) {
        console.log('\n🎉 Tout semble correct !');
        console.log('\n💡 Solutions à essayer:');
        console.log('1. Double-cliquez sur le fichier .streamDeckPlugin');
        console.log('2. Si ça ne marche pas, utilisez: npm run install:manual');
        console.log('3. Redémarrez Stream Deck après installation');
        console.log('4. Vérifiez que Stream Deck est à jour (version 6.5+)');
    } else {
        console.log('\n❌ Problèmes détectés. Veuillez corriger les erreurs ci-dessus.');
    }
}

generateReport();
