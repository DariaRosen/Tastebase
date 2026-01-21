# PowerShell script to remove credentials from git history
# This will rewrite the specific commit to remove the hardcoded credentials

$commitHash = "de42c86"
$filePath = "src/lib/mongodb.ts"

# Checkout the commit
git checkout $commitHash -- $filePath

# Read the file content
$content = Get-Content $filePath -Raw

# Replace the hardcoded credentials
$content = $content -replace "mongodb\+srv://DariaRosen:Daria13579@cluster0\.3prj10p\.mongodb\.net/", ""
$content = $content -replace 'process\.env\.MONGO_URL \|\| ', 'process.env.MONGO_URL'

# Write back
$content | Set-Content $filePath -NoNewline

# Stage the change
git add $filePath

# Amend the commit
git commit --amend --no-edit

# Go back to main
git checkout main



