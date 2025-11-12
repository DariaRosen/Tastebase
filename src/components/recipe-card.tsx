import Image from 'next/image';
import Link from 'next/link';
import { Clock, Users, Heart } from 'lucide-react';
import { useCallback } from 'react';

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
	wishlistCount?: number;
	tags?: string[];
	isSaved?: boolean;
	onToggleSave?: (id: string) => void;
}

export const RecipeCard = ({
	id,
	title,
	description,
	authorName,
	authorAvatar,
	imageUrl,
	prepTime,
	cookTime,
	servings,
	wishlistCount,
	tags,
	isSaved,
	onToggleSave,
}: RecipeCardProps) => {
	const totalTime = (prepTime || 0) + (cookTime || 0);

	const handleToggle = useCallback(
		(event: React.MouseEvent<HTMLButtonElement>) => {
			event.stopPropagation();
			event.preventDefault();
			onToggleSave?.(id);
		},
		[id, onToggleSave],
	);

	const content = (
		<article className="group h-full cursor-pointer">
			<div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border-subtle bg-brand-cream">
				{imageUrl ? (
					<Image
						src={imageUrl}
						alt={title}
						fill
						className="object-cover transition-transform duration-300 group-hover:scale-105"
						sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
					/>
				) : (
					<div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-cream-soft to-brand-gold/70 text-brand-secondary">
						<span className="text-4xl">🍳</span>
					</div>
				)}

				{onToggleSave && (
					<button
						type="button"
						onClick={handleToggle}
						className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow transition hover:text-brand-primary"
						aria-label={isSaved ? 'Remove from wishlist' : 'Add to wishlist'}
					>
						<Heart
							className="h-5 w-5"
							fill={isSaved ? '#f57402' : 'transparent'}
							strokeWidth={isSaved ? 1.5 : 2}
							color={isSaved ? '#f57402' : 'currentColor'}
						/>
					</button>
				)}
			</div>

			<div className="mt-3 space-y-2">
				<h3 className="line-clamp-2 text-lg font-semibold text-brand-secondary transition-colors group-hover:text-brand-primary">
					{title}
				</h3>

				{description && <p className="line-clamp-2 text-sm text-gray-600">{description}</p>}

				<div className="flex items-center gap-4 text-sm text-gray-500">
					{totalTime > 0 && (
						<div className="flex items-center gap-1">
							<Clock className="h-4 w-4 text-brand-secondary/70" />
							<span>{totalTime} min</span>
						</div>
					)}
					{servings && (
						<div className="flex items-center gap-1">
							<Users className="h-4 w-4 text-brand-secondary/70" />
							<span>{servings} servings</span>
						</div>
					)}
					{wishlistCount !== undefined && (
						<div className="flex items-center gap-1 text-brand-secondary">
							<Heart className="h-4 w-4" />
							<span>{wishlistCount ?? 0}</span>
						</div>
					)}
				</div>

				<div className="flex items-center gap-2">
					{authorAvatar ? (
						<div className="relative h-6 w-6 overflow-hidden rounded-full border border-border-subtle bg-brand-cream">
							<Image
								src={authorAvatar}
								alt={authorName}
								fill
								className="object-cover"
								sizes="24px"
							/>
						</div>
					) : (
						<div className="h-6 w-6 rounded-full bg-brand-cream" />
					)}
					<span className="text-sm text-brand-secondary/80">{authorName}</span>
				</div>

				{tags && tags.length > 0 && (
					<div className="flex flex-wrap gap-2 pt-1">
						{tags.slice(0, 3).map((tag) => (
							<span key={tag} className="rounded-full bg-brand-cream-soft px-2 py-0.5 text-xs text-brand-secondary">
								{tag}
							</span>
						))}
					</div>
				)}
			</div>
		</article>
	);

	return onToggleSave ? (
		<Link href={`/recipe/${id}`} className="block h-full">
			{content}
		</Link>
	) : (
		content
	);
};

