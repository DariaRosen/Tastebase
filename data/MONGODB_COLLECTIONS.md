# MongoDB Collections Required

Your application needs **3 collections** in MongoDB:

## Collections List

### 1. ✅ `users` (You've already created this!)
- Stores user accounts and profiles
- Model: `User` (from `src/lib/models/User.ts`)

### 2. `recipes` (Create this one)
- Stores all recipes with ingredients and steps
- Model: `Recipe` (from `src/lib/models/Recipe.ts`)
- **Collection name:** `recipes`

### 3. `recipesaves` (Create this one)
- Stores wishlist saves (which users saved which recipes)
- Model: `RecipeSave` (from `src/lib/models/RecipeSave.ts`)
- **Collection name:** `recipesaves` (Mongoose pluralizes "RecipeSave")

## How to Create Collections in MongoDB Atlas

### Option 1: Collections are created automatically
Mongoose will **automatically create collections** when you first insert data! You don't need to manually create them.

Just make sure:
1. Your database name matches `DB_NAME` in `.env.local` (default: "Tastebase")
2. The collections will be created when the app runs

### Option 2: Create manually (optional)
If you want to create them manually in MongoDB Atlas:

1. Go to your cluster → "Browse Collections"
2. Click "Create Database"
3. Database name: `Tastebase` (or your `DB_NAME`)
4. Create these collections:
   - `users` ✅ (already exists)
   - `recipes`
   - `recipesaves`

## Importing Seed Data

After collections exist (or are auto-created), you can import the seed data:

1. **Import users:** `data/seed-users.json` → `users` collection
2. **Import recipes:** `data/seed-recipes.json` → `recipes` collection  
3. **Import saves:** `data/seed-recipe-saves.json` → `recipesaves` collection

**Note:** Make sure to update password hashes in `seed-users.json` before importing (use `node data/generate-password-hashes.js`)

## Collection Structure

### `users` collection
- `_id`: ObjectId
- `email`: String (unique, indexed)
- `username`: String (indexed)
- `full_name`: String
- `avatar_url`: String
- `bio`: String
- `password`: String (bcrypt hash)
- `created_at`: Date

### `recipes` collection
- `_id`: ObjectId
- `author_id`: ObjectId (references `users._id`)
- `title`: String
- `description`: String
- `hero_image_url`: String
- `servings`: Number
- `prep_minutes`: Number
- `cook_minutes`: Number
- `tags`: Array of Strings
- `difficulty`: String (Easy/Intermediate/Advanced)
- `is_published`: Boolean
- `published_at`: Date
- `created_at`: Date
- `recipe_ingredients`: Array of objects
- `recipe_steps`: Array of objects

### `recipesaves` collection
- `_id`: ObjectId
- `user_id`: ObjectId (references `users._id`)
- `recipe_id`: ObjectId (references `recipes._id`)
- `created_at`: Date
- **Index:** Unique on `user_id` + `recipe_id` (prevents duplicate saves)

## Indexes

Mongoose will create these indexes automatically:
- `users`: `email` (unique), `username`
- `recipes`: `author_id`, `is_published + published_at`, text search on `title + description`
- `recipesaves`: `user_id + recipe_id` (unique), `recipe_id`

