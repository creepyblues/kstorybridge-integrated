/**
 * Chat Type Definitions
 *
 * Core types for the chatbot system, including session management,
 * state types, and chat actions.
 */

import type { ChatMessage } from './message';

/**
 * Chat session state
 */
export interface ChatSession {
  /** Session ID (generated on mount) */
  sessionId: string;
  /** All messages in the current session */
  messages: ChatMessage[];
  /** Whether currently streaming a response */
  isStreaming: boolean;
  /** Whether waiting for API response */
  isLoading: boolean;
  /** Current error state */
  error: string | null;
  /** Input field value */
  inputValue: string;
  /** Suggested queries to display */
  suggestedQueries: string[];
}

/**
 * Chat state for useReducer
 */
export interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  isLoading: boolean;
  error: string | null;
  inputValue: string;
  suggestedQueries: string[];
}

/**
 * Chat action types
 */
export type ChatAction =
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'UPDATE_LAST_MESSAGE'; payload: string }
  | { type: 'SET_STREAMING'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_INPUT_VALUE'; payload: string }
  | { type: 'SET_SUGGESTED_QUERIES'; payload: string[] }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'RESET_STATE' };

/**
 * Chat API response
 */
export interface ChatResponse {
  /** Bot's response text */
  response: string;
  /** Suggested follow-up queries */
  suggestedQueries?: string[];
  /** Referenced titles in response */
  referencedTitles?: string[];
  /** Whether response contains pitch deck reference */
  hasPitchReference?: boolean;
  /** Error message if request failed */
  error?: string;
}

/**
 * Chat request payload
 */
export interface ChatRequest {
  /** User's message */
  message: string;
  /** Recent conversation history for context */
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  /** User's email for tier access */
  userEmail: string;
  /** Session ID for tracking */
  sessionId?: string;
}

/**
 * Streaming response callback
 */
export interface StreamCallbacks {
  /** Called for each text chunk */
  onChunk?: (chunk: string) => void;
  /** Called when streaming starts */
  onStart?: () => void;
  /** Called when streaming completes */
  onComplete?: () => void;
  /** Called on error */
  onError?: (error: Error) => void;
}

/**
 * Chat hook return type
 */
export interface UseChatReturn {
  /** Current chat state */
  state: ChatState;
  /** Send a message */
  sendMessage: (message: string) => Promise<void>;
  /** Execute a suggested query */
  executeSuggestedQuery: (query: string) => Promise<void>;
  /** Update input value */
  setInputValue: (value: string) => void;
  /** Clear all messages */
  clearMessages: () => void;
  /** Retry last message */
  retryLastMessage: () => Promise<void>;
}
