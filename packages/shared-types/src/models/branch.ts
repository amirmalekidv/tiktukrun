/**
 * Branch & City Models — TIK TAK RUN Shared Types
 */

export interface City {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;

  branches?: Branch[];
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

  city?: City;
}

/** خلاصه شعبه برای نمایش در لیست */
export interface BranchSummary {
  id: number;
  name: string;
  cityName: string;
  citySlug: string;
  address: string;
  phone?: string;
  isActive: boolean;
}
