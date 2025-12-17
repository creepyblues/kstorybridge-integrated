/**
 * SINGLE SOURCE OF TRUTH: All Suggestion Examples
 *
 * This file is the canonical source for ALL suggestion data across the app:
 * - Comps Navigator examples (comp combinations)
 * - Mandate Matcher examples (mandate descriptions)
 * - Chatbot suggested queries
 * - Hero section sample searches
 *
 * POLICY: Any component displaying suggestions MUST import from this file.
 * Do NOT hardcode examples in individual components.
 *
 * Optimized for 244 Korean titles in the database covering:
 * - Romance/Romantasy (85+ titles)
 * - BL/LGBTQ+ (40+ titles)
 * - Fantasy/Supernatural (29+ titles)
 * - Thriller/Horror (14+ titles)
 * - K-pop/Idol (12+ titles)
 *
 * See: docs/features/COMPS_NAVIGATOR_SAMPLES.md for full documentation
 * See: docs/guides/SUGGESTION_DATA_POLICY.md for usage policy
 *
 * Last Updated: 2025-12-17
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
  // ============================================
  // GENRE BLENDING (8 examples)
  // ============================================
  {
    id: 'genre-1',
    category: 'genre',
    title: 'Period Romance',
    comps: ['Outlander', 'Bridgerton'],
    description: 'Historical romance with forbidden love and noble intrigue',
    breakdown: [
      'Outlander: Time-crossed romance with historical setting',
      'Bridgerton: Regency-era romance with society drama'
    ],
    refinementTips: ['fantasy elements', 'darker tone', 'action scenes'],
    icon: '🎭'
  },
  {
    id: 'genre-2',
    category: 'genre',
    title: 'Supernatural Fantasy Romance',
    comps: ['Twilight', 'A Court of Thorns and Roses'],
    description: 'Fantasy romance with dangerous supernatural love interests',
    breakdown: [
      'Twilight: Forbidden romance with immortal beings',
      'ACOTAR: Fae romance with dark fantasy world'
    ],
    refinementTips: ['werewolves', 'demons', 'Korean mythology'],
    icon: '🎭'
  },
  {
    id: 'genre-3',
    category: 'genre',
    title: 'Korean Horror Exorcism',
    comps: ['The Conjuring', 'The Exorcist'],
    description: 'Supernatural horror with possession and Korean shamanism',
    breakdown: [
      'The Conjuring: Paranormal investigation with exorcism',
      'The Exorcist: Demonic possession and spiritual warfare'
    ],
    refinementTips: ['more romance', 'mountain spirits', 'detective element'],
    icon: '🎭'
  },
  {
    id: 'genre-4',
    category: 'genre',
    title: 'Zombie Survival Thriller',
    comps: ['Train to Busan', 'World War Z'],
    description: 'Zombie apocalypse with character-driven survival drama',
    breakdown: [
      'Train to Busan: Contained survival with emotional stakes',
      'World War Z: Global scale zombie outbreak'
    ],
    refinementTips: ['romance subplot', 'smaller cast', 'psychological horror'],
    icon: '🎭'
  },
  {
    id: 'genre-5',
    category: 'genre',
    title: 'Superhero School',
    comps: ['My Hero Academia', 'Spider-Man'],
    description: 'Superhero origin story with school setting',
    breakdown: [
      'My Hero Academia: Hero academy with underdog protagonist',
      'Spider-Man: Coming-of-age superhero journey'
    ],
    refinementTips: ['Korean setting', 'darker tone', 'team dynamics'],
    icon: '🎭'
  },
  {
    id: 'genre-6',
    category: 'genre',
    title: 'Sci-Fi Romance',
    comps: ['Her', 'Ex Machina'],
    description: 'Science fiction romance with AI or technology themes',
    breakdown: [
      'Her: Emotional AI romance with isolation themes',
      'Ex Machina: Android consciousness and human connection'
    ],
    refinementTips: ['smartphone setting', 'comedic tone', 'high school'],
    icon: '🎭'
  },
  {
    id: 'genre-7',
    category: 'genre',
    title: 'Whimsical Supernatural',
    comps: ['Spirited Away', 'Howl\'s Moving Castle'],
    description: 'Magical fantasy with transformation and spirit worlds',
    breakdown: [
      'Spirited Away: Spirit world journey with growth',
      'Howl\'s Moving Castle: Curse-breaking romance adventure'
    ],
    refinementTips: ['goblin mythology', 'modern setting', 'romance focus'],
    icon: '🎭'
  },
  {
    id: 'genre-8',
    category: 'genre',
    title: 'Time Travel Romance',
    comps: ['The Time Traveler\'s Wife', 'About Time'],
    description: 'Romance with time travel mechanics and fate themes',
    breakdown: [
      'Time Traveler\'s Wife: Uncontrollable time jumps affecting love',
      'About Time: Using time travel for romance and life lessons'
    ],
    refinementTips: ['mystery element', 'murder prevention', 'high school setting'],
    icon: '🎭'
  },

  // ============================================
  // TONE (6 examples)
  // ============================================
  {
    id: 'tone-1',
    category: 'tone',
    title: 'Sweet LGBTQ+ Romance',
    comps: ['Heartstopper', 'Love, Simon'],
    description: 'Heartwarming queer romance with coming-of-age charm',
    breakdown: [
      'Heartstopper: Gentle teen BL with hopeful tone',
      'Love, Simon: Coming out journey with supportive ending'
    ],
    refinementTips: ['college setting', 'more drama', 'adult characters'],
    icon: '🎨'
  },
  {
    id: 'tone-2',
    category: 'tone',
    title: 'Intense Forbidden BL',
    comps: ['Call Me By Your Name', 'Brokeback Mountain'],
    description: 'Emotionally intense BL with forbidden love themes',
    breakdown: [
      'Call Me By Your Name: Summer romance with age gap',
      'Brokeback Mountain: Secret love defying social norms'
    ],
    refinementTips: ['revenge subplot', 'darker tone', 'happy ending'],
    icon: '🎨'
  },
  {
    id: 'tone-3',
    category: 'tone',
    title: 'Tear-Jerker Romance',
    comps: ['The Notebook', 'A Walk to Remember'],
    description: 'Emotionally devastating romance with bittersweet moments',
    breakdown: [
      'The Notebook: Epic lifetime love story with obstacles',
      'A Walk to Remember: Transformative love with tragic stakes'
    ],
    refinementTips: ['happy ending', 'fantasy elements', 'more comedy'],
    icon: '🎨'
  },
  {
    id: 'tone-4',
    category: 'tone',
    title: 'Fun Comedy BL',
    comps: ['Bros', 'Fire Island'],
    description: 'Light-hearted modern BL comedy with humor',
    breakdown: [
      'Bros: Rom-com about commitment-phobic gay men',
      'Fire Island: Pride & Prejudice retelling with gay cast'
    ],
    refinementTips: ['fake dating', 'idol setting', 'workplace romance'],
    icon: '🎨'
  },
  {
    id: 'tone-5',
    category: 'tone',
    title: 'Psychological Thriller',
    comps: ['Gone Girl', 'Fatal Attraction'],
    description: 'Dark psychological drama with twisted relationships',
    breakdown: [
      'Gone Girl: Marriage thriller with unreliable narrator',
      'Fatal Attraction: Obsession and dangerous affairs'
    ],
    refinementTips: ['revenge plot', 'female protagonist', 'supernatural element'],
    icon: '🎨'
  },
  {
    id: 'tone-6',
    category: 'tone',
    title: 'Quirky Comedy',
    comps: ['Bridesmaids', 'The Hangover'],
    description: 'Chaotic ensemble comedy with outrageous situations',
    breakdown: [
      'Bridesmaids: Female ensemble comedy with heart',
      'The Hangover: Wild adventure comedy with mystery'
    ],
    refinementTips: ['family comedy', 'slice of life', 'pet companion'],
    icon: '🎨'
  },

  // ============================================
  // THEME (6 examples)
  // ============================================
  {
    id: 'theme-1',
    category: 'theme',
    title: 'Found Family',
    comps: ['Reply 1988', 'Modern Family'],
    description: 'Heartwarming stories about chosen families and bonds',
    breakdown: [
      'Reply 1988: Nostalgic neighborhood family dynamics',
      'Modern Family: Diverse family structures with humor'
    ],
    refinementTips: ['workplace setting', 'single protagonist', 'more drama'],
    icon: '💡'
  },
  {
    id: 'theme-2',
    category: 'theme',
    title: 'Fake Dating / Contract Romance',
    comps: ['How to Lose a Guy in 10 Days', '10 Things I Hate About You'],
    description: 'Romance starting from fake relationships or bets',
    breakdown: [
      'How to Lose a Guy: Competing agendas in fake relationship',
      '10 Things: Paid to date the difficult girl'
    ],
    refinementTips: ['BL version', 'idol setting', 'cohabitation'],
    icon: '💡'
  },
  {
    id: 'theme-3',
    category: 'theme',
    title: 'Villainess Redemption',
    comps: ['Maleficent', 'Wicked'],
    description: 'Misunderstood antagonist gets a second chance',
    breakdown: [
      'Maleficent: Villain origin story with redemption',
      'Wicked: Sympathetic take on the villain\'s perspective'
    ],
    refinementTips: ['isekai element', 'romance focus', 'fantasy kingdom'],
    icon: '💡'
  },
  {
    id: 'theme-4',
    category: 'theme',
    title: 'Isekai / Reincarnation',
    comps: ['Groundhog Day', 'Edge of Tomorrow'],
    description: 'Time loop or second chance at life stories',
    breakdown: [
      'Groundhog Day: Reliving the same day for growth',
      'Edge of Tomorrow: Time loop with action stakes'
    ],
    refinementTips: ['fantasy novel setting', 'romance focus', 'revenge plot'],
    icon: '💡'
  },
  {
    id: 'theme-5',
    category: 'theme',
    title: 'Game World Adventure',
    comps: ['Ready Player One', 'Jumanji'],
    description: 'Characters trapped in or transported to game worlds',
    breakdown: [
      'Ready Player One: Virtual reality gaming world',
      'Jumanji: Transported into game with new bodies'
    ],
    refinementTips: ['gacha game', 'NPC protagonist', 'romance subplot'],
    icon: '💡'
  },
  {
    id: 'theme-6',
    category: 'theme',
    title: 'Pet Companion',
    comps: ['Marley & Me', 'A Dog\'s Purpose'],
    description: 'Heartwarming stories with animal companions',
    breakdown: [
      'Marley & Me: Life journey with beloved pet',
      'A Dog\'s Purpose: Reincarnating dog finding meaning'
    ],
    refinementTips: ['talking pet', 'cat protagonist', 'magical transformation'],
    icon: '💡'
  },

  // ============================================
  // CHARACTER (6 examples)
  // ============================================
  {
    id: 'character-1',
    category: 'character',
    title: 'Royal BL Romance',
    comps: ['Red, White & Royal Blue', 'The Prince and the Pauper'],
    description: 'BL romance with royalty or status gap',
    breakdown: [
      'RW&RB: Prince and president\'s son enemies-to-lovers',
      'Prince and Pauper: Identity swap between classes'
    ],
    refinementTips: ['fantasy kingdom', 'reincarnation', 'knight protagonist'],
    icon: '👤'
  },
  {
    id: 'character-2',
    category: 'character',
    title: 'Strong Female Lead',
    comps: ['Legally Blonde', 'Miss Congeniality'],
    description: 'Empowered heroines defying expectations',
    breakdown: [
      'Legally Blonde: Underestimated woman proves worth',
      'Miss Congeniality: Transformation while staying true to self'
    ],
    refinementTips: ['supernatural powers', 'revenge plot', 'rivals to lovers'],
    icon: '👤'
  },
  {
    id: 'character-3',
    category: 'character',
    title: 'Celebrity / Commoner Gap',
    comps: ['The Devil Wears Prada', 'Notting Hill'],
    description: 'Romance between famous and ordinary people',
    breakdown: [
      'Devil Wears Prada: Fashion world with demanding boss',
      'Notting Hill: Movie star falls for bookshop owner'
    ],
    refinementTips: ['K-pop idol', 'fan cafe setting', 'secret identity'],
    icon: '👤'
  },
  {
    id: 'character-4',
    category: 'character',
    title: 'Monster Romance',
    comps: ['Beauty and the Beast', 'Shrek'],
    description: 'Romance with monster or outcast characters',
    breakdown: [
      'Beauty and the Beast: Love transforms the monster',
      'Shrek: Finding love as an outcast'
    ],
    refinementTips: ['werewolf', 'demon', 'Korean mythology creature'],
    icon: '👤'
  },
  {
    id: 'character-5',
    category: 'character',
    title: 'Transformation Story',
    comps: ['Cinderella', 'Pretty Woman'],
    description: 'Rags-to-riches transformation romance',
    breakdown: [
      'Cinderella: Magical transformation for true love',
      'Pretty Woman: Social transformation through love'
    ],
    refinementTips: ['social media angle', 'beauty industry', 'double life'],
    icon: '👤'
  },
  {
    id: 'character-6',
    category: 'character',
    title: 'Obsessive Mentor',
    comps: ['Black Swan', 'Whiplash'],
    description: 'Toxic mentor relationships and obsession',
    breakdown: [
      'Black Swan: Perfectionism driving madness in ballet',
      'Whiplash: Abusive mentor pushing musical prodigy'
    ],
    refinementTips: ['influencer setting', 'revenge twist', 'romantic element'],
    icon: '👤'
  },

  // ============================================
  // PRODUCTION STYLE (5 examples)
  // ============================================
  {
    id: 'production-1',
    category: 'production',
    title: 'K-pop Industry Drama',
    comps: ['A Star is Born', 'La La Land'],
    description: 'Entertainment industry romance and drama',
    breakdown: [
      'A Star is Born: Rising star with troubled mentor',
      'La La Land: Dreamers pursuing careers and love'
    ],
    refinementTips: ['idol group', 'trainee story', 'fan perspective'],
    icon: '🎬'
  },
  {
    id: 'production-2',
    category: 'production',
    title: 'Cozy Slice-of-Life',
    comps: ['Gilmore Girls', 'Reply 1988'],
    description: 'Warm, dialogue-driven stories with intimate moments',
    breakdown: [
      'Gilmore Girls: Fast-paced dialogue, small-town charm',
      'Reply 1988: Nostalgic everyday life with emotional depth'
    ],
    refinementTips: ['food-focused', 'pet companion', 'work comedy'],
    icon: '🎬'
  },
  {
    id: 'production-3',
    category: 'production',
    title: 'Epic Fantasy Kingdom',
    comps: ['Game of Thrones', 'The Witcher'],
    description: 'Epic fantasy with political intrigue and action',
    breakdown: [
      'Game of Thrones: Political intrigue with fantasy elements',
      'The Witcher: Monster hunting with moral complexity'
    ],
    refinementTips: ['romance focus', 'single protagonist', 'lighter tone'],
    icon: '🎬'
  },
  {
    id: 'production-4',
    category: 'production',
    title: 'High School Romance',
    comps: ['Mean Girls', 'To All the Boys I\'ve Loved Before'],
    description: 'Teen romance with school social dynamics',
    breakdown: [
      'Mean Girls: Social hierarchy and cliques',
      'To All the Boys: Secret crush letters exposed'
    ],
    refinementTips: ['supernatural element', 'bullying theme', 'transformation'],
    icon: '🎬'
  },
  {
    id: 'production-5',
    category: 'production',
    title: 'Artistic GL Romance',
    comps: ['Portrait of a Lady on Fire', 'Carol'],
    description: 'Slow-burn artistic GL with period aesthetics',
    breakdown: [
      'Portrait of a Lady on Fire: Artist and muse forbidden love',
      'Carol: 1950s lesbian romance with societal pressure'
    ],
    refinementTips: ['modern setting', 'school setting', 'comedic tone'],
    icon: '🎬'
  },

  // ============================================
  // FORMAT (5 examples)
  // ============================================
  {
    id: 'format-1',
    category: 'format',
    title: 'Episodic Romance Series',
    comps: ['Sex and the City', 'Emily in Paris'],
    description: 'Romance series with episodic dating adventures',
    breakdown: [
      'Sex and the City: Dating adventures with friend dynamics',
      'Emily in Paris: Fish-out-of-water romance, glamorous setting'
    ],
    refinementTips: ['workplace focus', 'smaller cast', 'K-drama style'],
    icon: '📺'
  },
  {
    id: 'format-2',
    category: 'format',
    title: 'Intense Character Drama',
    comps: ['Normal People', 'Fleabag'],
    description: 'Short-form drama with deep character exploration',
    breakdown: [
      'Normal People: On-off relationship across years',
      'Fleabag: Raw, fourth-wall-breaking emotional journey'
    ],
    refinementTips: ['longer series', 'ensemble cast', 'lighter tone'],
    icon: '📺'
  },
  {
    id: 'format-3',
    category: 'format',
    title: 'Reality Show Romance',
    comps: ['The Bachelor', 'Love Island'],
    description: 'Romance in competition or reality show format',
    breakdown: [
      'The Bachelor: Competition for one person\'s love',
      'Love Island: Coupling and re-coupling drama'
    ],
    refinementTips: ['idol competition', 'virtual marriage', 'workplace'],
    icon: '📺'
  },
  {
    id: 'format-4',
    category: 'format',
    title: 'Murder Mystery',
    comps: ['Knives Out', 'Clue'],
    description: 'Whodunit mystery with ensemble suspects',
    breakdown: [
      'Knives Out: Family murder mystery with twists',
      'Clue: Classic ensemble mystery with multiple endings'
    ],
    refinementTips: ['romance subplot', 'supernatural element', 'time travel'],
    icon: '📺'
  },
  {
    id: 'format-5',
    category: 'format',
    title: 'Fairy Tale Retelling',
    comps: ['The Princess Bride', 'Stardust'],
    description: 'Fantasy adventure with fairy tale elements',
    breakdown: [
      'Princess Bride: Romantic adventure with fairy tale frame',
      'Stardust: Magical quest for fallen star'
    ],
    refinementTips: ['villainess perspective', 'isekai element', 'dragon companion'],
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

/**
 * Get random examples for quick start suggestions
 */
