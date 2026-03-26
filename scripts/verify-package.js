import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Script de vérification et réparation du package Stream Deck
// Corrige les problèmes courants qui empêchent l'installation

function verifyAndFixPackage() {
    console.log('🔍 Vérification et réparation du package...');
    
    const distDir = path.join(__dirname, '..', 'dist');
    const packagePath = path.join(distDir, 'com.laxe4k.timecard-plugin.streamDeckPlugin');
    const sdPluginDir = path.join(__dirname, '..', 'com.laxe4k.timecard-plugin.sdPlugin');
    const tempDir = path.join(distDir, 'temp_package');
    
    let fixed = false;
    
    try {
        // 1. Vérifier que le plugin source existe et est valide
        console.log('📋 Vérification du plugin source...');
        
        if (!fs.existsSync(sdPluginDir)) {
            console.log('❌ Dossier plugin source non trouvé');
            return false;
        }
        
        const manifestPath = path.join(sdPluginDir, 'manifest.json');
        if (!fs.existsSync(manifestPath)) {
            console.log('❌ manifest.json manquant');
            return false;
        }
        
        // Vérifier la validité du manifest
        let manifest;
        try {
            manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        } catch (error) {
            console.log('❌ manifest.json invalide:', error.message);
            return false;
        }
        
        console.log('✅ Plugin source valide');
        
        // 2. Vérifier le package existant
        if (fs.existsSync(packagePath)) {
            console.log('📦 Vérification du package existant...');
            
            const stats = fs.statSync(packagePath);
            console.log(`📏 Taille actuelle: ${Math.round(stats.size / 1024)}KB`);
            
            // Taille minimum attendue (environ 50KB pour un plugin basique)
            if (stats.size < 10000) {
                console.log('⚠️ Package trop petit, recréation nécessaire');
                fixed = true;
            } else {
                console.log('✅ Taille du package OK');
            }
        } else {
            console.log('📦 Package non trouvé, création nécessaire');
            fixed = true;
        }
        
        // 3. Recréer le package si nécessaire
        if (fixed || !fs.existsSync(packagePath)) {
            console.log('🔧 Recréation du package...');
            
            // Nettoyer le dossier temporaire
            if (fs.existsSync(tempDir)) {
                fs.rmSync(tempDir, { recursive: true, force: true });
            }
            
            // Supprimer l'ancien package
            if (fs.existsSync(packagePath)) {
                fs.unlinkSync(packagePath);
            }
            
            // Exécuter le script de packaging
            console.log('🏗️ Exécution du packaging...');
            execSync('npm run package', { 
                cwd: path.join(__dirname, '..'),
                stdio: 'inherit'
            });
            
            console.log('✅ Package recréé');
            fixed = true;
        }
        
        // 4. Vérification finale
        if (fs.existsSync(packagePath)) {
            const finalStats = fs.statSync(packagePath);
            console.log(`📏 Taille finale: ${Math.round(finalStats.size / 1024)}KB`);
            console.log('✅ Package vérifié et prêt');
            
            // 5. Créer des alternatives d'installation
            console.log('📋 Création des alternatives d\'installation...');
            createInstallationAlternatives(distDir, packagePath);
            
            return true;
        } else {
            console.log('❌ Échec de la création du package');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Erreur lors de la vérification:', error.message);
        return false;
    }
}

function createInstallationAlternatives(distDir, packagePath) {
    // Créer un fichier ZIP normal pour test
    const zipPath = path.join(distDir, 'com.laxe4k.timecard-plugin.zip');
    
    try {
        if (fs.existsSync(packagePath)) {
            fs.copyFileSync(packagePath, zipPath);
            console.log(`✅ Copie ZIP créée: ${zipPath}`);
        }
    } catch (error) {
        console.log('⚠️ Impossible de créer la copie ZIP:', error.message);
    }
    
    // Mettre à jour le guide d'installation
    const installGuide = `# 🚀 Guide d'Installation - Plugin Timecard

## 📦 Fichiers Disponibles

- \`com.laxe4k.timecard-plugin.streamDeckPlugin\` - Package principal
- \`com.laxe4k.timecard-plugin.zip\` - Version ZIP (si le principal ne fonctionne pas)
- \`com.laxe4k.timecard-plugin.sdPlugin/\` - Dossier pour installation manuelle

## 🔧 Méthodes d'Installation

### Méthode 1 : Double-clic (Recommandée)
1. Double-cliquez sur \`com.laxe4k.timecard-plugin.streamDeckPlugin\`
2. Stream Deck devrait s'ouvrir et installer le plugin automatiquement

### Méthode 2 : Glisser-déposer
1. Ouvrez Stream Deck
2. Glissez le fichier \`.streamDeckPlugin\` dans la fenêtre Stream Deck

### Méthode 3 : Installation manuelle
\`\`\`bash
npm run install:manual
\`\`\`

### Méthode 4 : PowerShell (Windows)
\`\`\`powershell
.\\scripts\\Install-Plugin.ps1
\`\`\`

## 🔍 En cas de problème

1. **Exécutez le diagnostic :**
   \`\`\`bash
   npm run diagnostic
   \`\`\`

2. **Vérifiez et réparez le package :**
   \`\`\`bash
   npm run verify:package
   \`\`\`

3. **Essayez la version ZIP :**
   - Renommez \`.zip\` en \`.streamDeckPlugin\`
   - Double-cliquez dessus

## ✅ Après Installation

1. Redémarrez Stream Deck
2. Le plugin "Timecard Plugin" devrait apparaître dans la liste
3. Glissez l'action "Timecard Display" sur un bouton
4. Configurez le fuseau horaire et le pays

---
Généré automatiquement le ${new Date().toLocaleString()}`;

    const guidePath = path.join(distDir, 'GUIDE_INSTALLATION.md');
    fs.writeFileSync(guidePath, installGuide);
    console.log(`✅ Guide d'installation créé: ${guidePath}`);
}

// Ajouter le script au package.json s'il n'y est pas
function updatePackageJson() {
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    if (!packageJson.scripts['verify:package']) {
        packageJson.scripts['verify:package'] = 'node scripts/verify-package.js';
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 4));
        console.log('✅ Script verify:package ajouté à package.json');
    }
}

console.log('🔧 Vérification et réparation du package Stream Deck');
console.log('=' .repeat(50));

const success = verifyAndFixPackage();
updatePackageJson();

if (success) {
    console.log('\n🎉 Package vérifié et prêt pour installation !');
    console.log('\n💡 Méthodes d\'installation disponibles :');
    console.log('1. Double-clic sur le fichier .streamDeckPlugin');
    console.log('2. npm run install:manual');
    console.log('3. .\\scripts\\Install-Plugin.ps1 (PowerShell)');
    console.log('4. Installation manuelle via le dossier .sdPlugin');
} else {
    console.log('\n❌ Problèmes détectés. Consultez les erreurs ci-dessus.');
    process.exit(1);
}
