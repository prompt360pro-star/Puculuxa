@echo off
title Puculuxa Admin - Ambiente de Teste
color 0A

echo ===================================================
echo       INICIANDO AMBIENTE DE TESTE - PUCULUXA
echo ===================================================
echo.

if not exist logs mkdir logs

echo [1/2] Iniciando o servidor Backend (NestJS)...
echo Registrando logs em logs\backend.log
start "Puculuxa - Backend API" cmd /c "cd backend && npm run start:dev > ..\logs\backend.log 2>&1"

:: Pequena pausa para garantir que o backend inicie antes do frontend
timeout /t 3 /nobreak > nul

echo [2/2] Iniciando o servidor Frontend (Next.js Production) na porta 6005...
echo Registrando logs em logs\frontend.log
start "Puculuxa - Frontend Web" cmd /c "cd web && npx next start -p 6005 > ..\logs\frontend.log 2>&1"

echo.
echo ===================================================
echo   Servicos iniciados e rodando nas janelas ocultas!
echo   (Se quiser ver o terminal, verifique a pasta logs)
echo.
echo   [FRONTEND] Acesso via: http://localhost:6005
echo   [BACKEND]  API rodando na sua porta padrao (4001)
echo   [LOGS]     Arquivos salvos na pasta 'logs\'
echo ===================================================
echo.
echo Para PARAR a aplicacao, execute o script: parar-app.bat
echo Tudo pronto! Pode fechar esta janela se quiser.
pause
