@echo off
echo Starting CivicSync Backend...
cd backend
call gradlew.bat bootRun --console=plain
pause
