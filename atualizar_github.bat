@echo off
echo ===================================================
echo Iniciando atualizacao automatica do site Spin4All...
echo ===================================================

echo Salvando alteracoes no Github...
git add .
git commit -m "update: Atualizacao automatica do site"
git push origin main

echo ===================================================
echo Atualizacao enviada com sucesso!
echo Pressione qualquer tecla para sair.
echo ===================================================
pause
