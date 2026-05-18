@echo off
chcp 65001 >nul

echo ==========================================
echo Register LyraGame custom protocol: lyragame://
echo ==========================================
echo.

set "PROTOCOL=lyragame"
set "REG_ROOT=HKCU\Software\Classes\%PROTOCOL%"
set "LAUNCHER=%~dp0Launch_LyraGame.bat"
set "SCRIPT_DIR=%~dp0"
set "GAME_PATH="

if exist "%SCRIPT_DIR%LyraGame.exe" set "GAME_PATH=%SCRIPT_DIR%LyraGame.exe"
if not defined GAME_PATH if exist "%SCRIPT_DIR%Windows\LyraGame.exe" set "GAME_PATH=%SCRIPT_DIR%Windows\LyraGame.exe"
if not defined GAME_PATH if exist "%SCRIPT_DIR%LyraStarterGame\Binaries\Win64\LyraGame.exe" set "GAME_PATH=%SCRIPT_DIR%LyraStarterGame\Binaries\Win64\LyraGame.exe"

if not defined GAME_PATH (
    echo LyraGame.exe was not found automatically.
    echo Put this file next to LyraGame.exe, or type the full LyraGame.exe path.
    set /p "GAME_PATH=LyraGame.exe path: "
)

if not exist "%GAME_PATH%" (
    echo LyraGame.exe was not found:
    echo %GAME_PATH%
    pause
    exit /b 1
)

echo Launcher: %LAUNCHER%
echo Game exe: %GAME_PATH%
echo.
echo Check the path above before continuing.
pause

reg add "%REG_ROOT%" /ve /t REG_SZ /d "URL:LyraGame Protocol" /f
reg add "%REG_ROOT%" /v "URL Protocol" /t REG_SZ /d "" /f
reg add "%REG_ROOT%\DefaultIcon" /ve /t REG_SZ /d "\"%GAME_PATH%\",0" /f
reg add "%REG_ROOT%\shell\open\command" /ve /t REG_SZ /d "\"%LAUNCHER%\" \"%%1\"" /f

echo.
echo ==========================================
echo Registration complete.
echo The web GAME START button can now open LyraGame.exe.
echo ==========================================
pause
