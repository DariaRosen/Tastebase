import mongoose, { Schema, model, models, Types } from 'mongoose';

export interface IRecipeIngredient {
  position: number;
  quantity?: string | null;
  unit?: string | null;
  name: string;
  note?: string | null;
}

export interface IRecipeStep {
  position: number;
  instruction: string;
}

export interface IRecipe {
  _id: string;
  author_id: Types.ObjectId | string;
  title: string;
  description?: string | null;
  hero_image_url?: string | null;
  servings?: number | null;
  prep_minutes?: number | null;
  cook_minutes?: number | null;
  tags?: string[] | null;
  difficulty?: string | null;
  published_at?: Date | null;
  is_published: boolean;
  created_at: Date;
  recipe_ingredients: IRecipeIngredient[];
  recipe_steps: IRecipeStep[];
}

const RecipeIngredientSchema = new Schema<IRecipeIngredient>({
  position: { type: Number, required: true },
  quantity: { type: String, default: null },
  unit: { type: String, default: null },
  name: { type: String, required: true },
  note: { type: String, default: null },
});

const RecipeStepSchema = new Schema<IRecipeStep>({
  position: { type: Number, required: true },
  instruction: { type: String, required: true },
});

const RecipeSchema = new Schema<IRecipe>(
  {
    author_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: null,
    },
    hero_image_url: {
      type: String,
      default: null,
    },
    servings: {
      type: Number,
      default: null,
    },
    prep_minutes: {
      type: Number,
      default: null,
    },
    cook_minutes: {
      type: Number,
      default: null,
    },
    tags: {
      type: [String],
      default: null,
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Intermediate', 'Advanced'],
      default: null,
    },
    published_at: {
      type: Date,
      default: null,
    },
    is_published: {
      type: Boolean,
      default: false,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
    recipe_ingredients: {
      type: [RecipeIngredientSchema],
      default: [],
    },
    recipe_steps: {
      type: [RecipeStepSchema],
      default: [],
    },
  },
  {
    timestamps: false,
  }
);

RecipeSchema.index({ author_id: 1 });
RecipeSchema.index({ is_published: 1, published_at: -1 });
RecipeSchema.index({ title: 'text', description: 'text' });

export const Recipe = models.Recipe || model<IRecipe>('Recipe', RecipeSchema);

