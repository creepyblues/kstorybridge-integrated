/**
 * Genre-to-icon mapping for Trending page navigation
 * Uses Solar icons (bold-duotone variant)
 */

export const GENRE_ICON_MAP: Record<string, string> = {
  // Common genres
  'Horror': 'solar:ghost-bold-duotone',
  'Romance': 'solar:heart-bold-duotone',
  'Romance Fusion': 'solar:hearts-bold-duotone',
  'Rom-com': 'solar:emoji-funny-circle-bold-duotone',
  'Romantic Comedy': 'solar:emoji-funny-circle-bold-duotone',
  'Action': 'solar:bolt-bold-duotone',
  'Thriller': 'solar:danger-triangle-bold-duotone',
  'Fantasy': 'solar:magic-stick-bold-duotone',
  'Sci-Fi': 'solar:planet-bold-duotone',
  'Science Fiction': 'solar:planet-bold-duotone',
  'Drama': 'solar:masks-bold-duotone',
  'Comedy': 'solar:emoji-funny-square-bold-duotone',
  'Mystery': 'solar:magnifer-bold-duotone',
  'Slice of Life': 'solar:cup-hot-bold-duotone',
  'Historical': 'solar:buildings-bold-duotone',
  'Adventure': 'solar:compass-bold-duotone',
  'Sports': 'solar:basketball-bold-duotone',
  'Supernatural': 'solar:star-fall-bold-duotone',
  'Martial Arts': 'solar:bolt-circle-bold-duotone',
  'BL': 'solar:hearts-bold-duotone',
  'GL': 'solar:hearts-bold-duotone',
  'Isekai': 'solar:planet-2-bold-duotone',
  'School': 'solar:notebook-bold-duotone',
  'Office': 'solar:buildings-2-bold-duotone',
  'Medical': 'solar:health-bold-duotone',
  'Legal': 'solar:document-bold-duotone',
  'Crime': 'solar:shield-warning-bold-duotone',
  // Special categories
  'More Titles': 'solar:archive-bold-duotone',
  'Uncategorized': 'solar:folder-bold-duotone',
  // Fallback
  'default': 'solar:bookmark-bold-duotone',
};

/**
 * Get the icon for a genre name
 * @param name - The genre or category name
 * @returns Solar icon string
 */
export function getGenreIcon(name: string): string {
  // Try exact match first
  if (GENRE_ICON_MAP[name]) {
    return GENRE_ICON_MAP[name];
  }

  // Try case-insensitive match
  const lowerName = name.toLowerCase();
  for (const [key, value] of Object.entries(GENRE_ICON_MAP)) {
    if (key.toLowerCase() === lowerName) {
      return value;
    }
  }

  // Try partial match (e.g., "Horror Thriller" matches "Horror")
  for (const [key, value] of Object.entries(GENRE_ICON_MAP)) {
    if (lowerName.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerName)) {
      return value;
    }
  }

  return GENRE_ICON_MAP['default'];
}
