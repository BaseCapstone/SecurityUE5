@echo off
set "SCRIPT_DIR=%~dp0"
set "GAME_EXE="

if exist "%SCRIPT_DIR%LyraGame.exe" set "GAME_EXE=%SCRIPT_DIR%LyraGame.exe"
if not defined GAME_EXE if exist "%SCRIPT_DIR%Windows\LyraGame.exe" set "GAME_EXE=%SCRIPT_DIR%Windows\LyraGame.exe"
if not defined GAME_EXE if exist "%SCRIPT_DIR%LyraStarterGame\Binaries\Win64\LyraGame.exe" set "GAME_EXE=%SCRIPT_DIR%LyraStarterGame\Binaries\Win64\LyraGame.exe"

if not defined GAME_EXE (
    echo LyraGame.exe was not found:
    echo %SCRIPT_DIR%LyraGame.exe
    echo %SCRIPT_DIR%Windows\LyraGame.exe
    echo %SCRIPT_DIR%LyraStarterGame\Binaries\Win64\LyraGame.exe
    pause
    exit /b 1
)

for %%I in ("%GAME_EXE%") do set "GAME_DIR=%%~dpI"
cd /d "%GAME_DIR%"
start "" "%GAME_EXE%" %*
exit
