# ⚠️ URGENT: Security Steps Required

## Your MongoDB credentials were exposed in git history

The password `Daria13579` is visible in commit `de42c86` (now `e5a25bf` after history rewrite) on GitHub.

## IMMEDIATE ACTION REQUIRED (Do this NOW):

### 1. Change MongoDB Password (CRITICAL - Do this first!)

1. Go to: https://cloud.mongodb.com/v2/68aaa862b8d00c04791dab6e#/security/database
2. Find user "DariaRosen" 
3. Click "Edit" → "Edit Password"
4. **Set a NEW strong password immediately**
5. Update your `.env.local` file:
   ```
   MONGO_URL=mongodb+srv://DariaRosen:YOUR_NEW_PASSWORD@cluster0.3prj10p.mongodb.net/
   DB_NAME=Tastebase
   ```

### 2. Remove Credentials from GitHub History

The credentials are still visible in git history. You have two options:

#### Option A: Use BFG Repo-Cleaner (Recommended)
```bash
# Install BFG (if not installed)
# Download from: https://rtyley.github.io/bfg-repo-cleaner/

# Remove the credentials
java -jar bfg.jar --replace-text passwords.txt

# Force push (WARNING: This rewrites history!)
git push --force
```

Create `passwords.txt` with:
```
mongodb+srv://DariaRosen:Daria13579@cluster0.3prj10p.mongodb.net/==>
```

#### Option B: Contact GitHub Support
GitHub can help remove sensitive data from repository history. Go to:
https://docs.github.com/en/code-security/secret-scanning/removing-a-secret-from-repository-history

### 3. Verify Removal

After changing password and cleaning history:
- Check that old commit no longer shows credentials
- Verify new password works in your app
- Monitor MongoDB Atlas for any suspicious activity

## Why This Happened

The MongoDB connection string with password was hardcoded in `src/lib/mongodb.ts` in commit `de42c86`. Even though we removed it later, it's still in git history.

## Prevention

✅ Always use environment variables for secrets
✅ Never commit `.env.local` files
✅ Use `.gitignore` for sensitive files
✅ Review code before committing

