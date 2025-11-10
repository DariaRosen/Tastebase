import Image from 'next/image';
import { Clock, Users, Heart } from 'lucide-react';

interface RecipeCardProps {
  id: string;
  title: string;
  description?: string;
  authorName: string;
  authorAvatar?: string;
  imageUrl?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  likes?: number;
  tags?: string[];
}

export const RecipeCard = ({
  title,
  description,
  authorName,
  authorAvatar,
  imageUrl,
  prepTime,
  cookTime,
  servings,
  likes,
  tags,
}: RecipeCardProps) => {
  const totalTime = (prepTime || 0) + (cookTime || 0);

  return (
    <article className="group cursor-pointer">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-gray-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200">
            <span className="text-4xl">🍳</span>
          </div>
        )}
      </div>

      <div className="mt-3 space-y-2">
        <h3 className="line-clamp-2 text-lg font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
          {title}
        </h3>

        {description && (
          <p className="line-clamp-2 text-sm text-gray-600">{description}</p>
        )}

        <div className="flex items-center gap-4 text-sm text-gray-500">
          {totalTime > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{totalTime} min</span>
            </div>
          )}
          {servings && (
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{servings} servings</span>
            </div>
          )}
          {likes !== undefined && (
            <div className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              <span>{likes}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {authorAvatar ? (
            <div className="relative h-6 w-6 overflow-hidden rounded-full bg-gray-200">
              <Image
                src={authorAvatar}
                alt={authorName}
                fill
                className="object-cover"
                sizes="24px"
              />
            </div>
          ) : (
            <div className="h-6 w-6 rounded-full bg-gray-300" />
          )}
          <span className="text-sm text-gray-600">{authorName}</span>
        </div>

        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
};

