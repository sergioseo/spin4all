@echo off
setlocal enabledelayedexpansion

echo ##################################################
echo # SPIN4ALL - Industrial Deployer (v2.0)          #
echo ##################################################
echo.

:: Volta para a raiz do projeto (supondo que o script esta em /scripts/)
cd ..

:: Verifica se o Git esta instalado
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] Git nao encontrado.
    echo Por favor, instale o Git para usar esta ferramenta.
    pause
    exit /b
)

:: Exibe o status atual
echo [STATUS] Verificando arquivos alterados...
git status -s
echo.

:: Solicita a mensagem do commit
set /p commit_msg="Digite a mensagem do commit (ou deixe vazio para Padrao): "
if "!commit_msg!"=="" (
    set commit_msg=Spin4All v2.0: Industrial Cinematic Refinement ^& UX/UI Polish
)

:: Executa os comandos
echo.
echo [PROCESSO] Adicionando arquivos...
git add .

echo [PROCESSO] Criando commit: "!commit_msg!"
git commit -m "[SPIN4ALL] !commit_msg!"

:: Detecta a branch atual para o push
for /f "tokens=*" %%a in ('git rev-parse --abbrev-ref HEAD') do set BRANCH=%%a

echo [PROCESSO] Subindo para o servidor (Branch: !BRANCH!)...
:: Tenta o push com upstream para resolver o erro 'no upstream branch'
git push -u origin !BRANCH!

if %errorlevel% equ 0 (
    echo.
    echo [SUCESSO] Deploy realizado com perfeicao!
) else (
    echo.
    echo [ FALHA ] Houve um problema ao subir os arquivos.
)

echo.
echo ##################################################
pause
