import type { FeaturedWithTitle } from '@/services/featuredService';

export interface FeaturedSection {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeaturedSectionWithTitles extends FeaturedSection {
  featured: FeaturedWithTitle[];
}

export interface FeaturedGroupedBySections {
  sections: FeaturedSectionWithTitles[];
  uncategorized: FeaturedWithTitle[];
}
