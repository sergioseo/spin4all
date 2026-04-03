@echo off
setlocal enabledelayedexpansion

echo ##################################################
echo # SPIN4ALL - Extrator Industrial de Thumbnails   #
echo ##################################################
echo.

:: Caminhos relativos ao local do script
set VIDEO_DIR=..\assets\videos

:: Verifica se o FFmpeg está instalado
where ffmpeg >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] FFmpeg nao encontrado.
    echo Por favor, instale o FFmpeg ou capture as screenshots manualmente.
    pause
    exit /b
)

:: Processa cada video de 1 a 4
for /l %%i in (1,1,4) do (
    set FILE=!VIDEO_DIR!\video%%i.mp4
    set THUMB=!VIDEO_DIR!\video%%i_thumb.jpg
    
    if exist "!FILE!" (
        echo [PROCESSANDO] Gerando thumbnail para video%%i.mp4...
        :: Extrai o frame no segundo 5 (-ss 00:00:05)
        ffmpeg -y -i "!FILE!" -ss 00:00:05 -vframes 1 -q:v 2 "!THUMB!" >nul 2>&1
        if %errorlevel% equ 0 (
            echo [SUCESSO] Thumbnail gerada: video%%i_thumb.jpg
        ) else (
            echo [ FALHA ] Erro ao processar video%%i.mp4
        )
    ) else (
        echo [ AVISO ] Arquivo video%%i.mp4 nao encontrado em !VIDEO_DIR!
    )
)

echo.
echo ##################################################
echo # Processo Concluido!                            #
echo ##################################################
pause
