# Fix Environment Variables - CMD Instructions

## You're using CMD (not PowerShell)

Since you're in CMD, use these commands:

### 1. Clear Next.js Cache (CMD command)

```cmd
rmdir /s /q .next
```

Or run the batch file:
```cmd
CLEAR_CACHE_CMD.bat
```

### 2. Check your .env.local file

Your `.env.local` file should look like this:

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dool6mmp1
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=ml_default
CLOUDINARY_API_KEY=695486548144386
CLOUDINARY_API_SECRET=YGihIO3KaB2-7nMfmLnIEPMsMZ8
MONGO_URL=mongodb+srv://DariaRosen:Daria13579@cluster0.3prj10p.mongodb.net/
DB_NAME=Tastebase
```

**Important checks:**
- ✅ File is named exactly `.env.local` (with the dot at the start)
- ✅ File is in the root directory (same folder as `package.json`)
- ✅ `MONGO_URL` line ends with `/` (slash)
- ✅ `DB_NAME=Tastebase` (with the 'e' - not Tastbase)
- ✅ No spaces around the `=` sign
- ✅ No quotes around the values

### 3. Restart Dev Server

After clearing cache:
```cmd
npm run dev
```

### 4. Test

Visit: `http://localhost:3000/api/test-env`

This will show if environment variables are loaded.

