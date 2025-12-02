import mongoose, { Schema, model, models, Types } from 'mongoose';

export interface IRecipeSave {
  _id: string;
  user_id: Types.ObjectId | string;
  recipe_id: Types.ObjectId | string;
  created_at: Date;
}

const RecipeSaveSchema = new Schema<IRecipeSave>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipe_id: {
      type: Schema.Types.ObjectId,
      ref: 'Recipe',
      required: true,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

RecipeSaveSchema.index({ user_id: 1, recipe_id: 1 }, { unique: true });
RecipeSaveSchema.index({ recipe_id: 1 });

export const RecipeSave = models.RecipeSave || model<IRecipeSave>('RecipeSave', RecipeSaveSchema);

