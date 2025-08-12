import type { Title } from './titlesService';
export type Featured = {
    id: string;
    title_id: string;
    note: string | null;
    created_at: string;
    updated_at: string;
};
export type FeaturedInsert = Omit<Featured, 'id' | 'created_at' | 'updated_at'> & {
    id?: string;
    created_at?: string;
    updated_at?: string;
};
export type FeaturedWithTitle = Featured & {
    titles: Title;
};
export declare const featuredService: {
    getMostRecentFeatured(): Promise<FeaturedWithTitle | null>;
    getFeaturedByViews(limit?: number): Promise<FeaturedWithTitle[]>;
    getAllFeatured(): Promise<FeaturedWithTitle[]>;
    getFeaturedTitles(): Promise<FeaturedWithTitle[]>;
    createFeatured(featured: FeaturedInsert): Promise<Featured>;
    updateFeatured(id: string, updates: Partial<FeaturedInsert>): Promise<Featured>;
    deleteFeatured(id: string): Promise<void>;
};
