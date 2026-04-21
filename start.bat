@echo off
cd /d "%~dp0"
node_modules\.bin\tsx.cmd watch src/index.ts
