import type { Database } from '../types';
export type Title = Database['public']['Tables']['titles']['Row'];
export type TitleInsert = Database['public']['Tables']['titles']['Insert'];
export type TitleUpdate = Database['public']['Tables']['titles']['Update'];
export declare const titlesService: {
    getAllTitles(): Promise<Title[]>;
    getTitlesByCreator(creatorId: string): Promise<Title[]>;
    getTitlesByCreatorRights(userId: string): Promise<Title[]>;
    getTitleById(titleId: string): Promise<Title>;
    getTitlesWithPitches(limit?: number): Promise<Title[]>;
    createTitle(title: TitleInsert): Promise<Title>;
    updateTitle(titleId: string, updates: TitleUpdate): Promise<Title>;
    deleteTitle(titleId: string): Promise<void>;
    searchTitles(query: string, filters?: {
        genre?: string;
        content_format?: string;
    }): Promise<Title[]>;
};
