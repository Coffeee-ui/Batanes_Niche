import React from 'react';
import {
  Mountain,
  BedDouble,
  ShoppingBag,
  Bus,
  Fish,
  Sprout,
  HardHat,
  Briefcase,
  type LucideIcon,
} from 'lucide-react';

export type CategoryTint = 'yellow' | 'mint' | 'peach' | 'periwinkle';

export interface CategoryMeta {
  name: string;
  icon: LucideIcon;
  tint: CategoryTint;
  bgClass: string;
  textClass: string;
  borderClass: string;
  badgeClass: string;
}

export const CATEGORY_CONFIG: Record<string, { icon: LucideIcon; tint: CategoryTint }> = {
  tourism: { icon: Mountain, tint: 'mint' },
  hotels: { icon: BedDouble, tint: 'peach' },
  hospitality: { icon: BedDouble, tint: 'peach' },
  retail: { icon: ShoppingBag, tint: 'periwinkle' },
  transport: { icon: Bus, tint: 'yellow' },
  fishing: { icon: Fish, tint: 'periwinkle' },
  farming: { icon: Sprout, tint: 'mint' },
  agriculture: { icon: Sprout, tint: 'mint' },
  construction: { icon: HardHat, tint: 'yellow' },
};

const TINT_CLASSES: Record<
  CategoryTint,
  { bgClass: string; textClass: string; borderClass: string; badgeClass: string }
> = {
  yellow: {
    bgClass: 'bg-tint-yellow',
    textClass: 'text-tint-yellow-foreground',
    borderClass: 'border-tint-yellow-foreground/20',
    badgeClass: 'bg-tint-yellow text-tint-yellow-foreground border-tint-yellow-foreground/25',
  },
  mint: {
    bgClass: 'bg-tint-mint',
    textClass: 'text-tint-mint-foreground',
    borderClass: 'border-tint-mint-foreground/20',
    badgeClass: 'bg-tint-mint text-tint-mint-foreground border-tint-mint-foreground/25',
  },
  peach: {
    bgClass: 'bg-tint-peach',
    textClass: 'text-tint-peach-foreground',
    borderClass: 'border-tint-peach-foreground/20',
    badgeClass: 'bg-tint-peach text-tint-peach-foreground border-tint-peach-foreground/25',
  },
  periwinkle: {
    bgClass: 'bg-tint-periwinkle',
    textClass: 'text-tint-periwinkle-foreground',
    borderClass: 'border-tint-periwinkle-foreground/20',
    badgeClass: 'bg-tint-periwinkle text-tint-periwinkle-foreground border-tint-periwinkle-foreground/25',
  },
};

export function getCategoryMeta(categoryName?: string | null): CategoryMeta {
  const norm = (categoryName || '').toLowerCase().trim();

  let matchedKey: string | null = null;
  if (norm.includes('tour')) matchedKey = 'tourism';
  else if (norm.includes('hotel') || norm.includes('lodg') || norm.includes('hospit')) matchedKey = 'hotels';
  else if (norm.includes('retail') || norm.includes('sale') || norm.includes('store') || norm.includes('shop')) matchedKey = 'retail';
  else if (norm.includes('trans') || norm.includes('driv') || norm.includes('logistic')) matchedKey = 'transport';
  else if (norm.includes('fish') || norm.includes('marine')) matchedKey = 'fishing';
  else if (norm.includes('farm') || norm.includes('agri') || norm.includes('crop')) matchedKey = 'farming';
  else if (norm.includes('construct') || norm.includes('trade') || norm.includes('carpenter') || norm.includes('build')) matchedKey = 'construction';

  const config = matchedKey ? CATEGORY_CONFIG[matchedKey] : { icon: Briefcase, tint: 'yellow' as CategoryTint };
  const tintStyle = TINT_CLASSES[config.tint];

  return {
    name: categoryName || 'General',
    icon: config.icon,
    tint: config.tint,
    ...tintStyle,
  };
}

export interface CategoryIconProps {
  category?: string | null;
  className?: string;
  size?: number;
}

export default function CategoryIcon({ category, className = 'w-4 h-4', size }: CategoryIconProps) {
  const meta = getCategoryMeta(category);
  const Icon = meta.icon;
  return <Icon className={className} size={size} aria-hidden="true" />;
}

export interface CategoryTileProps {
  category?: string | null;
  className?: string;
  iconClassName?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function CategoryTile({
  category,
  className = '',
  iconClassName = '',
  size = 'md',
}: CategoryTileProps) {
  const meta = getCategoryMeta(category);
  const Icon = meta.icon;

  const sizeClasses = {
    sm: 'w-8 h-8 rounded-xl',
    md: 'w-10 h-10 rounded-2xl',
    lg: 'w-12 h-12 rounded-2xl',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 ${sizeClasses[size]} ${meta.bgClass} ${meta.textClass} ${className}`}
      aria-hidden="true"
    >
      <Icon className={`${iconSizes[size]} ${iconClassName}`} />
    </div>
  );
}

export interface CategoryBadgeProps {
  category?: string | null;
  className?: string;
}

export function CategoryBadge({ category, className = '' }: CategoryBadgeProps) {
  if (!category) return null;
  const meta = getCategoryMeta(category);
  const Icon = meta.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${meta.badgeClass} ${className}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{category}</span>
    </span>
  );
}

