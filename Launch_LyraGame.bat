@echo off
set "GAME_DIR=C:\Capstone\sample\Windows"
set "GAME_EXE=LyraGame.exe"

cd /d "%GAME_DIR%"
start "" "%GAME_EXE%" %1
exit
