@echo off
cd backend
npm install
if not exist .env copy .env.example .env
npm run dev
pause
