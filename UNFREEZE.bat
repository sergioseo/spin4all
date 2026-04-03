@echo off
echo --- SPIN4ALL EMERGENCY UNFREEZE ---
echo Finalizando processos do Node.js...
taskkill /F /IM node.exe /T
echo Verificando porta 3456...
netstat -ano | findstr :3456
echo.
echo Se houver um processo na porta 3456, anote o PID (ultimo numero).
echo Use 'taskkill /F /PID <PID>' se ele nao morreu.
echo.
echo Tentando iniciar o Servidor de Debug...
node debug-server.js
pause