export function getRandomExamples(count: number = 4): CompExample[] {
  const shuffled = [...COMP_EXAMPLES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Search examples by keyword
 */
export function searchExamples(query: string): CompExample[] {
  const lowerQuery = query.toLowerCase();
  return COMP_EXAMPLES.filter(ex =>
    ex.title.toLowerCase().includes(lowerQuery) ||
    ex.description.toLowerCase().includes(lowerQuery) ||
    ex.comps.some(c => c.toLowerCase().includes(lowerQuery))
  );
}

// ============================================
// MANDATE EXAMPLES
// ============================================

export interface MandateExample {
  id: string;
  category: string;
  title: string;
  mandateText: string;
  breakdown: string[];
}

export const MANDATE_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'Streaming', label: 'Streaming' },
  { id: 'Broadcast', label: 'Broadcast' },
  { id: 'Film', label: 'Film' },
  { id: 'International', label: 'International' },
  { id: 'Genre', label: 'Genre' },
  { id: 'Demographic', label: 'Demographic' }
];

export const MANDATE_EXAMPLES: MandateExample[] = [
  // Streaming Platform Mandates
  {
    id: 'streaming-1',
    category: 'Streaming',
    title: 'Fantasy Romance for Netflix',
    mandateText: 'Looking for fantasy romance with strong female leads in aristocratic settings. Prefer completed series with 50+ episodes. For Netflix adaptation.',
    breakdown: [
      'Genre: Fantasy romance',
      'Protagonist: Strong female lead',
      'Setting: Aristocratic/noble',
      'Status: Completed series',
      'Distribution: Netflix adaptation'
    ]
  },
  {
    id: 'streaming-2',
    category: 'Streaming',
    title: 'Mainstream BL Romance',
    mandateText: 'Seeking BL romance suitable for mainstream adaptation. Sweet tone preferred, college or workplace setting. Target: younger millennial audience.',
    breakdown: [
      'Genre: BL romance',
      'Tone: Sweet, heartwarming',
      'Setting: College/workplace',
      'Appeal: Mainstream crossover',
      'Audience: Younger millennials'
    ]
  },
  {
    id: 'streaming-3',
    category: 'Streaming',
    title: 'Supernatural Korean Thriller',
    mandateText: 'Need supernatural thriller with Korean mythology (shamanism, exorcism, mountain spirits). Limited series format, 8-10 episodes.',
    breakdown: [
      'Genre: Supernatural thriller',
      'Elements: Korean shamanism/exorcism',
      'Mythology: Mountain spirits',
      'Format: Limited series (8-10 eps)',
      'Tone: Horror/suspense'
    ]
  },
  {
    id: 'streaming-4',
    category: 'Streaming',
    title: 'K-pop Industry Drama',
    mandateText: 'K-pop industry romance or drama with behind-the-scenes idol life. Comedic tone acceptable. For youth-targeted streaming.',
    breakdown: [
      'Genre: K-pop/idol drama',
      'Setting: Entertainment industry',
      'Tone: Comedic/light',
      'Audience: Youth-targeted',
      'Focus: Behind-the-scenes'
    ]
  },
  {
    id: 'streaming-5',
    category: 'Streaming',
    title: 'Zombie Survival Drama',
    mandateText: 'Zombie apocalypse with character-driven survival. Looking for fresh take on genre. Film or limited series.',
    breakdown: [
      'Genre: Zombie survival',
      'Focus: Character-driven',
      'Tone: Fresh approach',
      'Format: Film or limited series',
      'Scale: Apocalyptic'
    ]
  },

  // Broadcast Network Mandates
  {
    id: 'broadcast-1',
    category: 'Broadcast',
    title: 'Family Primetime Comedy',
    mandateText: 'Heartwarming family comedy with multi-generational cast. Episodic format, suitable for primetime broadcast.',
    breakdown: [
      'Genre: Family comedy',
      'Cast: Multi-generational',
      'Format: Episodic',
      'Slot: Primetime broadcast',
      'Tone: Heartwarming'
    ]
  },
  {
    id: 'broadcast-2',
    category: 'Broadcast',
    title: 'Clean High School Romance',
    mandateText: 'High school romance with relatable teen protagonists. Coming-of-age themes, nothing too mature.',
    breakdown: [
      'Genre: High school romance',
      'Protagonists: Relatable teens',
      'Themes: Coming-of-age',
      'Rating: Clean/appropriate',
      'Tone: Sweet/innocent'
    ]
  },
  {
    id: 'broadcast-3',
    category: 'Broadcast',
    title: 'Epic Period Romance',
    mandateText: 'Period drama romance set in Joseon era or fantasy historical setting. Epic scope, 16+ episodes.',
    breakdown: [
      'Genre: Period drama romance',
      'Era: Joseon/historical fantasy',
      'Scope: Epic/grand',
      'Episodes: 16+',
      'Scale: Premium production'
    ]
  },
  {
    id: 'broadcast-4',
    category: 'Broadcast',
    title: 'Contract Romance Rom-Com',
    mandateText: 'Romantic comedy with contract/fake relationship premise. Light tone, happy ending required.',
    breakdown: [
      'Genre: Romantic comedy',
      'Trope: Fake/contract relationship',
      'Tone: Light and fun',
      'Ending: Happy ending required',
      'Appeal: Feel-good'
    ]
  },

  // Film Studio Mandates
  {
    id: 'film-1',
    category: 'Film',
    title: 'Time Travel Romance Feature',
    mandateText: 'Time travel romance with mystery elements. Feature film potential, emotional payoff required.',
    breakdown: [
      'Genre: Time travel romance',
      'Elements: Mystery subplot',
      'Format: Feature film',
      'Emotion: Strong payoff',
      'Structure: Self-contained'
    ]
  },
  {
    id: 'film-2',
    category: 'Film',
    title: 'Korean Horror Possession',
    mandateText: 'Horror film with possession/exorcism themes. Korean shamanism angle preferred.',
    breakdown: [
      'Genre: Horror',
      'Subgenre: Possession/exorcism',
      'Culture: Korean shamanism',
      'Tone: Terrifying',
      'Format: Feature film'
    ]
  },
  {
    id: 'film-3',
    category: 'Film',
    title: 'Oscar-Bait Romance Drama',
    mandateText: 'Romantic drama with tragic elements. Oscar-bait potential, literary quality.',
    breakdown: [
      'Genre: Romantic drama',
      'Tone: Tragic/bittersweet',
      'Quality: Award-worthy',
      'Style: Literary',
      'Appeal: Critical acclaim'
    ]
  },
  {
    id: 'film-4',
    category: 'Film',
    title: 'Superhero Franchise Starter',
    mandateText: 'Action fantasy with superhero elements. Origin story format, franchise potential.',
    breakdown: [
      'Genre: Action fantasy',
      'Elements: Superhero',
      'Format: Origin story',
      'Potential: Franchise',
      'Scale: Blockbuster'
    ]
  },

  // International Adaptation Mandates
  {
    id: 'international-1',
    category: 'International',
    title: 'Western Villainess Isekai',
    mandateText: 'Looking for villainess/isekai romance that could adapt to Western fantasy setting.',
    breakdown: [
      'Genre: Villainess/isekai romance',
      'Adaptation: Western-friendly',
      'Setting: Fantasy kingdom',
      'Tropes: Reincarnation/transmigration',
      'Appeal: Global audience'
    ]
  },
  {
    id: 'international-2',
    category: 'International',
    title: 'Crossover LGBTQ+ Content',
    mandateText: 'LGBTQ+ content with crossover appeal. Must work for both Asian and Western markets.',
    breakdown: [
      'Genre: LGBTQ+ romance',
      'Appeal: Cross-cultural',
      'Markets: Asia + Western',
      'Tone: Universal themes',
      'Adaptation: Flexible setting'
    ]
  },
  {
    id: 'international-3',
    category: 'International',
    title: 'Universal Celebrity Romance',
    mandateText: 'Celebrity romance that translates across cultures. Entertainment industry setting.',
    breakdown: [
      'Genre: Celebrity romance',
      'Setting: Entertainment industry',
      'Appeal: Cross-cultural',
      'Themes: Fame, love, identity',
      'Adaptation: Universal'
    ]
  },
  {
    id: 'international-4',
    category: 'International',
    title: 'YA Supernatural Romance',
    mandateText: 'Supernatural romance similar to Twilight franchise. YA audience, series potential.',
    breakdown: [
      'Genre: Supernatural romance',
      'Reference: Twilight-like',
      'Audience: Young adult',
      'Potential: Series/franchise',
      'Elements: Forbidden love'
    ]
  },

  // Genre-Specific Mandates
  {
    id: 'genre-s1',
    category: 'Genre',
    title: 'Enemies-to-Lovers Fantasy',
    mandateText: 'Enemies-to-lovers fantasy romance with magical elements. Strong chemistry required.',
    breakdown: [
      'Genre: Fantasy romance',
      'Trope: Enemies-to-lovers',
      'Elements: Magic system',
      'Chemistry: Essential',
      'Development: Slow burn'
    ]
  },
  {
    id: 'genre-s2',
    category: 'Genre',
    title: 'Female Revenge Thriller',
    mandateText: 'Revenge thriller with female protagonist. Dark tone, satisfying payoff.',
    breakdown: [
      'Genre: Revenge thriller',
      'Protagonist: Female lead',
      'Tone: Dark/gritty',
      'Ending: Satisfying payoff',
      'Theme: Justice/vengeance'
    ]
  },
  {
    id: 'genre-s3',
    category: 'Genre',
    title: 'Cohabitation Rom-Com',
    mandateText: 'Cohabitation romance comedy. Forced proximity trope, modern setting.',
    breakdown: [
      'Genre: Romantic comedy',
      'Trope: Forced proximity',
      'Premise: Cohabitation',
      'Setting: Modern/urban',
      'Tone: Comedic'
    ]
  },
  {
    id: 'genre-s4',
    category: 'Genre',
    title: 'Gothic Supernatural Romance',
    mandateText: 'Gothic romance with dark supernatural elements. Atmospheric, moody tone.',
    breakdown: [
      'Genre: Gothic romance',
      'Elements: Supernatural',
      'Atmosphere: Dark/moody',
      'Style: Atmospheric',
      'Aesthetic: Victorian-inspired'
    ]
  },

  // Demographic-Specific Mandates
  {
    id: 'demo-1',
    category: 'Demographic',
    title: 'Female 18-34 Romance',
    mandateText: 'Content for female 18-34 demographic. Romance-forward, aspirational lifestyle elements.',
    breakdown: [
      'Audience: Female 18-34',
      'Genre: Romance-forward',
      'Elements: Aspirational',
      'Lifestyle: Fashion/career',
      'Tone: Empowering'
    ]
  },
  {
    id: 'demo-2',
    category: 'Demographic',
    title: 'Male-Skewing Action Fantasy',
    mandateText: 'Male-skewing action fantasy with romance subplot. Not primarily romance.',
    breakdown: [
      'Audience: Male-skewing',
      'Genre: Action fantasy',
      'Romance: Subplot only',
      'Focus: Action/adventure',
      'Tone: Epic/exciting'
    ]
  },
  {
    id: 'demo-3',
    category: 'Demographic',
    title: 'Teen First Love Story',
    mandateText: 'Teen/YA content with first love themes. Clean romance, school setting.',
    breakdown: [
      'Audience: Teen/YA',
      'Theme: First love',
      'Rating: Clean/appropriate',
      'Setting: School',
      'Tone: Sweet/innocent'
    ]
  },
  {
    id: 'demo-4',
    category: 'Demographic',
    title: 'Mature Adult Romance',
    mandateText: 'Mature romance for 25+ audience. Complex relationships, adult situations okay.',
    breakdown: [
      'Audience: 25+',
      'Genre: Mature romance',
      'Complexity: Nuanced relationships',
      'Content: Adult situations',
      'Themes: Life/career/love'
    ]
  }
];

