@echo off
echo ==========================================
echo   Iniciando Education Walkthrough
echo ==========================================
echo.
echo Navegando al directorio del proyecto...
cd /d "%~dp0"
echo.
echo Ejecutando el servidor de desarrollo...
echo El navegador deberia abrirse automaticamente.
echo Si no se abre, visita: http://localhost:5173
echo.
call npm run dev -- --open
pause
