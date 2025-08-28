import { titlesService, type Title } from './titlesService';
import { enhancedSearch, getTitleSearchFields } from '@/utils/searchUtils';

interface ChatbotResponse {
  message: string;
  titles: Title[];
  searchQuery?: string;
  suggestions?: string[];
}

interface SearchContext {
  genres?: string[];
  tones?: string[];
  formats?: string[];
  themes?: string[];
  comparables?: string[];
  authors?: string[];
  hasPitch?: boolean;
  completed?: boolean;
}

export class ChatbotService {
  private allTitles: Title[] = [];

  async initialize(): Promise<void> {
    try {
      this.allTitles = await titlesService.getAllTitles();
    } catch (error) {
      console.error('Failed to initialize chatbot service:', error);
      throw error;
    }
  }

  private extractSearchContext(query: string): SearchContext {
    const lowerQuery = query.toLowerCase();
    const context: SearchContext = {};

    // Genre detection
    const genres = [
      'romance', 'romantic', 'comedy', 'thriller', 'horror', 'fantasy', 'sci-fi', 'science fiction',
      'drama', 'action', 'mystery', 'supernatural', 'historical', 'slice of life', 'adventure',
      'psychological', 'crime', 'family', 'young adult', 'adult', 'contemporary', 'lgbtq'
    ];
    
    context.genres = genres.filter(genre => lowerQuery.includes(genre));

    // Tone detection
    const tones = [
      'dark', 'light', 'comedic', 'dramatic', 'intense', 'suspenseful', 'heartwarming',
      'emotional', 'funny', 'serious', 'uplifting', 'tragic', 'satirical'
    ];
    
    context.tones = tones.filter(tone => lowerQuery.includes(tone));

    // Format detection
    const formats = [
      'webtoon', 'manhwa', 'novel', 'web novel', 'comic', 'manga', 'book', 'series'
    ];
    
    context.formats = formats.filter(format => lowerQuery.includes(format));

    // Theme detection
    const themes = [
      'revenge', 'betrayal', 'friendship', 'love', 'family', 'power', 'corruption',
      'redemption', 'survival', 'coming of age', 'identity', 'class struggle',
      'good vs evil', 'sacrifice', 'loyalty', 'justice', 'freedom'
    ];
    
    context.themes = themes.filter(theme => lowerQuery.includes(theme));

    // Check for pitch deck requirement
    context.hasPitch = lowerQuery.includes('pitch') || lowerQuery.includes('deck');

    // Check for completion status
    if (lowerQuery.includes('completed') || lowerQuery.includes('finished')) {
      context.completed = true;
    }

    return context;
  }

  private generateSearchSuggestions(context: SearchContext): string[] {
    const suggestions = [];

    if (context.genres && context.genres.length === 0) {
      suggestions.push("Try specifying a genre like 'romance', 'thriller', or 'fantasy'");
    }

    if (context.tones && context.tones.length === 0) {
      suggestions.push("Add tone keywords like 'dark', 'comedic', or 'heartwarming'");
    }

    suggestions.push("Try searching for comparable titles: 'similar to Squid Game'");
    suggestions.push("Search by format: 'webtoon' or 'novel'");
    suggestions.push("Look for specific themes: 'revenge story' or 'family drama'");

    return suggestions.slice(0, 3);
  }

  private scoreTitle(title: Title, query: string, context: SearchContext): number {
    let score = 0;
    const searchFields = getTitleSearchFields();
    
    // Use existing enhanced search for base scoring
    const { exactMatches, expandedMatches, phraseMatches } = enhancedSearch(
      [title],
      query,
      searchFields
    );

    if (exactMatches.length > 0) score += 10;
    else if (phraseMatches.length > 0) score += 7;
    else if (expandedMatches.length > 0) score += 5;

    // Bonus scoring based on context
    if (context.genres && context.genres.length > 0) {
      const titleGenres = Array.isArray(title.genre) ? title.genre : [title.genre];
      context.genres.forEach(genre => {
        if (titleGenres.some(g => g?.toLowerCase().includes(genre))) {
          score += 3;
        }
      });
    }

    if (context.tones && context.tones.length > 0) {
      context.tones.forEach(tone => {
        if (title.tone?.toLowerCase().includes(tone)) {
          score += 3;
        }
      });
    }

    if (context.formats && context.formats.length > 0) {
      context.formats.forEach(format => {
        if (title.content_format?.toLowerCase().includes(format)) {
          score += 2;
        }
      });
    }

    if (context.themes && context.themes.length > 0) {
      const titleContent = [
        title.description,
        title.synopsis,
        title.tagline,
        ...(Array.isArray(title.tags) ? title.tags : [])
      ].join(' ').toLowerCase();

      context.themes.forEach(theme => {
        if (titleContent.includes(theme)) {
          score += 2;
        }
      });
    }

    // Pitch deck bonus
    if (context.hasPitch && title.pitch && title.pitch.trim()) {
      score += 5;
    }

    // Completion bonus
    if (context.completed && title.completed) {
      score += 2;
    }

    // Recent content bonus
    const createdDate = new Date(title.created_at);
    const monthsOld = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsOld < 12) {
      score += 1;
    }

