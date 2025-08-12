// Common formatting utilities used across applications
export const formatNumber = (num) => {
    if (!num)
        return '0';
    return num.toLocaleString();
};
export const formatViews = (views) => {
    if (!views)
        return '0';
    return views.toLocaleString();
};
export const formatLikes = (likes) => {
    if (!likes || likes === 0)
        return 'N/A';
    return likes.toLocaleString();
};
export const formatGenre = (genre) => {
    if (Array.isArray(genre)) {
        return genre.map(g => g.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()));
    }
    return genre.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};
export const formatContentFormat = (format) => {
    return format.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};
