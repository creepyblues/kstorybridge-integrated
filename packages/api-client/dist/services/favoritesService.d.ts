import type { Title } from './titlesService';
export type UserFavorite = {
    id: string;
    user_id: string;
    title_id: string;
    created_at: string;
};
export type UserFavoriteInsert = Omit<UserFavorite, 'id' | 'created_at'> & {
    id?: string;
    created_at?: string;
};
export type FavoriteWithTitle = UserFavorite & {
    titles: Title;
};
export declare const favoritesService: {
    getUserFavorites(userId: string): Promise<FavoriteWithTitle[]>;
    isTitleFavorited(userId: string, titleId: string): Promise<boolean>;
    addToFavorites(userId: string, titleId: string): Promise<UserFavorite>;
    removeFromFavorites(userId: string, titleId: string): Promise<void>;
    getFavoritesCount(userId: string): Promise<number>;
};
