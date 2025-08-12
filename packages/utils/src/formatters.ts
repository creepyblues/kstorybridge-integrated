// Common formatting utilities used across applications

export const formatNumber = (num: number): string => {
  if (!num) return '0';
  return num.toLocaleString();
};

export const formatViews = (views: number): string => {
  if (!views) return '0';
  return views.toLocaleString();
};

export const formatLikes = (likes: number): string => {
  if (!likes || likes === 0) return 'N/A';
  return likes.toLocaleString();
};

export const formatGenre = (genre: string | string[]): string | string[] => {
  if (Array.isArray(genre)) {
    return genre.map(g => g.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()));
  }
  return genre.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export const formatContentFormat = (format: string): string => {
  return format.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};