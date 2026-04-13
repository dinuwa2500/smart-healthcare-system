@echo off
:: This makes it so the terminal doesn't print every command it runs, just the output.

call npm run dev

:: This keeps the window open so you can see why the server stopped.
pause