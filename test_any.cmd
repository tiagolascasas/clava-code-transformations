@echo off
if "%~2"=="" (
    echo Usage: test_any ^<name of script in /test^> ^<name of input folder in /test/input^>
    exit /b 1
)
cd src 
call clava ../test/%1 -pi -par -cr -cl -cs -s -cfs -p ../test/input/%2 -b 0 -of ../woven_code -i ..
cd ..