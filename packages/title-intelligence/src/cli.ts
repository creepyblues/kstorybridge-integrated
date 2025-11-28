#!/usr/bin/env node
/**
 * CLI Interface for Title Intelligence System
 *
 * Usage:
 *   pnpm extract-title "사장님은 투타임"
 *   pnpm extract-title "Double-Binded By Love" --sources=webtoons.com,reddit.com
 *   pnpm extract-title "백합 하우스" --json
 */

// Load environment variables from .env file
import { config } from 'dotenv'
config()

import { runPipeline } from './pipeline/runPipeline'
import { initializeDatabase } from './db/client'

interface CLIOptions {
  titleName: string
  sources?: string[]
  json?: boolean
}

/**
 * Parse command-line arguments
 */
function parseArgs(): CLIOptions | null {
  const args = process.argv.slice(2)

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    printHelp()
    return null
  }

  const titleName = args[0]
  const options: CLIOptions = { titleName }

  for (let i = 1; i < args.length; i++) {
    const arg = args[i]

    if (arg.startsWith('--sources=')) {
      const sourcesStr = arg.substring('--sources='.length)
      options.sources = sourcesStr.split(',').map(s => s.trim())
    } else if (arg === '--json') {
      options.json = true
    }
  }

  return options
}

/**
 * Print help message
 */
function printHelp(): void {
  console.log(`
Title Intelligence Extractor
============================

Extract and normalize metadata for Korean webtoons/webnovels from multiple sources.

Usage:
  extract-title <title_name> [options]

Arguments:
  title_name              Title to search for (Korean or English)

Options:
  --sources=<domains>     Comma-separated list of domains to scrape (e.g., "page.kakao.com,webtoons.com")
  --json                  Output results as JSON instead of pretty-printed summary

Examples:
  extract-title "사장님은 투타임"
  extract-title "Double-Binded By Love" --sources=webtoons.com,reddit.com
  extract-title "백합 하우스" --json > output.json

Environment Variables:
  SUPABASE_URL                Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY   Supabase service role key (for database access)
  REDDIT_CLIENT_ID            Reddit API client ID (optional)
  REDDIT_CLIENT_SECRET        Reddit API client secret (optional)

Source Domains:
  - page.kakao.com            Kakao Page (Korean)
  - series.naver.com          Naver Series (Korean)
  - www.webtoons.com          WEBTOON English
  - www.webtoonguide.com      WebtoonGuide metadata
  - toons.kr                  Toons.kr metadata
  - bato.to                   Bato.to metadata
  - reddit.com                Reddit discussions
  - archiveofourown.org       AO3 fanfiction
`)
}

/**
 * Pretty-print result summary
 */
function printSummary(result: any): void {
  console.log('\n' + '='.repeat(60))
  console.log('Title Intelligence Summary')
  console.log('='.repeat(60))

  if (!result.success) {
    console.log('\n❌ Pipeline failed')
    console.log(`Scraped: ${result.sourcesScraped}/${result.sourcesFound} sources`)

    if (result.errors.length > 0) {
      console.log('\nErrors:')
      result.errors.forEach((err: any) => {
        console.log(`  - ${err.url}: ${err.error}`)
      })
    }
    return
  }

  console.log('\n✓ Pipeline completed successfully')
  console.log(`\nTitle ID: ${result.titleId}`)
  console.log(`Scraped: ${result.sourcesScraped}/${result.sourcesFound} sources`)

  if (result.summary.title) {
    console.log('\nTitles:')
    if (result.summary.title.ko) {
      console.log(`  Korean:  ${result.summary.title.ko}`)
    }
    if (result.summary.title.en) {
      console.log(`  English: ${result.summary.title.en}`)
    }
  }

  console.log(`\nSlug: ${result.summary.slug}`)

  if (result.summary.sources.length > 0) {
    console.log('\nSources:')
    result.summary.sources.forEach((source: string) => {
      console.log(`  - ${source}`)
    })
  }

  if (Object.keys(result.summary.metrics).length > 0) {
    console.log('\nAggregated Metrics:')
    Object.entries(result.summary.metrics).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`)
    })
  }

  if (result.errors.length > 0) {
    console.log('\nPartial failures:')
    result.errors.forEach((err: any) => {
      console.log(`  - ${err.url}: ${err.error}`)
    })
  }

  console.log('\n' + '='.repeat(60) + '\n')
}

/**
 * Main CLI entry point
 */
async function main(): Promise<void> {
  const options = parseArgs()

  if (!options) {
    process.exit(0)
  }

  try {
    // Initialize database
    initializeDatabase()

    // Run pipeline
    const result = await runPipeline(options.titleName, {
      sources: options.sources
    })

    // Output result
    if (options.json) {
      console.log(JSON.stringify(result, null, 2))
    } else {
      printSummary(result)
    }

    process.exit(result.success ? 0 : 1)

  } catch (error) {
    console.error('\n❌ Fatal error:')
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

// Run CLI if executed directly
if (require.main === module) {
  main()
}

export { main as runCLI }
