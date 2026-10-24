@echo off
title WoW Forever Log Analyzer
echo ======================================================
echo    WoW Forever Log Analyzer - Servidor Local
echo ======================================================
echo.
if not exist forever.sqlite (
    echo [Init] Inicializando base de datos SQLite desde database/seed.py ...
    python database/seed.py
    echo.
)
echo Iniciando servidor en http://localhost:3000 ...
echo.
python server.py
pause