    return score;
  }

  private generateResponseMessage(query: string, titles: Title[], context: SearchContext): string {
    if (titles.length === 0) {
      let message = `I couldn't find any Korean IPs that match "${query}".`;
      
      const suggestions = this.generateSearchSuggestions(context);
      if (suggestions.length > 0) {
        message += "\n\n💡 **Suggestions:**\n";
        suggestions.forEach(suggestion => {
          message += `• ${suggestion}\n`;
        });
      }

      message += "\n**Popular searches:**\n";
      message += "• \"romantic comedy webtoons\"\n";
      message += "• \"dark thriller with revenge theme\"\n";
      message += "• \"family drama similar to Parasite\"\n";
      message += "• \"fantasy novels with female protagonists\"";
      
      return message;
    }

    let message = `Great! I found **${titles.length}** Korean IP${titles.length > 1 ? 's' : ''} matching "${query}"`;

    // Add context information
    const contextParts = [];
    if (context.genres && context.genres.length > 0) {
      contextParts.push(`**Genres:** ${context.genres.join(', ')}`);
    }
    if (context.tones && context.tones.length > 0) {
      contextParts.push(`**Tone:** ${context.tones.join(', ')}`);
    }
    if (context.hasPitch) {
      contextParts.push(`**With pitch decks available**`);
    }

    if (contextParts.length > 0) {
      message += `\n\n${contextParts.join(' • ')}`;
    }

    message += "\n\n📚 **Click any title below to view full details:**";

    return message;
  }

  async searchTitles(query: string): Promise<ChatbotResponse> {
    if (this.allTitles.length === 0) {
      await this.initialize();
    }

    const context = this.extractSearchContext(query);
    
    // Score all titles based on query and context
    const scoredTitles = this.allTitles.map(title => ({
      ...title,
      score: this.scoreTitle(title, query, context)
    }));

    // Filter and sort by relevance
    const relevantTitles = scoredTitles
      .filter(title => title.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8); // Top 8 results

    const responseMessage = this.generateResponseMessage(query, relevantTitles, context);
    
    const suggestions = relevantTitles.length === 0 ? this.generateSearchSuggestions(context) : [];

    return {
      message: responseMessage,
      titles: relevantTitles,
      searchQuery: query,
      suggestions
    };
  }

  // Get popular search examples based on actual data
  async getPopularSearches(): Promise<string[]> {
    if (this.allTitles.length === 0) {
      await this.initialize();
    }

    const genreCounts: { [key: string]: number } = {};
    const formatCounts: { [key: string]: number } = {};

    this.allTitles.forEach(title => {
      // Count genres
      if (Array.isArray(title.genre)) {
        title.genre.forEach(genre => {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });
      } else if (title.genre) {
        genreCounts[title.genre] = (genreCounts[title.genre] || 0) + 1;
      }

      // Count formats
      if (title.content_format) {
        formatCounts[title.content_format] = (formatCounts[title.content_format] || 0) + 1;
      }
    });

    const topGenres = Object.entries(genreCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([genre]) => genre.toLowerCase());

    const topFormats = Object.entries(formatCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([format]) => format.toLowerCase());

    return [
      `${topGenres[0]} ${topFormats[0]}s`,
      `dark ${topGenres[1]} stories`,
      `${topFormats[1]}s with pitch decks`,
      `completed ${topGenres[2]} series`,
      "titles similar to Squid Game"
    ];
  }
}

export const chatbotService = new ChatbotService();