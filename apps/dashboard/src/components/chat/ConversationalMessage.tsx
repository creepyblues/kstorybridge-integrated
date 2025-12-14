import React from 'react';
import { debug } from '@/utils/debug';
import { useTypewriter } from '@/hooks/useTypewriter';

interface ConversationalMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  titles?: any[];
  suggestedQueries?: string[];
  messageId?: string;
}

interface ConversationalMessageProps {
  content: string;
  navigate: any;
  titleData?: any[];
  allMessages?: ConversationalMessage[];
  titleCache?: any[];
  handleSuggestedQuery?: (query: string) => void;
  onTitleCardClick?: (title: any) => void;
  /** Enable typewriter effect for new messages */
  enableTypewriter?: boolean;
  /** Callback when typewriter completes */
  onTypewriterComplete?: () => void;
}

/**
 * ConversationalMessage Component
 *
 * Renders bot messages with advanced features:
 * - Fuzzy title matching (80% similarity threshold using Levenshtein distance)
 * - Clickable title links to title detail pages
 * - "Learn more" buttons for quick follow-up queries
 * - Markdown link support
 * - Smart text formatting
 */
export const ConversationalMessage: React.FC<ConversationalMessageProps> = ({
  content,
  titleData,
  allMessages,
  titleCache,
  handleSuggestedQuery,
  enableTypewriter = false,
  onTypewriterComplete,
}) => {
  // Use typewriter effect for new messages
  const { displayedText, isTyping, skipToEnd } = useTypewriter({
    text: content,
    speed: 25, // Faster speed for chat (25ms per char = ~40 chars/sec)
    skipAnimation: !enableTypewriter,
    onComplete: onTypewriterComplete,
    varianceRange: [-5, 15], // Subtle variance for natural feel
    punctuationPause: 100, // Brief pause on punctuation
  });

  // Use displayed text when typewriter is active, otherwise use full content
  const textToRender = enableTypewriter ? displayedText : content;

  // Levenshtein distance for fuzzy string matching
  const levenshteinDistance = (str1: string, str2: string): number => {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = [];

    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    return matrix[len1][len2];
  };

  // Calculate similarity score (0-1, higher is better)
  const calculateSimilarity = (str1: string, str2: string): number => {
    const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
    const maxLength = Math.max(str1.length, str2.length);
    return maxLength === 0 ? 1 : 1 - distance / maxLength;
  };

  // Helper function to find title ID by title name from available title data
  const findTitleIdByName = (titleName: string): string | null => {
    // Clean the title name by extracting from markdown links and normalizing
    const cleanedName = titleName
      .replace(/^\[([^\]]+)\]\([^)]*\)$/, '$1')  // Extract title from [title](url) markdown links
      .replace(/^["""'']+|["""'']+$/g, '"')     // Normalize only leading/trailing quotes
      .replace(/[.,!?;:]+$/, '')                // Remove only trailing punctuation
      .trim();

    // Debug logging in development for markdown links and specific cases
    if (import.meta.env.DEV && (titleName.includes('[') || titleName.toLowerCase().includes('first love'))) {
      debug.log('🔍 Title matching debug:', {
        originalTitle: titleName,
        cleanedName,
        wasMarkdownLink: titleName.includes('[') && titleName.includes(']('),
        messageSpecificTitles: titleData?.length || 0,
        allMessagesCount: allMessages?.length || 0,
        titleCacheSize: titleCache?.length || 0
      });
    }

    // First, try to find in current message's titles (these are most relevant)
    if (titleData && Array.isArray(titleData)) {
      // Try exact match first
      const exactMatch = titleData.find(title => {
        const titleEn = title.title_name_en?.replace(/^["""'']+|["""'']+$/g, '"')?.replace(/[.,!?;:]+$/, '')?.trim();
        const titleKr = title.title_name_kr?.replace(/^["""'']+|["""'']+$/g, '"')?.replace(/[.,!?;:]+$/, '')?.trim();
        return titleEn === cleanedName || titleKr === cleanedName;
      });

      if (exactMatch) return exactMatch.title_id;

      // Try case-insensitive match
      const caseInsensitiveMatch = titleData.find(title => {
        const titleEn = title.title_name_en?.replace(/^["""'']+|["""'']+$/g, '"')?.replace(/[.,!?;:]+$/, '')?.trim()?.toLowerCase();
        const titleKr = title.title_name_kr?.replace(/^["""'']+|["""'']+$/g, '"')?.replace(/[.,!?;:]+$/, '')?.trim()?.toLowerCase();
        const searchName = cleanedName.toLowerCase();
        return titleEn === searchName || titleKr === searchName;
      });

      if (caseInsensitiveMatch) return caseInsensitiveMatch.title_id;
    }

    // Then, search across ALL messages' titles (for cross-references)
    if (allMessages && Array.isArray(allMessages)) {
      const allAvailableTitles: any[] = [];
      allMessages.forEach(msg => {
        if (msg.titles && Array.isArray(msg.titles)) {
          allAvailableTitles.push(...msg.titles);
        }
      });

      // Remove duplicates by title_id
      const uniqueTitles = Array.from(
        new Map(allAvailableTitles.map(item => [item.title_id, item])).values()
      );

      if (uniqueTitles.length > 0) {
        // Try exact match
        const exactMatch = uniqueTitles.find(title => {
          const titleEn = title.title_name_en?.replace(/^["""'']+|["""'']+$/g, '"')?.replace(/[.,!?;:]+$/, '')?.trim();
          const titleKr = title.title_name_kr?.replace(/^["""'']+|["""'']+$/g, '"')?.replace(/[.,!?;:]+$/, '')?.trim();
          return titleEn === cleanedName || titleKr === cleanedName;
        });

        if (exactMatch) return exactMatch.title_id;

        // Try case-insensitive match
        const caseInsensitiveMatch = uniqueTitles.find(title => {
          const titleEn = title.title_name_en?.replace(/^["""'']+|["""'']+$/g, '"')?.replace(/[.,!?;:]+$/, '')?.trim()?.toLowerCase();
          const titleKr = title.title_name_kr?.replace(/^["""'']+|["""'']+$/g, '"')?.replace(/[.,!?;:]+$/, '')?.trim()?.toLowerCase();
          const searchName = cleanedName.toLowerCase();
          return titleEn === searchName || titleKr === searchName;
        });

        if (caseInsensitiveMatch) return caseInsensitiveMatch.title_id;

        // Try partial match (contains) - last resort
        const partialMatch = uniqueTitles.find(title => {
          const titleEn = title.title_name_en?.replace(/^["""'']+|["""'']+$/g, '"')?.replace(/[.,!?;:]+$/, '')?.trim()?.toLowerCase();
          const titleKr = title.title_name_kr?.replace(/^["""'']+|["""'']+$/g, '"')?.replace(/[.,!?;:]+$/, '')?.trim()?.toLowerCase();
          const searchName = cleanedName.toLowerCase();
          return titleEn?.includes(searchName) || titleKr?.includes(searchName);
        });

        if (partialMatch) return partialMatch.title_id;
      }
    }

    // Final fallback: search in title cache (ALL titles from database)
    if (titleCache && titleCache.length > 0) {
      // Only log for actual title searches, not genre names
      if (cleanedName.length > 2 && !['romantasy', 'fantasy', 'romance'].includes(cleanedName.toLowerCase())) {
        debug.log('🔍 Searching title cache as fallback:', {
          searchTerm: cleanedName,
          cacheSize: titleCache.length,
          firstFewCacheTitles: titleCache.slice(0, 3).map(t => t.title_name_en || t.title_name_kr)
        });
      }

      // Try exact match in cache
      const exactCacheMatch = titleCache.find(title => {
        const titleEn = title.title_name_en?.replace(/^["""'']+|["""'']+$/g, '"')?.replace(/[.,!?;:]+$/, '')?.trim();
        const titleKr = title.title_name_kr?.replace(/^["""'']+|["""'']+$/g, '"')?.replace(/[.,!?;:]+$/, '')?.trim();
        return titleEn === cleanedName || titleKr === cleanedName;
      });

      if (exactCacheMatch) {
        debug.log('✅ Found exact match in title cache:', exactCacheMatch.title_name_en || exactCacheMatch.title_name_kr);
        return exactCacheMatch.title_id;
      }

      // Try case-insensitive match in cache
      const caseInsensitiveCacheMatch = titleCache.find(title => {
        const titleEn = title.title_name_en?.replace(/^["""'']+|["""'']+$/g, '"')?.replace(/[.,!?;:]+$/, '')?.trim()?.toLowerCase();
        const titleKr = title.title_name_kr?.replace(/^["""'']+|["""'']+$/g, '"')?.replace(/[.,!?;:]+$/, '')?.trim()?.toLowerCase();
        const searchName = cleanedName.toLowerCase();
        return titleEn === searchName || titleKr === searchName;
      });

      if (caseInsensitiveCacheMatch) {
        debug.log('✅ Found case-insensitive match in title cache:', caseInsensitiveCacheMatch.title_name_en || caseInsensitiveCacheMatch.title_name_kr);
        return caseInsensitiveCacheMatch.title_id;
      }

      // FUZZY MATCHING - Final fallback using Levenshtein distance
      const fuzzyMatches = titleCache
        .map(title => {
          const titleEn = title.title_name_en?.replace(/^["""'']+|["""'']+$/g, '"')?.replace(/[.,!?;:]+$/, '')?.trim();
          const titleKr = title.title_name_kr?.replace(/^["""'']+|["""'']+$/g, '"')?.replace(/[.,!?;:]+$/, '')?.trim();

          const similarityEn = titleEn ? calculateSimilarity(cleanedName, titleEn) : 0;
          const similarityKr = titleKr ? calculateSimilarity(cleanedName, titleKr) : 0;
          const similarity = Math.max(similarityEn, similarityKr);

          return { title, similarity };
        })
        .filter(match => match.similarity >= 0.8)  // 80% similarity threshold
        .sort((a, b) => b.similarity - a.similarity);

      if (fuzzyMatches.length > 0) {
        const bestMatch = fuzzyMatches[0];
        debug.log('✅ Found fuzzy match in title cache:', {
          titleName: bestMatch.title.title_name_en || bestMatch.title.title_name_kr,
          similarity: (bestMatch.similarity * 100).toFixed(1) + '%',
          searchTerm: cleanedName
        });
        return bestMatch.title.title_id;
      }
    }

    // Only log as error if it looks like a real title (not a genre or category)
    const isLikelyTitle = cleanedName.length > 2 &&
                          !['romantasy', 'fantasy', 'romance', 'thriller', 'horror', 'comedy', 'drama', 'action'].includes(cleanedName.toLowerCase());

    if (isLikelyTitle) {
      debug.log('⚠️ Title not found in database:', cleanedName, '(AI may have generated a fictional example)');
    }
    return null;
  };

  const formatText = (text: string) => {
    // Split by lines to preserve natural conversation flow
    return text.split('\n').map((line, idx) => {
      // Skip empty lines but preserve spacing
      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }

      // Regular line with title linking
      return (
        <div key={idx} className={idx > 0 ? 'mt-1' : ''}>
          {formatInlineText(line)}
        </div>
      );
    });
  };

  const formatInlineText = (text: string) => {
    // First pass: Find and preserve quoted content (potential titles)
    const quotedSegments: Array<{start: number, end: number, content: string, titleId?: string}> = [];
    const quoteRegex = /"([^"]*)"/g;
    let quoteMatch;

    while ((quoteMatch = quoteRegex.exec(text)) !== null) {
      const quotedContent = quoteMatch[1];
      const foundTitleId = findTitleIdByName(quotedContent);
      quotedSegments.push({
        start: quoteMatch.index,
        end: quoteMatch.index + quoteMatch[0].length,
        content: quotedContent,
        titleId: foundTitleId || undefined
      });
    }

    // Second pass: Find unquoted title names (fallback pattern matching)
    const unquotedTitleSegments: Array<{start: number, end: number, content: string, titleId?: string}> = [];

    // Only search if we have titleData or titleCache to match against
    if ((titleData && titleData.length > 0) || (titleCache && titleCache.length > 0)) {
      // Build a list of all available title names (both English and Korean)
      const availableTitles: Array<{name: string, titleId: string}> = [];

      // Add titles from titleData
      if (titleData) {
        titleData.forEach(title => {
          if (title.title_name_en) availableTitles.push({ name: title.title_name_en, titleId: title.title_id });
          if (title.title_name_kr) availableTitles.push({ name: title.title_name_kr, titleId: title.title_id });
        });
      }

      // Add titles from titleCache
      if (titleCache) {
        titleCache.forEach(title => {
          if (title.title_name_en) availableTitles.push({ name: title.title_name_en, titleId: title.title_id });
          if (title.title_name_kr) availableTitles.push({ name: title.title_name_kr, titleId: title.title_id });
        });
      }

      // Remove duplicates
      const uniqueTitles = Array.from(
        new Map(availableTitles.map(item => [item.name, item])).values()
      );

      // Sort by length (longest first) to match multi-word titles before single words
      uniqueTitles.sort((a, b) => b.name.length - a.name.length);

      // Search for each title name in the text (case-insensitive)
      uniqueTitles.forEach(titleInfo => {
        const titleName = titleInfo.name;
        const regex = new RegExp(`\\b${titleName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        let match;

        while ((match = regex.exec(text)) !== null) {
          const matchStart = match.index;
          const matchEnd = matchStart + match[0].length;

          // Check if this position is already inside a quoted segment
          const isInsideQuote = quotedSegments.some(seg =>
            matchStart >= seg.start && matchEnd <= seg.end
          );

          // Check if this position overlaps with another unquoted segment
          const overlapsExisting = unquotedTitleSegments.some(seg =>
            (matchStart >= seg.start && matchStart < seg.end) ||
            (matchEnd > seg.start && matchEnd <= seg.end)
          );

          if (!isInsideQuote && !overlapsExisting) {
            unquotedTitleSegments.push({
              start: matchStart,
              end: matchEnd,
              content: match[0], // Use the actual matched text (preserves case)
              titleId: titleInfo.titleId
            });
          }
        }
      });
    }

    // Third pass: Process the text with all segments (quoted + unquoted titles)
    const segments: Array<{type: string, content: string, titleId?: string, url?: string, linkText?: string}> = [];
    let currentIndex = 0;

    // Combine and sort all segments (quoted and unquoted titles)
    const allSegments = [...quotedSegments, ...unquotedTitleSegments].sort((a, b) => a.start - b.start);

    allSegments.forEach((segment) => {
      // Add text before this segment (as plain text)
      if (segment.start > currentIndex) {
        const textBefore = text.slice(currentIndex, segment.start);
        segments.push(...processText(textBefore));
      }

      // Determine segment type
      const isQuoted = quotedSegments.includes(segment);
      const segmentType = isQuoted ? 'quote' : 'unquoted-title';

      // Add the segment
      segments.push({
        type: segmentType,
        content: segment.content,
        titleId: segment.titleId
      });

      currentIndex = segment.end;
    });

    // Add remaining text after last segment
    if (currentIndex < text.length) {
      const remainingText = text.slice(currentIndex);
      segments.push(...processText(remainingText));
    }

    // If no segments found, just process as plain text
    if (allSegments.length === 0 && segments.length === 0) {
      segments.push(...processText(text));
    }

    // Render segments
    return segments.map((segment, segmentIdx) => {
      switch (segment.type) {
        case 'quote':
          if (segment.titleId) {
            return (
              <span key={segmentIdx} className="inline-flex items-center gap-1">
                <a
                  href={`/buyers/titles/${segment.titleId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-hanok-teal hover:text-hanok-teal-600 underline hover:no-underline transition-all cursor-pointer"
                  title={`View "${segment.content}" details`}
                >
                  "{segment.content}"
                </a>
                {handleSuggestedQuery && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleSuggestedQuery(`Tell me more about ${segment.content}`);
                    }}
                    className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] rounded-lg transition-colors font-medium"
                    title={`Learn more about "${segment.content}"`}
                  >
                    learn more
                  </button>
                )}
              </span>
            );
          } else {
            return <span key={segmentIdx} className="font-medium">"{segment.content}"</span>;
          }
        case 'unquoted-title':
          if (segment.titleId) {
            return (
              <span key={segmentIdx} className="inline-flex items-center gap-1">
                <a
                  href={`/buyers/titles/${segment.titleId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-hanok-teal hover:text-hanok-teal-600 underline hover:no-underline transition-all cursor-pointer"
                  title={`View "${segment.content}" details`}
                >
                  {segment.content}
                </a>
                {handleSuggestedQuery && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleSuggestedQuery(`Tell me more about ${segment.content}`);
                    }}
                    className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] rounded-lg transition-colors font-medium"
                    title={`Learn more about "${segment.content}"`}
                  >
                    learn more
                  </button>
                )}
              </span>
            );
          } else {
            return <span key={segmentIdx} className="font-medium">{segment.content}</span>;
          }
        case 'markdown-link':
          return (
            <a
              key={segmentIdx}
              href={segment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-pro-purple text-white rounded-lg hover:bg-pro-purple-600 transition-colors font-medium text-sm"
            >
              {segment.linkText}
              <span className="text-xs">→</span>
            </a>
          );
        default:
          return <span key={segmentIdx}>{segment.content}</span>;
      }
    });
  };

  // Helper function to process text (remove asterisks and parse markdown links)
  const processText = (text: string): Array<{type: string, content: string, url?: string, linkText?: string}> => {
    const segments: Array<{type: string, content: string, url?: string, linkText?: string}> = [];

    // Markdown link pattern: [text](url)
    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let lastIndex = 0;
    let match;

    while ((match = markdownLinkRegex.exec(text)) !== null) {
      // Add text before the link
      if (match.index > lastIndex) {
        const beforeText = text.slice(lastIndex, match.index);
        segments.push({
          type: 'text',
          content: beforeText.replace(/\*/g, '')
        });
      }

      // Add the markdown link
      segments.push({
        type: 'markdown-link',
        content: match[0], // Full match for fallback
        linkText: match[1], // [text]
        url: match[2]       // (url)
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      segments.push({
        type: 'text',
        content: text.slice(lastIndex).replace(/\*/g, '')
      });
    }

    // If no links found, return original logic
    if (segments.length === 0) {
      return [{
        type: 'text',
        content: text.replace(/\*/g, '')
      }];
    }

    return segments;
  };

  return (
    <div className="prose prose-sm max-w-none">
      {formatText(textToRender)}
      {/* Show skip button while typing */}
      {enableTypewriter && isTyping && (
        <button
          onClick={skipToEnd}
          className="ml-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Skip to end"
        >
          Skip ↵
        </button>
      )}
      {/* Show typing cursor while typing */}
      {enableTypewriter && isTyping && (
        <span className="inline-block w-0.5 h-4 bg-hanok-teal ml-0.5 animate-pulse" aria-hidden="true" />
      )}
    </div>
  );
};
