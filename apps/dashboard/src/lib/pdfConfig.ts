import { pdfjs } from 'react-pdf';
import { debug } from '@/utils/debug';

/**
 * Centralized PDF.js Configuration
 *
 * CRITICAL: This must be the ONLY place where pdfjs.GlobalWorkerOptions.workerSrc is set.
 * Multiple configurations will cause worker conflicts and PDF rendering failures.
 *
 * All components using react-pdf MUST import pdfjs from this file, not directly from 'react-pdf'.
 *
 * Worker Configuration:
 * Using unpkg CDN with exact version pinning (pdfjs-dist@5.3.31)
 * - Guarantees version match with react-pdf's bundled pdfjs-dist
 * - Bypasses local cache issues and module resolution conflicts
 * - Works identically in development and production
 * - Faster loading via CDN edge caching
 * - No manual file copying or bundling required
 */

// Configure PDF.js worker (CDN with exact version to prevent cache conflicts)
pdfjs.GlobalWorkerOptions.workerSrc =
  'https://unpkg.com/pdfjs-dist@5.3.31/build/pdf.worker.min.mjs';
debug.log('📄 PDF.js: Worker configured from unpkg CDN (v5.3.31)');

// Export configured pdfjs instance
export { pdfjs };

// Re-export react-pdf components for convenience
export { Document, Page } from 'react-pdf';
