@echo off
setlocal EnableExtensions EnableDelayedExpansion
set "SCRIPT_DIR=%~dp0"
set "GAME_EXE="
set "LOG_FILE=%SCRIPT_DIR%lyra-launch.log"
set "LAUNCH_URL=%~1"
set "GAME_AUTH_TOKEN="
set "GAME_USER_ID="
set "GAME_LOG_ENDPOINT="

echo [%date% %time%] Launch request: %*>> "%LOG_FILE%"

if defined LAUNCH_URL (
    set "TOKEN_PART=!LAUNCH_URL:*token=!"
    if not "!TOKEN_PART!"=="!LAUNCH_URL!" (
        for /f "tokens=1 delims=&" %%A in ("!TOKEN_PART!") do set "GAME_AUTH_TOKEN=%%A"
    )

    set "USER_ID_PART=!LAUNCH_URL:*user_id=!"
    if not "!USER_ID_PART!"=="!LAUNCH_URL!" (
        for /f "tokens=1 delims=&" %%A in ("!USER_ID_PART!") do set "GAME_USER_ID=%%A"
    )

    set "API_URL_PART=!LAUNCH_URL:*api_url=!"
    if not "!API_URL_PART!"=="!LAUNCH_URL!" (
        for /f "tokens=1 delims=&" %%A in ("!API_URL_PART!") do set "GAME_LOG_ENDPOINT=%%A"
    )
)

if "!GAME_AUTH_TOKEN:~0,1!"=="=" set "GAME_AUTH_TOKEN=!GAME_AUTH_TOKEN:~1!"
if "!GAME_USER_ID:~0,1!"=="=" set "GAME_USER_ID=!GAME_USER_ID:~1!"
if "!GAME_LOG_ENDPOINT:~0,1!"=="=" set "GAME_LOG_ENDPOINT=!GAME_LOG_ENDPOINT:~1!"

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
echo [%date% %time%] Starting: %GAME_EXE% user_id=%GAME_USER_ID%>> "%LOG_FILE%"
start "" "%GAME_EXE%" -GameAuthToken="%GAME_AUTH_TOKEN%" -GameUserId="%GAME_USER_ID%" -GameLogEndpoint="%GAME_LOG_ENDPOINT%"
exit
