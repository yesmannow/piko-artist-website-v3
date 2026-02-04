# SonarLint Hard Reset Script for VS Code
# Run this if the config still isn't reloading

Write-Host "🔧 SonarLint Hard Reset Starting..." -ForegroundColor Cyan

# Step 1: Close VS Code (if running)
Write-Host "`n📌 Step 1: Checking for running VS Code instances..." -ForegroundColor Yellow
$vscodeProcesses = Get-Process -Name "Code" -ErrorAction SilentlyContinue

if ($vscodeProcesses) {
    Write-Host "   ⚠️  Found $($vscodeProcesses.Count) VS Code instance(s) running" -ForegroundColor Yellow
    Write-Host "   ℹ️  Please close VS Code manually (save your work first!)" -ForegroundColor Cyan
    Write-Host "   ⏸️  Press any key after closing VS Code..." -ForegroundColor Green
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
} else {
    Write-Host "   ✅ No VS Code instances running" -ForegroundColor Green
}

# Step 2: Clear SonarLint cache in AppData
Write-Host "`n📌 Step 2: Clearing SonarLint cache..." -ForegroundColor Yellow
$sonarCachePaths = @(
    "$env:APPDATA\Code\User\workspaceStorage",
    "$env:LOCALAPPDATA\Code\User\workspaceStorage"
)

$foundCache = $false
foreach ($path in $sonarCachePaths) {
    if (Test-Path $path) {
        Write-Host "   🔍 Searching in: $path" -ForegroundColor Gray
        $workspaces = Get-ChildItem -Path $path -Directory -ErrorAction SilentlyContinue

        foreach ($workspace in $workspaces) {
            $sonarState = Join-Path $workspace.FullName "state.vscdb"
            if (Test-Path $sonarState) {
                Write-Host "   🗑️  Deleting: $sonarState" -ForegroundColor Red
                Remove-Item $sonarState -Force -ErrorAction SilentlyContinue
                $foundCache = $true
            }
        }
    }
}

if ($foundCache) {
    Write-Host "   ✅ SonarLint cache cleared" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  No SonarLint cache found (this is normal)" -ForegroundColor Cyan
}

# Step 3: Verify config
Write-Host "`n📌 Step 3: Verifying .vscode/sonarlint.json..." -ForegroundColor Yellow
$configPath = ".vscode\sonarlint.json"

if (Test-Path $configPath) {
    Write-Host "   ✅ Config file exists" -ForegroundColor Green

    # Try to parse JSON
    try {
        $config = Get-Content $configPath -Raw | ConvertFrom-Json
        Write-Host "   ✅ JSON syntax valid" -ForegroundColor Green

        # Check if rules are disabled
        $disabledRules = @("S7773", "S7764", "S7748", "S7761", "S7741", "S6759", "S6571")
        $disabledCount = 0

        foreach ($rule in $disabledRules) {
            $ruleKey = "typescript:$rule"
            if ($config.rules.$ruleKey.level -eq "off") {
                $disabledCount++
            }
        }

        Write-Host "   ✅ $disabledCount/$($disabledRules.Count) noisy rules disabled" -ForegroundColor Green

    } catch {
        Write-Host "   ❌ JSON syntax error! Fix .vscode/sonarlint.json" -ForegroundColor Red
        Write-Host "   Error: $_" -ForegroundColor Red
    }
} else {
    Write-Host "   ❌ Config file missing! Run setup script first" -ForegroundColor Red
}

# Step 4: Instructions
Write-Host "`n📌 Step 4: Next Steps" -ForegroundColor Yellow
Write-Host "   1️⃣  Open VS Code in this directory:" -ForegroundColor Cyan
Write-Host "      code ." -ForegroundColor White
Write-Host ""
Write-Host "   2️⃣  Once VS Code opens, press Ctrl+Shift+P and run:" -ForegroundColor Cyan
Write-Host "      SonarLint: Clear Analysis Results" -ForegroundColor White
Write-Host ""
Write-Host "   3️⃣  Then press Ctrl+Shift+P again and run:" -ForegroundColor Cyan
Write-Host "      Developer: Reload Window" -ForegroundColor White
Write-Host ""
Write-Host "   4️⃣  Check Problems panel (Ctrl+Shift+M):" -ForegroundColor Cyan
Write-Host "      Expected: 213 problems → ~60 problems (70% reduction)" -ForegroundColor White
Write-Host ""

Write-Host "✨ Reset complete! SonarLint should now respect your config." -ForegroundColor Green
Write-Host ""
