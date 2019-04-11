@pushd "%~dp0.."
call tsc --build src demo || goto :err
call modularize-namespace global.js --output modular.js --namespace mmk.terminal || goto :err
:err
@popd
@exit /b %ERRORLEVEL%
