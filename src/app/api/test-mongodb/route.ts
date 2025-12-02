import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Recipe } from '@/lib/models/Recipe';
import { User } from '@/lib/models/User';

export async function GET() {
  const diagnostics: any = {
    step: 'initializing',
    errors: [] as string[],
  };

  try {
    // Step 1: Check environment variables
    diagnostics.step = 'checking_env';
    const dbURL = process.env.MONGO_URL;
    const dbName = process.env.DB_NAME || 'Tastbase';
    
    diagnostics.env = {
      MONGO_URL_set: !!dbURL,
      MONGO_URL_length: dbURL ? dbURL.length : 0,
      DB_NAME: dbName,
    };

    if (!dbURL) {
      diagnostics.errors.push('MONGO_URL environment variable is not set');
      return NextResponse.json(diagnostics, { status: 500 });
    }

    // Step 2: Test MongoDB connection
    diagnostics.step = 'connecting';
    let mongoose: any;
    try {
      mongoose = await connectDB();
      diagnostics.connection = {
        success: true,
        readyState: mongoose.connection.readyState,
        db_name: mongoose.connection.db?.databaseName,
      };
    } catch (connError: any) {
      diagnostics.errors.push(`Connection failed: ${connError.message}`);
      diagnostics.connection = {
        success: false,
        error: connError.message,
      };
      return NextResponse.json(diagnostics, { status: 500 });
    }

    // Step 3: Check collections
    diagnostics.step = 'checking_collections';
    try {
      const db = mongoose.connection.db;
      const collections = await db.listCollections().toArray();
      diagnostics.collections = collections.map((c: any) => c.name);
    } catch (colError: any) {
      diagnostics.errors.push(`Failed to list collections: ${colError.message}`);
    }

    // Step 4: Test counts
    diagnostics.step = 'counting_documents';
    try {
      const userCount = await User.countDocuments();
      const recipeCount = await Recipe.countDocuments();
      diagnostics.counts = {
        users: userCount,
        recipes: recipeCount,
      };
    } catch (countError: any) {
      diagnostics.errors.push(`Failed to count documents: ${countError.message}`);
    }

    // Step 5: Try to fetch a recipe
    diagnostics.step = 'fetching_sample';
    try {
      const sampleRecipe = await Recipe.findOne({ is_published: true })
        .lean()
        .exec();
      
      if (sampleRecipe) {
        diagnostics.sampleRecipe = {
          id: sampleRecipe._id?.toString(),
          title: sampleRecipe.title,
          hasAuthor: !!sampleRecipe.author_id,
          authorId: sampleRecipe.author_id?.toString(),
        };
      } else {
        diagnostics.sampleRecipe = null;
        diagnostics.warning = 'No published recipes found';
      }
    } catch (fetchError: any) {
      diagnostics.errors.push(`Failed to fetch sample recipe: ${fetchError.message}`);
    }

    diagnostics.success = diagnostics.errors.length === 0;
    return NextResponse.json(diagnostics);
  } catch (error) {
    diagnostics.step = 'unexpected_error';
    diagnostics.errors.push(
      error instanceof Error ? error.message : 'Unknown error'
    );
    diagnostics.stack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json(diagnostics, { status: 500 });
  }
}
