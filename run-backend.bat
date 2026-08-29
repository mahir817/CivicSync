@echo off
echo Starting CivicSync Spring Boot Backend...
cd /d "%~dp0backend"
"C:\Program Files\JetBrains\IntelliJ IDEA Educational Edition 2022.2.2\plugins\maven\lib\maven3\bin\mvn.cmd" spring-boot:run
