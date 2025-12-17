/**
 * Chat Router Module
 *
 * Routes detected intents to appropriate search engines:
 * - comps: Comps Navigator (8-dimensional scoring)
 * - mandate: Mandate Matcher (AI explanations)
 * - vector: Standard vector search
 * - null: No search needed (conversation)
 */

import type { IntentDetectionResult, ExtractedEntities } from './intent-detection.ts';

// =====================================================================
// TYPE DEFINITIONS
// =====================================================================

export type SearchEngine = 'comps' | 'mandate' | 'vector';

export interface SearchParams {
  // For comps engine
  compTitles?: string[];
  refinementText?: string;

  // For mandate engine
  mandateText?: string;

  // For vector engine
  query?: string;
  limit?: number;
  threshold?: number;
}

export interface RouterDecision {
  action: 'search' | 'conversation';
  engine: SearchEngine | null;
  searchParams: SearchParams;
  skipSearch: boolean;
  generateExplanation: boolean;
  conversationMode?: 'greeting' | 'clarification' | 'general' | 'follow_up';
  reasoning: string;
}

// =====================================================================
// ROUTING CONFIGURATION
// =====================================================================

const DEFAULT_VECTOR_LIMIT = 10;
const DEFAULT_VECTOR_THRESHOLD = 0.7;

const COMPS_MAX_TITLES = 3;
const MANDATE_MAX_LENGTH = 1000;

// =====================================================================
// ROUTING FUNCTIONS
// =====================================================================

/**
 * Route a detected intent to the appropriate search engine.
 *
 * @param intent - The detected intent from intent-detection module
 * @param userQuery - Original user query (used for fallback)
 * @returns RouterDecision with action, engine, and parameters
 */
export function routeQuery(
  intent: IntentDetectionResult,
  userQuery: string
): RouterDecision {
  // ========== CONVERSATION INTENTS ==========
  if (intent.level1 === 'conversation') {
    return routeConversation(intent);
  }

  // ========== TITLE SEARCH INTENTS ==========
  switch (intent.level2) {
    case 'comp_based':
      return routeToComps(intent.extractedEntities, userQuery);

    case 'mandate_based':
      return routeToMandate(intent.extractedEntities, userQuery);

    case 'discovery':
      // Use Mandate Matcher for rich AI explanations
      return routeToMandate(intent.extractedEntities, userQuery);

    case 'information':
    case 'comparison':
    default:
      return routeToVector(intent, userQuery);
  }
}

/**
 * Route conversation intents (no search needed)
 */
function routeConversation(intent: IntentDetectionResult): RouterDecision {
  let conversationMode: RouterDecision['conversationMode'] = 'general';

  switch (intent.level2) {
    case 'greeting':
      conversationMode = 'greeting';
      break;
    case 'clarification':
      conversationMode = 'clarification';
      break;
    case 'follow_up_chat':
      conversationMode = 'follow_up';
      break;
    case 'general_question':
    case 'off_topic':
    default:
      conversationMode = 'general';
      break;
  }

  return {
    action: 'conversation',
    engine: null,
    searchParams: {},
    skipSearch: true,
    generateExplanation: false,
    conversationMode,
    reasoning: `Conversation intent (${intent.level2}) - skipping search`
  };
}

/**
 * Route to Comps Navigator engine
 */
function routeToComps(entities: ExtractedEntities, userQuery: string): RouterDecision {
  const compTitles = entities.compTitles || [];

  // Validate comp titles
  if (compTitles.length === 0) {
    // Fallback to vector search if no comp titles extracted
    return {
      action: 'search',
      engine: 'vector',
      searchParams: {
        query: userQuery,
        limit: DEFAULT_VECTOR_LIMIT,
        threshold: DEFAULT_VECTOR_THRESHOLD
      },
      skipSearch: false,
      generateExplanation: true,
      reasoning: 'No comp titles extracted, falling back to vector search'
    };
  }

  // Limit to max comp titles
  const limitedCompTitles = compTitles.slice(0, COMPS_MAX_TITLES);

  // Extract refinement text if present (e.g., "but more romantic")
  const refinementText = entities.searchQuery || undefined;

  return {
    action: 'search',
    engine: 'comps',
    searchParams: {
      compTitles: limitedCompTitles,
      refinementText
    },
    skipSearch: false,
    generateExplanation: true,
    reasoning: `Routing to Comps Navigator with titles: ${limitedCompTitles.join(', ')}`
  };
}

/**
 * Route to Mandate Matcher engine
 */
