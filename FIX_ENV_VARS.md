# Fix: Environment Variables Not Loading

## Problem
Next.js is not reading `MONGO_URL` from `.env.local`

## Solution Steps

### 1. Verify .env.local file exists and has correct content

Make sure your `.env.local` file in the root directory contains:

```env
MONGO_URL=mongodb+srv://DariaRosen:YOUR_PASSWORD@cluster0.3prj10p.mongodb.net/
DB_NAME=Tastebase
```

**Important checks:**
- ✅ File is named exactly `.env.local` (with the dot)
- ✅ File is in the root directory (same level as `package.json`)
- ✅ No extra spaces around the `=` sign
- ✅ No quotes around values (unless needed)
- ✅ Each variable on its own line

### 2. Clear Next.js cache

Run this command in your terminal:

```bash
Remove-Item -Recurse -Force .next
```

Or manually delete the `.next` folder.

### 3. Restart dev server

**Important:** You MUST restart the dev server for environment variables to load:

1. Stop the current server (Ctrl+C)
2. Start it again: `npm run dev`

### 4. Test environment variables

Visit: `http://localhost:3000/api/test-env`

This will show if the variables are being loaded correctly.

### 5. Test MongoDB connection

After confirming env vars are loaded, visit: `http://localhost:3000/api/recipes-debug`

## Common Issues

### Issue: Variables still not loading after restart

**Solution:** 
- Make sure there are no typos in variable names
- Check for hidden characters (copy-paste issues)
- Verify file encoding is UTF-8
- Try recreating the file from scratch

### Issue: "Please define the MONGO_URL environment variable"

**Solution:**
- The file might be `.env` instead of `.env.local`
- The variable name might have typos
- Server wasn't restarted after creating the file

### Issue: Cache problems

**Solution:**
- Delete `.next` folder
- Restart dev server
- Clear browser cache

## Verify Setup

After following all steps, check:

1. ✅ `.env.local` exists in root
2. ✅ Contains `MONGO_URL=...`
3. ✅ Contains `DB_NAME=Tastebase`
4. ✅ `.next` folder deleted
5. ✅ Dev server restarted
6. ✅ Test endpoint shows variables loaded

