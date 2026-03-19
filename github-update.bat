@echo off
echo ========================================================
echo 🚀 ATUALIZANDO SPIN4ALL NO GITHUB (PRODUCAO) 🚀
echo ========================================================
echo.
echo 1. Adicionando novos arquivos...
git add .
echo.
echo 2. Criando o versionamento...
git commit -m "feat: modulo de perfil, grafico radar e global loader (Refactoring)"
echo.
echo 3. Enviando para o GitHub...
git push origin main
echo.
echo ========================================================
echo ✅ SUCESSO! SEU SITE ESTA SENDO ATUALIZADO NO PROD.
echo ========================================================
pause
