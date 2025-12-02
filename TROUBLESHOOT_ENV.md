# Environment Variables Not Loading - Troubleshooting

## Current Status
- ✅ `.env.local` file exists
- ✅ File has content (552 bytes)
- ✅ `MONGO_URL` is in the file
- ❌ `process.env.MONGO_URL` is NOT SET

## The Problem
Next.js is not automatically loading environment variables from `.env.local`.

## Solutions to Try

### Solution 1: Verify Server Restart
**Make absolutely sure the dev server was restarted AFTER creating/modifying `.env.local`:**

1. **Stop the server completely** (Ctrl+C)
2. **Wait 2-3 seconds**
3. **Start it again**: `npm run dev`
4. **Wait for "Ready" message**

### Solution 2: Check File Location
The `.env.local` file MUST be in the root directory (same level as `package.json`).

Verify:
```cmd
dir .env.local
```

Should show the file in `C:\dev\coding-academy\tastebase\`

### Solution 3: Check File Format
Make sure the file has NO BOM (Byte Order Mark) and uses UTF-8 encoding.

The file should look exactly like this (no quotes, no spaces around =):
```
MONGO_URL=mongodb+srv://DariaRosen:Daria13579@cluster0.3prj10p.mongodb.net/
DB_NAME=Tastebase
```

### Solution 4: Try Explicit Loading
If Next.js still doesn't load it, we might need to explicitly load it in the code.

### Solution 5: Check for Multiple .env Files
Make sure you don't have conflicting `.env` files:
- `.env` (might override `.env.local`)
- `.env.development`
- `.env.production`

### Solution 6: Nuclear Option - Recreate File
1. Delete `.env.local`
2. Create a new one with just:
   ```
   MONGO_URL=mongodb+srv://DariaRosen:Daria13579@cluster0.3prj10p.mongodb.net/
   DB_NAME=Tastebase
   ```
3. Save it
4. Restart server

## Test After Each Solution
Visit: `http://localhost:3000/api/check-env-file`

Look for:
- `processEnv.MONGO_URL_set: true` ← This should be true!

