# Script PowerShell pour installer manuellement le plugin Timecard
# Utilisation : .\scripts\Install-Plugin.ps1

param(
    [switch]$Force = $false
)

Write-Host "🔧 Installation manuelle du plugin Timecard..." -ForegroundColor Cyan

# Chemins
$PluginSource = Join-Path $PSScriptRoot ".." "com.laxe4k.timecard-plugin.sdPlugin"
$StreamDeckPlugins = Join-Path $env:APPDATA "Elgato" "StreamDeck" "Plugins"
$PluginDest = Join-Path $StreamDeckPlugins "com.laxe4k.timecard-plugin.sdPlugin"

Write-Host "📁 Source : $PluginSource" -ForegroundColor Gray
Write-Host "📁 Destination : $PluginDest" -ForegroundColor Gray

# Vérifier que le dossier source existe
if (-not (Test-Path $PluginSource)) {
    Write-Host "❌ Erreur : Le dossier source n'existe pas : $PluginSource" -ForegroundColor Red
    Write-Host "💡 Exécutez d'abord : npm run build" -ForegroundColor Yellow
    exit 1
}

# Vérifier si Stream Deck est en cours d'exécution
$StreamDeckProcess = Get-Process -Name "Stream Deck" -ErrorAction SilentlyContinue
if (-not $StreamDeckProcess) {
    $StreamDeckProcess = Get-Process -Name "StreamDeck" -ErrorAction SilentlyContinue
}
if ($StreamDeckProcess) {
    if ($Force) {
        Write-Host "🛑 Fermeture de Stream Deck (mode -Force)..." -ForegroundColor Yellow
        $StreamDeckProcess | Stop-Process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 3
    } else {
        Write-Host "⚠️ Stream Deck est en cours d'exécution." -ForegroundColor Yellow
        $response = Read-Host "Voulez-vous fermer Stream Deck automatiquement ? (o/n)"
        if ($response -eq "o" -or $response -eq "O") {
            Write-Host "🛑 Fermeture de Stream Deck..." -ForegroundColor Yellow
            $StreamDeckProcess | Stop-Process -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 3
        } else {
            Write-Host "❌ Installation annulée. Fermez Stream Deck manuellement." -ForegroundColor Red
            exit 1
        }
    }
}

# Créer le dossier plugins s'il n'existe pas
if (-not (Test-Path $StreamDeckPlugins)) {
    Write-Host "📁 Création du dossier plugins : $StreamDeckPlugins" -ForegroundColor Green
    New-Item -ItemType Directory -Path $StreamDeckPlugins -Force | Out-Null
}

# Supprimer l'ancienne installation
if (Test-Path $PluginDest) {
    Write-Host "🗑️ Suppression de l'ancienne installation..." -ForegroundColor Yellow
    Remove-Item -Path $PluginDest -Recurse -Force
}

# Copier le plugin
Write-Host "📋 Copie du plugin..." -ForegroundColor Green
try {
    Copy-Item -Path $PluginSource -Destination $PluginDest -Recurse -Force
    Write-Host "✅ Plugin installé avec succès !" -ForegroundColor Green
    Write-Host "📍 Installé dans : $PluginDest" -ForegroundColor Gray
    
    # Proposer de redémarrer Stream Deck
    Write-Host ""
    $restart = Read-Host "Voulez-vous redémarrer Stream Deck maintenant ? (o/n)"
    if ($restart -eq "o" -or $restart -eq "O") {
        Write-Host "🚀 Redémarrage de Stream Deck..." -ForegroundColor Cyan
        
        # Chercher Stream Deck dans les emplacements courants
        $StreamDeckPaths = @(
            "${env:ProgramFiles}\Elgato\StreamDeck\StreamDeck.exe",
            "${env:ProgramFiles(x86)}\Elgato\StreamDeck\StreamDeck.exe"
        )
        
        $StreamDeckExe = $StreamDeckPaths | Where-Object { Test-Path $_ } | Select-Object -First 1
        
        if ($StreamDeckExe) {
            Start-Process -FilePath $StreamDeckExe
            Write-Host "✅ Stream Deck redémarré !" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Impossible de trouver Stream Deck. Redémarrez-le manuellement." -ForegroundColor Yellow
        }
    } else {
        Write-Host "🔄 N'oubliez pas de redémarrer Stream Deck pour voir le plugin." -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Erreur lors de la copie : $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Solutions alternatives :" -ForegroundColor Yellow
    Write-Host "1. Exécutez PowerShell en tant qu'administrateur" -ForegroundColor White
    Write-Host "2. Copiez manuellement le dossier vers : $StreamDeckPlugins" -ForegroundColor White
    Write-Host "3. Vérifiez les permissions du dossier" -ForegroundColor White
    exit 1
}
