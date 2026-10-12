@echo off
echo ===================================================
echo   SIKAMOS - STIP International Kadet Mobility System
echo   Jembatan Akses Online (Cloudflare Secure Tunnel)
echo ===================================================
echo.
echo Menghubungkan port 3000 ke internet publik via Cloudflare Tunnel...
echo.
"C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:3000
pause

