# MongoDB Seed Data

This directory contains JSON files with sample data for seeding your MongoDB database.

## Files

- `seed-users.json` - Sample user accounts
- `seed-recipes.json` - Sample recipes
- `seed-recipe-saves.json` - Sample wishlist saves (recipe saves)

## Important Notes

### Password Hashing

⚠️ **The passwords in `seed-users.json` are placeholder hashes.** 

Before importing users, you need to:
1. Generate proper bcrypt hashes for passwords
2. Replace the placeholder password hashes in the JSON file

You can generate bcrypt hashes using:
- Node.js: `bcrypt.hashSync('yourpassword', 10)`
- Online tool: https://bcrypt-generator.com/ (use 10 rounds)

**Default test password for all users:** `password123`

### Importing to MongoDB

#### Using MongoDB Compass:
1. Open MongoDB Compass
2. Connect to your database
3. Select your database (e.g., "Tastebase")
4. For each collection:
   - Click "Add Data" → "Import File"
   - Select the JSON file
   - Choose "JSON" format
   - Click "Import"

#### Using MongoDB Shell (mongosh):
```bash
# Import users
mongoimport --uri="mongodb+srv://username:password@cluster.mongodb.net/Tastebase" --collection=users --file=seed-users.json --jsonArray

# Import recipes
mongoimport --uri="mongodb+srv://username:password@cluster.mongodb.net/Tastebase" --collection=recipes --file=seed-recipes.json --jsonArray

# Import recipe saves
mongoimport --uri="mongodb+srv://username:password@cluster.mongodb.net/Tastebase" --collection=recipesaves --file=seed-recipe-saves.json --jsonArray
```

#### Using MongoDB Atlas:
1. Go to your cluster in MongoDB Atlas
2. Click "Browse Collections"
3. Select your database
4. Click "Insert Document" for each collection
5. Paste the JSON array content

## Data Structure

### Users
- 5 sample users with different cooking styles
- Each user has email, username, full_name, avatar_url, and bio
- **Remember to update passwords with real bcrypt hashes!**

### Recipes
- 5 sample recipes covering different cuisines and difficulty levels
- Each recipe includes ingredients and step-by-step instructions
- Recipes are linked to users via `author_id`

### Recipe Saves
- 10 sample wishlist saves
- Links users to recipes they've saved
- Demonstrates the wishlist functionality

## Object IDs

The Object IDs in these files are placeholders. MongoDB will generate new IDs when you import, or you can keep these if you want consistent references between collections.

If you keep the Object IDs, make sure the `author_id` in recipes matches `_id` in users, and `user_id`/`recipe_id` in recipe-saves match the corresponding IDs.

