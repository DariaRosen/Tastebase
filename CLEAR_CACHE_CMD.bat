@echo off
echo Clearing Next.js cache...
if exist .next (
    rmdir /s /q .next
    echo .next folder deleted successfully!
) else (
    echo .next folder not found - nothing to delete.
)
echo.
echo Now restart your dev server with: npm run dev

