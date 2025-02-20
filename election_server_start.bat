@echo off
set PORT=5005
set IP=192.168.0.100
set ELECTION_NAME=DRCL Election
set ELECTION_SESSION=2024-2025
set NODE_ENV=production
pm2 start server.js --name election_server --update-env