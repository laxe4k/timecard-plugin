import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Script pour mettre à jour le plugin existant
// Reconstruction + remplacement du plugin installé

function getStreamDeckPluginsDir() {
    const platform = os.platform();
    const username = os.userInfo().username;
    
    if (platform === 'win32') {
        return path.join('C:', 'Users', username, 'AppData', 'Roaming', 'Elgato', 'StreamDeck', 'Plugins');
    } else if (platform === 'darwin') {
        return path.join('/Users', username, 'Library', 'Application Support', 'com.elgato.StreamDeck', 'Plugins');
    } else {
        throw new Error('Plateforme non supportée');
    }
}

function checkStreamDeckRunning() {
    try {
        if (os.platform() === 'win32') {
            import('child_process').then(({ execSync }) => {
                try {
                    const output = execSync('tasklist /FI "IMAGENAME eq Stream Deck.exe"', { encoding: 'utf8' });
                    return output.includes('Stream Deck.exe');
                } catch {
                    return false;
                }
            });
        }
        return false;
    } catch {
        return false;
    }
}

function copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
            copyDirectory(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

async function updatePlugin() {
    try {
        console.log('🔄 Mise à jour du plugin Timecard...');
        
        const pluginSource = path.join(__dirname, '..', 'com.laxe4k.timecard-plugin.sdPlugin');
        const pluginsDir = getStreamDeckPluginsDir();
        const pluginDest = path.join(pluginsDir, 'com.laxe4k.timecard-plugin.sdPlugin');
        
        console.log(`📁 Source : ${pluginSource}`);
        console.log(`📁 Destination : ${pluginDest}`);
        
        // Vérifier que le plugin source existe
        if (!fs.existsSync(pluginSource)) {
            console.log('❌ Plugin source non trouvé. Compilez d\'abord avec : npm run build');
            return false;
        }
        
        // Vérifier que le plugin est déjà installé
        if (!fs.existsSync(pluginDest)) {
            console.log('⚠️ Plugin non installé. Utilisez plutôt : npm run install:manual');
            return false;
        }
        
        // Vérification optionnelle de Stream Deck
        console.log('⚠️ Assurez-vous que Stream Deck est fermé pour une mise à jour propre.');
        
        // Sauvegarder la configuration utilisateur si elle existe
        const userSettingsPath = path.join(pluginDest, 'user-settings.json');
        let userSettings = null;
        
        if (fs.existsSync(userSettingsPath)) {
            try {
                userSettings = fs.readFileSync(userSettingsPath, 'utf8');
                console.log('💾 Sauvegarde des paramètres utilisateur...');
            } catch (error) {
                console.log('⚠️ Impossible de sauvegarder les paramètres utilisateur');
            }
        }
        
        // Supprimer l'ancienne version
        console.log('🗑️ Suppression de l\'ancienne version...');
        try {
            fs.rmSync(pluginDest, { recursive: true, force: true });
        } catch (error) {
            if (error.code === 'EBUSY') {
                console.log('❌ Impossible de supprimer : Stream Deck utilise le plugin');
                console.log('💡 Fermez Stream Deck complètement et réessayez');
                return false;
            }
            throw error;
        }
        
        // Attendre un peu pour que le système libère les ressources
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Copier la nouvelle version
        console.log('📋 Installation de la nouvelle version...');
        copyDirectory(pluginSource, pluginDest);
        
        // Restaurer les paramètres utilisateur
        if (userSettings) {
            try {
                fs.writeFileSync(userSettingsPath, userSettings);
                console.log('✅ Paramètres utilisateur restaurés');
            } catch (error) {
                console.log('⚠️ Impossible de restaurer les paramètres utilisateur');
            }
        }
        
        // Lire la version du manifest
        const manifestPath = path.join(pluginDest, 'manifest.json');
        let version = 'inconnue';
        try {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            version = manifest.Version;
        } catch (error) {
            console.log('⚠️ Impossible de lire la version du manifest');
        }
        
        console.log('✅ Plugin mis à jour avec succès !');
        console.log(`📍 Version : ${version}`);
        console.log(`📍 Installé dans : ${pluginDest}`);
        console.log('🔄 Redémarrez Stream Deck pour voir les changements.');
        
        return true;
        
    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour :', error.message);
        console.log('\n💡 Solutions :');
        console.log('1. Fermez Stream Deck complètement');
        console.log('2. Compilez le plugin : npm run build');
        console.log('3. Réessayez la mise à jour : npm run update');
        console.log('4. En dernier recours : npm run install:manual');
        return false;
    }
}

console.log('🔄 MISE À JOUR DU PLUGIN TIMECARD');
console.log('=' .repeat(40));
console.log('Cette commande met à jour un plugin déjà installé.');
console.log('Pour une première installation, utilisez : npm run install:manual');
console.log('');

updatePlugin().then(success => {
    if (success) {
        console.log('\n🎉 Mise à jour terminée !');
        console.log('💡 N\'oubliez pas de redémarrer Stream Deck.');
    } else {
        console.log('\n❌ Mise à jour échouée.');
        process.exit(1);
    }
});
