/**
 * Comps Navigator Example Data
 *
 * Curated comp combinations organized by use case category.
 * Each example teaches users how to effectively combine comps.
 */

export interface CompExample {
  id: string;
  category: 'genre' | 'tone' | 'theme' | 'character' | 'production' | 'format';
  title: string;
  comps: string[];
  description: string;
  breakdown: string[];
  refinementTips: string[];
  icon: string;
}

export const EXAMPLE_CATEGORIES = [
  { id: 'genre', label: 'Genre Blending', icon: '🎭' },
  { id: 'tone', label: 'Tone', icon: '🎨' },
  { id: 'theme', label: 'Theme', icon: '💡' },
  { id: 'character', label: 'Character', icon: '👤' },
  { id: 'production', label: 'Production', icon: '🎬' },
  { id: 'format', label: 'Format', icon: '📺' }
];

export const COMP_EXAMPLES: CompExample[] = [
  // Genre Blending
  {
    id: 'genre-1',
    category: 'genre',
    title: 'Survival Thriller + Social Commentary',
    comps: ['Squid Game', 'Parasite', 'Black Mirror'],
    description: 'Korean titles exploring desperate circumstances with sharp social commentary and psychological depth',
    breakdown: [
      'Squid Game: Life-or-death survival stakes',
      'Parasite: Class divide and deception themes',
      'Black Mirror: Dystopian psychology and technology'
    ],
    refinementTips: ['more comedic tone', 'female lead', 'lower production budget'],
    icon: '🎭'
  },
  {
    id: 'genre-2',
    category: 'genre',
    title: 'Sci-Fi Mystery + Coming-of-Age',
    comps: ['Stranger Things', 'Dark'],
    description: 'Supernatural mysteries with young protagonists navigating complex realities',
    breakdown: [
      'Stranger Things: Nostalgic sci-fi with teen ensemble',
      'Dark: Complex time mechanics and family mysteries'
    ],
    refinementTips: ['more horror elements', 'set in modern times', 'school setting'],
    icon: '🎭'
  },

  // Tone Specification
  {
    id: 'tone-1',
    category: 'tone',
    title: 'Dark Romance with Hope',
    comps: ['Goblin', 'Crash Landing on You'],
    description: 'Fantasy or cross-border romance balancing tragedy with warmth and humor',
    breakdown: [
      'Goblin: Immortal romance with destiny themes',
      'Crash Landing on You: Star-crossed lovers with cultural barriers'
    ],
    refinementTips: ['more comedic relief', 'tragic ending', 'supernatural elements'],
    icon: '🎨'
  },
  {
    id: 'tone-2',
    category: 'tone',
    title: 'Classic Emotional Romance',
    comps: ['The Notebook', 'Pride and Prejudice'],
    description: 'Romantic dramas focused on emotional authenticity and character chemistry',
    breakdown: [
      'The Notebook: Epic lifetime romance with obstacles',
      'Pride and Prejudice: Class divide and misunderstandings overcome'
    ],
    refinementTips: ['modern setting', 'class divide theme', 'family opposition'],
    icon: '🎨'
  },

  // Thematic Focus
  {
    id: 'theme-1',
    category: 'theme',
    title: 'Class Struggle + Survival',
    comps: ['Parasite', 'Squid Game'],
    description: 'Stories examining economic inequality through extreme dramatic situations',
    breakdown: [
      'Parasite: Infiltration and class deception',
      'Squid Game: Desperation-driven life-or-death games'
    ],
    refinementTips: ['more satirical', 'family dynamics', 'revenge plot'],
    icon: '💡'
  },
  {
    id: 'theme-2',
    category: 'theme',
    title: 'Female Empowerment Comedy',
    comps: ['Strong Girl Bong-soon', 'Legally Blonde'],
    description: 'Comedy-dramas featuring women defying stereotypes with humor and strength',
    breakdown: [
      'Strong Girl Bong-soon: Superhuman strength meets romance',
      'Legally Blonde: Intelligence triumphs over prejudice'
    ],
    refinementTips: ['supernatural powers', 'workplace setting', 'romance subplot'],
    icon: '💡'
  },

  // Character Types
  {
    id: 'character-1',
    category: 'character',
    title: 'Antihero Transformation',
    comps: ['Breaking Bad', 'Dexter'],
    description: 'Morally complex protagonists who cross ethical lines with compelling justifications',
    breakdown: [
      'Breaking Bad: Ordinary person becomes criminal mastermind',
      'Dexter: Vigilante justice with dark methods'
    ],
    refinementTips: ['redemption arc', 'psychological thriller', 'family man'],
    icon: '👤'
  },
  {
    id: 'character-2',
    category: 'character',
    title: 'Crime with Moral Complexity',
    comps: ['Money Heist', 'Breaking Bad', 'Ozark'],
    description: 'High-stakes crime scenarios with deep character development and moral ambiguity',
    breakdown: [
      'Money Heist: Elaborate heist with ensemble cast',
      'Breaking Bad: Transformation and consequences',
      'Ozark: Family survival through crime'
    ],
    refinementTips: ['female lead', 'ensemble cast', 'more action'],
    icon: '👤'
  },

  // Production Style
  {
    id: 'production-1',
    category: 'production',
    title: 'Intimate Family Drama',
    comps: ['Reply 1988', 'This Is Us'],
    description: 'Slice-of-life family stories emphasizing emotional storytelling over spectacle',
    breakdown: [
      'Reply 1988: Nostalgic neighborhood family bonds',
      'This Is Us: Multi-generational family connections'
    ],
    refinementTips: ['lower production budget', 'episodic structure', 'period setting'],
    icon: '🎬'
  },
  {
    id: 'production-2',
    category: 'production',
    title: 'Epic Fantasy Spectacle',
    comps: ['Game of Thrones', 'The Witcher'],
    description: 'Large-scale fantasy with significant VFX and world-building production values',
    breakdown: [
      'Game of Thrones: Political intrigue with epic battles',
      'The Witcher: Monster hunting with rich mythology'
    ],
    refinementTips: ['lower budget', 'more grounded', 'historical setting'],
    icon: '🎬'
  },

  // Format Matching
  {
    id: 'format-1',
    category: 'format',
    title: 'Anthology Stories',
    comps: ['Black Mirror', 'Love, Death & Robots'],
    description: 'Standalone episodes exploring varied stories under unified thematic concepts',
    breakdown: [
      'Black Mirror: Technology dystopia with different casts',
      'Love, Death & Robots: Sci-fi/fantasy with animation variety'
    ],
    refinementTips: ['technology themes', 'horror elements', 'single storyline'],
    icon: '📺'
  },
  {
    id: 'format-2',
    category: 'format',
    title: 'Multi-Season Character Arcs',
    comps: ['Breaking Bad', 'Succession'],
    description: 'Long-form storytelling tracking gradual character transformation across seasons',
    breakdown: [
      'Breaking Bad: 5-season moral descent',
      'Succession: Family power dynamics over multiple seasons'
    ],
    refinementTips: ['family business', 'power dynamics', 'shorter series'],
    icon: '📺'
  }
];

/**
 * Get examples by category
 */
export function getExamplesByCategory(category: string): CompExample[] {
  return COMP_EXAMPLES.filter(ex => ex.category === category);
}

/**
 * Get all unique refinement tips across all examples
 */
export function getAllRefinementTips(): string[] {
  const tips = new Set<string>();
  COMP_EXAMPLES.forEach(ex => {
    ex.refinementTips.forEach(tip => tips.add(tip));
  });
  return Array.from(tips).sort();
}
