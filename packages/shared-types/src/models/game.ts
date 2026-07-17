/**
 * Game Models — TIK TAK RUN Shared Types
 */

import type { GameDifficulty, GenreFilter } from '../enums';

export interface City {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Branch {
  id: number;
  name: string;
  cityId: number;
  address: string;
  phone?: string;
  lat?: string;
  lng?: string;
  isActive: boolean;
  managerId?: number;
  createdAt: string;
  updatedAt: string;

  // Relations
  city?: City;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
  color: string;
  displayOrder: number;
  genre: GenreFilter;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GameImage {
  id: number;
  gameId: number;
  url: string;
  displayOrder: number;
  caption?: string;
  createdAt: string;
}

export interface Game {
  id: number;
  slug: string;
  title: string;
  subtitle?: string;
  categoryId: number;
  branchId: number;
  description: string;
  scenario?: string;
  fearLevel: number;
  difficulty: GameDifficulty;
  minPlayers: number;
  maxPlayers: number;
  durationMinutes: number;
  /** BigInt → string (تومان) */
  pricePerPerson: string;
  siteRank: string;
  userRankCached?: string;
  totalReviews: number;
  teaserUrl?: string;
  coverImage?: string;
  tags: string[];
  isFeatured: boolean;
  isActive: boolean;
  weeklyDiscountPercent?: number;
  availableSlots?: number;
  createdAt: string;
  updatedAt: string;

  // Relations
  category?: Category;
  branch?: Branch;
  images?: GameImage[];
}

/** بازی با اطلاعات کامل برای صفحه جزئیات */
export interface GameDetail extends Game {
  category: Category;
  branch: Branch;
  images: GameImage[];
  reviewStats?: GameReviewStats;
}

export interface GameReviewStats {
  average: string;
  total: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

/** کارت بازی برای لیست */
export interface GameCard {
  id: number;
  slug: string;
  title: string;
  subtitle?: string;
  coverImage?: string;
  fearLevel: number;
  difficulty: GameDifficulty;
  minPlayers: number;
  maxPlayers: number;
  durationMinutes: number;
  /** BigInt → string */
  pricePerPerson: string;
  siteRank: string;
  userRankCached?: string;
  isFeatured: boolean;
  weeklyDiscountPercent?: number;
  availableSlots?: number;
  categoryName: string;
  categoryIcon: string;
  branchName: string;
  cityName: string;
}
