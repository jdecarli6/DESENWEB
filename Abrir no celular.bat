@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist node_modules (
  echo Instalando dependencias, aguarde...
  call npm ci
)
call npm run celular
echo.
echo O sistema parou. Pode fechar esta janela.
pause
