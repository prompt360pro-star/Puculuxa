@echo off
title Puculuxa Admin - Parar Servicos
color 0C

echo ===================================================
echo       PARANDO O AMBIENTE DE TESTE - PUCULUXA
echo ===================================================
echo.

echo Matando o processo na porta 6005 (Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":6005 "') do (
    if NOT "%%a"=="0" taskkill /F /PID %%a 2>nul
)

echo Matando o processo na porta 4001 (Backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":4001 "') do (
    if NOT "%%a"=="0" taskkill /F /PID %%a 2>nul
)

echo.
echo ===================================================
echo     Servicos do Puculuxa encerrados com sucesso!
echo ===================================================
pause
