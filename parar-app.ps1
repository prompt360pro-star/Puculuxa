Write-Host "===================================================" -ForegroundColor Red
Write-Host "      PARANDO O AMBIENTE DE TESTE - PUCULUXA       " -ForegroundColor Yellow
Write-Host "===================================================" -ForegroundColor Red
Write-Host ""

Write-Host "Buscando o serviço Frontend na porta 6005..." -ForegroundColor Gray
$connections = Get-NetTCPConnection -LocalPort 6005 -State Listen -ErrorAction SilentlyContinue
if ($connections) {
    foreach ($conn in $connections) {
        $processId = $conn.OwningProcess
        if ($processId -ne 0) {
            Write-Host "Encontrado processo [$processId]! Encerrando..." -ForegroundColor Yellow
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            Write-Host "✔ Processo Frontend finalizado." -ForegroundColor Green
        }
    }
}
else {
    Write-Host "A porta 6005 já estava livre." -ForegroundColor DarkGray
}

Write-Host "Buscando o serviço Backend na porta 4001..." -ForegroundColor Gray
$connections = Get-NetTCPConnection -LocalPort 4001 -State Listen -ErrorAction SilentlyContinue
if ($connections) {
    foreach ($conn in $connections) {
        $processId = $conn.OwningProcess
        if ($processId -ne 0) {
            Write-Host "Encontrado processo [$processId]! Encerrando..." -ForegroundColor Yellow
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            Write-Host "✔ Processo Backend finalizado." -ForegroundColor Green
        }
    }
}
else {
    Write-Host "A porta 4001 já estava livre." -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "===================================================" -ForegroundColor Red
Write-Host "    Serviços do Puculuxa encerrados com sucesso!   " -ForegroundColor White
Write-Host "===================================================" -ForegroundColor Red
