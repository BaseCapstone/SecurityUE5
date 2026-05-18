@echo off
set "SCRIPT_DIR=%~dp0"
set "GAME_EXE="
set "LOG_FILE=%SCRIPT_DIR%lyra-launch.log"

echo [%date% %time%] Launch request: %*>> "%LOG_FILE%"

if exist "%SCRIPT_DIR%LyraGame.exe" set "GAME_EXE=%SCRIPT_DIR%LyraGame.exe"
if not defined GAME_EXE if exist "%SCRIPT_DIR%Windows\LyraGame.exe" set "GAME_EXE=%SCRIPT_DIR%Windows\LyraGame.exe"
if not defined GAME_EXE if exist "%SCRIPT_DIR%LyraStarterGame\Binaries\Win64\LyraGame.exe" set "GAME_EXE=%SCRIPT_DIR%LyraStarterGame\Binaries\Win64\LyraGame.exe"

if not defined GAME_EXE (
    echo [%date% %time%] LyraGame.exe was not found.>> "%LOG_FILE%"
    echo LyraGame.exe was not found:
    echo %SCRIPT_DIR%LyraGame.exe
    echo %SCRIPT_DIR%Windows\LyraGame.exe
    echo %SCRIPT_DIR%LyraStarterGame\Binaries\Win64\LyraGame.exe
    pause
    exit /b 1
)

for %%I in ("%GAME_EXE%") do set "GAME_DIR=%%~dpI"
cd /d "%GAME_DIR%"
echo [%date% %time%] Starting: %GAME_EXE%>> "%LOG_FILE%"
start "" "%GAME_EXE%"
exit
