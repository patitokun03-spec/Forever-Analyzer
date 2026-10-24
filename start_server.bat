@echo off
title Forever Analyzer
echo ===================================================
echo    Forever Analyzer - Local Server
echo ===================================================
echo.
if not exist forever.sqlite (
    echo Initializing SQLite database from database/seed_data.sql ...
    python database/seed.py
    echo.
)
echo Starting server at http://localhost:3000 ...
echo Do not close this window while using the application.
echo.
start http://localhost:3000
python server.py
pause
