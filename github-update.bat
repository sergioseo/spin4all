@echo off
echo ========================================================
echo 🚀 ATUALIZANDO SPIN4ALL NO GITHUB (PRODUCAO) 🚀
echo ========================================================
echo.
echo 1. Adicionando novos arquivos...
git config core.autocrlf true
git config gc.auto 0
git add .
echo.
echo 2. Criando o versionamento...
git commit -m "[BOLT:GOVERNANCE] Industrial Lockdown Protocol v5 (Landing Page + Google Integration) 🛡️🚀⚙️"
echo.
echo 3. Enviando para o GitHub...
git push origin main
echo.
echo ========================================================
echo ✅ SUCESSO! SEU SITE ESTA SENDO ATUALIZADO NO PROD.
echo ========================================================
pause
