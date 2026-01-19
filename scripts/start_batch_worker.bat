@echo off
REM Batch Inference Worker Starter
REM Copyright © 2024 Paksa IT Solutions

echo Starting LuxeBrain Batch Inference Worker...
echo.
echo Press Ctrl+C to stop
echo.

cd /d "%~dp0.."
python ml_models\recommendation\batch_worker.py
