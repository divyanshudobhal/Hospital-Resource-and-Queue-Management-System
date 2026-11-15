@echo off
start "Hospital Backend" /D "%~dp0server" cmd /k npm start
start "Hospital Frontend" /D "%~dp0client" cmd /k npm run dev
timeout /t 5 /nobreak >nul
start "Hospital Hosting" cmd /k cloudflared tunnel --url http://127.0.0.1:5173 --no-autoupdate
