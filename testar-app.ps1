Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "      INICIANDO AMBIENTE DE TESTE - PUCULUXA       " -ForegroundColor Yellow
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

if (!(Test-Path -Path "logs")) {
    New-Item -ItemType Directory -Path "logs" | Out-Null
}

Write-Host "[1/2] Iniciando o servidor Backend (NestJS)..." -ForegroundColor Green
Write-Host "Registrando logs em logs\backend.log" -ForegroundColor DarkGray
Start-Process powershell -ArgumentList "-Title 'Puculuxa - Backend API'", "-NoExit", "-Command", "cd backend; npm run start:dev *>&1 | Tee-Object -FilePath ..\logs\backend.log"

Start-Sleep -Seconds 3

Write-Host "[2/2] Iniciando o servidor Frontend (Next.js) na porta 6005..." -ForegroundColor Green
Write-Host "Registrando logs em logs\frontend.log" -ForegroundColor DarkGray
Start-Process powershell -ArgumentList "-Title 'Puculuxa - Frontend Web'", "-NoExit", "-Command", "cd web; npx next start -p 6005 *>&1 | Tee-Object -FilePath ..\logs\frontend.log"

Write-Host ""
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  Serviços iniciados em novas abas com sistema de Logs!" -ForegroundColor White
Write-Host ""
Write-Host "  [FRONTEND] Acesso via: http://localhost:6005" -ForegroundColor Yellow
Write-Host "  [BACKEND]  API rodando na sua porta padrão (4001)" -ForegroundColor Yellow
Write-Host "  [LOGS]     Arquivos salvos na pasta 'logs\'" -ForegroundColor Gray
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "Para PARAR a aplicação, execute: parar-app.ps1" -ForegroundColor Red
