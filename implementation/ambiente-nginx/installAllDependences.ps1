Get-ChildItem -Directory | Where-Object { $_.Name -like "container-servico-*" } | ForEach-Object {
    if (Test-Path "$($_.FullName)\package.json") {
        Write-Host "Executando npm install em $($_.Name)"
        Push-Location $_.FullName
        npm install
        Pop-Location
    }
}
