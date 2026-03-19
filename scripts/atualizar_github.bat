@echo off
echo ===================================================
echo Iniciando atualizacao automatica do site Spin4All...
echo ===================================================

echo Verificando se o Git estah instalado...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] O comando 'git' nao foi encontrado. Por favor, instale o Git ou fale comigo.
    pause
    exit /b
)

echo Salvando alteracoes no Github...
git add .
git commit -m "update: Atualizacao automatica do site"
git push origin main

echo ===================================================
echo Atualizacao enviada com sucesso!
echo Pressione qualquer tecla para sair.
echo ===================================================
pause