/**
 * Get mandate examples by category
 */
export function getMandatesByCategory(category: string): MandateExample[] {
  if (category === 'all') return MANDATE_EXAMPLES;
  return MANDATE_EXAMPLES.filter(ex => ex.category === category);
}

/**
 * Get random mandate examples
 */
export function getRandomMandates(count: number = 4): MandateExample[] {
  const shuffled = [...MANDATE_EXAMPLES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ============================================
// CHATBOT SUGGESTED QUERIES
// ============================================

export const CHATBOT_QUERIES = {
  // Genre-specific searches
  genre: [
    "Show me romance webtoons with strong female leads",
    "I'm looking for action stories with great art",
    "What are some popular fantasy web novels?",
    "Find me psychological thriller webtoons",
    "Show me slice-of-life stories with heartwarming moments",
    "I want dark fantasy with complex worldbuilding",
    "Find horror webtoons with unique art styles",
    "Show me comedy webtoons that are actually funny"
  ],
  // Tone-based searches
  tone: [
    "Find me something light and funny",
    "Looking for emotional, tear-jerker stories",
    "Show me intense, suspenseful content",
    "I want romantic and heartwarming stories",
    "Find dark and mature content",
    "Show me quirky and unique stories"
  ],
  // Specific feature searches
  feature: [
    "What BL webtoons have good art?",
    "Show me completed romance series",
    "Find me isekai stories with female protagonists",
    "What's trending in Korean web novels?",
    "Show me stories similar to Twilight",
    "Find K-pop idol related content"
  ],
  // Discovery prompts
  discovery: [
    "What are the most popular titles right now?",
    "Recommend something unique and different",
    "What's good for Netflix adaptation?",
    "Find hidden gems I might have missed",
    "Show me award-winning webtoons"
  ]
};

/**
 * Get all chatbot queries as a flat array
 */
export function getAllChatbotQueries(): string[] {
  return [
    ...CHATBOT_QUERIES.genre,
    ...CHATBOT_QUERIES.tone,
    ...CHATBOT_QUERIES.feature,
    ...CHATBOT_QUERIES.discovery
  ];
}

/**
 * Get random chatbot queries for initial suggestions
 */
export function getRandomChatbotQueries(count: number = 4): string[] {
  const allQueries = getAllChatbotQueries();
  const shuffled = [...allQueries].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Get chatbot queries by category
 */
export function getChatbotQueriesByCategory(category: keyof typeof CHATBOT_QUERIES): string[] {
  return CHATBOT_QUERIES[category];
}

// ============================================
// HERO SECTION SAMPLES
// ============================================

export const HERO_SAMPLES = {
  showComp: {
    placeholder: "Try 'Twilight' or 'Bridgerton'",
    sampleTitle: 'Twilight',
    sampleLabel: 'Try: Twilight'
  },
  brief: {
    placeholder: "e.g., 'Female-driven thriller'",
    sampleText: 'Romantic comedy for streaming, completed series',
    sampleLabel: 'Try: Romantic comedy for streaming'
  }
};

/**
 * Get a random show comp sample from COMP_EXAMPLES
 */
export function getRandomShowCompSample(): { title: string; comps: string[] } {
  const random = COMP_EXAMPLES[Math.floor(Math.random() * COMP_EXAMPLES.length)];
  return {
    title: random.title,
    comps: random.comps
  };
}

/**
 * Get a random mandate sample
 */
export function getRandomMandateSample(): string {
  const random = MANDATE_EXAMPLES[Math.floor(Math.random() * MANDATE_EXAMPLES.length)];
  return random.mandateText;
}

/**
 * Get random comp combination strings for quick suggestions
 * Returns formatted strings like "Twilight + Bridgerton"
 */
export function getRandomCompSuggestions(count: number = 3): string[] {
  const shuffled = [...COMP_EXAMPLES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(ex => ex.comps.join(' + '));
}

/**
 * Get random single show titles from comp examples
 * Useful for single-show search suggestions
 */
export function getRandomShowSuggestions(count: number = 4): string[] {
  // Extract all unique show titles from comp examples
  const allShows = new Set<string>();
  COMP_EXAMPLES.forEach(ex => ex.comps.forEach(comp => allShows.add(comp)));

  const showArray = Array.from(allShows);
  const shuffled = showArray.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
