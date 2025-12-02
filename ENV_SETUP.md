# Environment Variables Setup

## Important: Restart Required

**After creating or modifying `.env.local`, you MUST restart your Next.js dev server for changes to take effect.**

## Current Environment Variables

Your `.env.local` file should contain:

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dool6mmp1
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=ml_default
CLOUDINARY_API_KEY=695486548144386
CLOUDINARY_API_SECRET=YGihIO3KaB2-7nMfmLnIEPMsMZ8
MONGO_URL=mongodb+srv://DariaRosen:YOUR_PASSWORD@cluster0.3prj10p.mongodb.net/
DB_NAME=Tastebase
```

## Steps to Fix Connection Issues

1. **Stop your dev server** (Ctrl+C in the terminal where it's running)

2. **Verify your `.env.local` file** has the correct values

3. **Restart the dev server**:
   ```bash
   npm run dev
   ```

4. **Test the connection**:
   - Visit: http://localhost:3000/api/test-mongodb
   - Visit: http://localhost:3000/api/recipes-debug

## Security Warning

⚠️ **IMPORTANT**: Make sure your `.env.local` file is:
- Listed in `.gitignore` (it should be - `.env*` is already there)
- Never committed to Git
- Contains the correct password (replace `YOUR_PASSWORD` with your actual MongoDB password)

If your password was previously exposed, change it in MongoDB Atlas immediately!

