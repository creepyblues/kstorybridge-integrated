/**
 * Title Intelligence System
 *
 * Public API exports for use in other applications
 */

// Core pipeline
export { runPipeline } from './pipeline/runPipeline'
export type { PipelineResult } from './pipeline/runPipeline'

// Database operations
export {
  initializeDatabase,
  getDatabase,
  closeDatabase
} from './db/client'

export {
  upsertIntelligenceTitle,
  getIntelligenceTitleById,
  getIntelligenceTitleBySlug,
  searchIntelligenceTitles,
  deleteIntelligenceTitle
} from './db/operations'

// URL resolution
export {
  resolveTitle,
  generateSlug,
  romanizeKorean
} from './search/titleResolver'
export type { ResolvedTitle } from './search/titleResolver'

// Scrapers
export {
  findScraperForUrl,
  getScrapersByCategory,
  getScraperByName,
  getAllDomains,
  isUrlSupported,
  SCRAPERS
} from './scrapers'

export type {
  IScraper,
  ScrapeResult,
  ScraperError,
  NetworkError,
  ParseError,
  NotFoundError
} from './scrapers/base'

// Data models
export type {
  IntelligenceTitle,
  IntelligenceAlias,
  IntelligenceSource,
  IntelligenceMetric,
  TitleIntelligenceMapping,
  UpsertIntelligenceTitlePayload,
  IntelligenceTitleWithRelations,
  SourceCategory,
  SeriesStatus
} from './model/schema'

// CLI
export { runCLI } from './cli'
