/**
 * @kstorybridge/tools
 *
 * Shared AI tools for KStoryBridge apps:
 * - Comps Generator - Hollywood/global comparable titles
 * - Format Fit Analyzer - Adaptation suitability across 5 formats
 *
 * Usage:
 *   import { useCompsGenerator, useFormatFitAnalyzer } from '@kstorybridge/tools';
 *   import { createCompsGeneratorService, createFormatFitService } from '@kstorybridge/tools/services';
 *   import type { SuggestedComp, FormatFitResponse } from '@kstorybridge/tools/types';
 */

// Types
export * from './types';

// Services
export * from './services';

// Hooks
export * from './hooks';