function routeToMandate(entities: ExtractedEntities, userQuery: string): RouterDecision {
  // Use mandate text from entities, or fall back to full query
  // For discovery queries, the searchQuery IS the mandate
  let mandateText = entities.mandateText || entities.searchQuery || userQuery;

  // Truncate if too long
  if (mandateText.length > MANDATE_MAX_LENGTH) {
    mandateText = mandateText.slice(0, MANDATE_MAX_LENGTH);
  }

  return {
    action: 'search',
    engine: 'mandate',
    searchParams: {
      mandateText
    },
    skipSearch: false,
    generateExplanation: true,
    reasoning: `Routing to Mandate Matcher: "${mandateText.slice(0, 50)}..."`
  };
}

/**
 * Route to standard vector search
 */
function routeToVector(intent: IntentDetectionResult, userQuery: string): RouterDecision {
  const searchQuery = intent.extractedEntities.searchQuery ||
                      intent.extractedEntities.targetTitle ||
                      userQuery;

  // Adjust parameters based on intent type
  let limit = DEFAULT_VECTOR_LIMIT;
  let threshold = DEFAULT_VECTOR_THRESHOLD;

  if (intent.level2 === 'information') {
    // For specific title info, we want fewer but more accurate results
    limit = 5;
    threshold = 0.75;
  } else if (intent.level2 === 'comparison') {
    // For comparison, we might need more results to find both titles
    limit = 15;
    threshold = 0.65;
  }

  return {
    action: 'search',
    engine: 'vector',
    searchParams: {
      query: searchQuery,
      limit,
      threshold
    },
    skipSearch: false,
    generateExplanation: true,
    reasoning: `Routing to vector search for ${intent.level2}: "${searchQuery.slice(0, 50)}..."`
  };
}

// =====================================================================
// UTILITY FUNCTIONS
// =====================================================================

/**
 * Get a human-readable summary of the routing decision
 */
export function getRoutingDescription(decision: RouterDecision): string {
  if (decision.skipSearch) {
    return `[CONVERSATION] ${decision.conversationMode} mode - no search`;
  }

  const engineLabels: Record<SearchEngine, string> = {
    comps: 'Comps Navigator (8-dim scoring)',
    mandate: 'Mandate Matcher (AI explanations)',
    vector: 'Vector Search'
  };

  const label = decision.engine ? engineLabels[decision.engine] : 'Unknown';
  return `[SEARCH] ${label} - ${decision.reasoning}`;
}

/**
 * Validate router decision before execution
 */
export function validateRouterDecision(decision: RouterDecision): { valid: boolean; error?: string } {
  if (decision.action === 'conversation') {
    return { valid: true };
  }

  if (!decision.engine) {
    return { valid: false, error: 'Search action requires an engine' };
  }

  switch (decision.engine) {
    case 'comps':
      if (!decision.searchParams.compTitles || decision.searchParams.compTitles.length === 0) {
        return { valid: false, error: 'Comps engine requires at least one comp title' };
      }
      break;

    case 'mandate':
      if (!decision.searchParams.mandateText || decision.searchParams.mandateText.trim().length === 0) {
        return { valid: false, error: 'Mandate engine requires mandate text' };
      }
      break;

    case 'vector':
      if (!decision.searchParams.query || decision.searchParams.query.trim().length === 0) {
        return { valid: false, error: 'Vector engine requires a query' };
      }
      break;
  }

  return { valid: true };
}

/**
 * Get estimated response time for a routing decision
 */
export function getEstimatedResponseTime(decision: RouterDecision): { min: number; max: number; unit: 'ms' | 's' } {
  if (decision.skipSearch) {
    return { min: 500, max: 1500, unit: 'ms' };
  }

  switch (decision.engine) {
    case 'comps':
      return { min: 5, max: 10, unit: 's' };
    case 'mandate':
      return { min: 2, max: 5, unit: 's' };
    case 'vector':
    default:
      return { min: 1, max: 3, unit: 's' };
  }
}

/**
 * Get estimated cost for a routing decision
 */
export function getEstimatedCost(decision: RouterDecision): number {
  if (decision.skipSearch) {
    return 0.0005; // Just LLM response cost
  }

  switch (decision.engine) {
    case 'comps':
      // Embeddings + LLM re-ranking
      const compCount = decision.searchParams.compTitles?.length || 1;
      return 0.0001 * compCount + 0.014; // ~$0.015 total
    case 'mandate':
      // Embedding + AI explanation
      return 0.0001 + 0.002; // ~$0.002 total
    case 'vector':
    default:
      // Just embedding
      return 0.001;
  }
}
