@echo off
chcp 65001 >nul
:: 관리자 권한 확인
net session >nul 2>&1
if %errorLevel% == 0 (
    echo 관리자 권한이 확인되었습니다.
) else (
    echo 관리자 권한이 필요합니다. 관리자 권한으로 다시 실행합니다...
    powershell -Command "Start-Process '%~dpnx0' -Verb RunAs"
    exit /b
)

echo ==========================================
echo LyraGame 커스텀 프로토콜 (lyragame://) 등록
echo ==========================================
echo.

:: 게임 실행 파일 경로 지정
set "GAME_PATH=C:\Users\dahyu\바탕 화면\Windows\LyraGame.exe"

set "PROTOCOL=lyragame"

echo 등록할 게임 경로: %GAME_PATH%
echo.
echo 위 경로가 맞는지 확인하세요. 나중에 실제 패키징된 경로로 수정하여 다시 실행하실 수 있습니다.
pause

:: 레지스트리 키 추가
reg add "HKCR\%PROTOCOL%" /ve /t REG_SZ /d "URL:LyraGame Protocol" /f
reg add "HKCR\%PROTOCOL%" /v "URL Protocol" /t REG_SZ /d "" /f
reg add "HKCR\%PROTOCOL%\DefaultIcon" /ve /t REG_SZ /d "\"%GAME_PATH%\",0" /f
reg add "HKCR\%PROTOCOL%\shell\open\command" /ve /t REG_SZ /d "\"%GAME_PATH%\" \"%%1\"" /f

echo.
echo ==========================================
echo 등록이 완료되었습니다!
echo 이제 웹에서 게임 시작 버튼을 누르면 이 PC의 게임이 실행됩니다.
echo ==========================================
pause
