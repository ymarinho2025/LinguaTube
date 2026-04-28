@echo off
cd frontend
npm install
if not exist .env copy .env.example .env
npm run dev
pause
