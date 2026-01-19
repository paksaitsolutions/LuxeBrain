@echo off
REM Database Backup Script
REM Copyright (c) 2024 Paksa IT Solutions

echo Starting database backup...

set BACKUP_DIR=backups
set TIMESTAMP=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%

if not exist %BACKUP_DIR% mkdir %BACKUP_DIR%

REM Check if using SQLite or PostgreSQL
if exist luxebrain.db (
    echo Backing up SQLite database...
    copy luxebrain.db %BACKUP_DIR%\luxebrain_%TIMESTAMP%.db
    echo SQLite backup complete: %BACKUP_DIR%\luxebrain_%TIMESTAMP%.db
) else (
    echo Backing up PostgreSQL database...
    set PGPASSWORD=%DB_PASSWORD%
    pg_dump -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -F c -f %BACKUP_DIR%\luxebrain_%TIMESTAMP%.dump
    echo PostgreSQL backup complete: %BACKUP_DIR%\luxebrain_%TIMESTAMP%.dump
)

REM Delete backups older than 30 days
forfiles /p %BACKUP_DIR% /s /m *.* /d -30 /c "cmd /c del @path" 2>nul

echo Backup completed successfully!
