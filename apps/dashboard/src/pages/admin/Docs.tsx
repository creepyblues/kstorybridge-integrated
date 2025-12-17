/**
 * Admin Documentation Viewer
 *
 * Displays curated internal documentation for admins.
 * Fetches markdown files at runtime from GitHub raw content.
 */

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Icon } from '@iconify/react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

interface DocItem {
  id: string;
  name: string;
  path: string;
  inlineContent?: string; // For docs with embedded content instead of fetching
  content?: string;
  loading?: boolean;
  error?: boolean;
}

interface DocCategory {
  id: string;
  name: string;
  icon: string;
  docs: DocItem[];
}

// Define documentation categories with curated docs
const DOC_CATEGORIES: DocCategory[] = [
  {
    id: 'core',
    name: 'Core System',
    icon: 'solar:server-bold-duotone',
    docs: [
      { id: 'auth', name: 'Authentication', path: 'docs/active/AUTH_DOCUMENTATION.md' },
      { id: 'database', name: 'Database Schema', path: 'docs/active/DATABASE_SCHEMA.md' },
      { id: 'design', name: 'Design System', path: 'docs/active/DESIGN_SYSTEM.md' },
      { id: 'cache', name: 'Cache Policy', path: 'docs/active/CACHE_POLICY.md' },
      { id: 'security', name: 'Security Best Practices', path: 'docs/active/SECURITY_BEST_PRACTICES.md' },
      { id: 'email', name: 'Email Policy', path: 'docs/active/EMAIL_POLICY_DOCUMENTATION.md' },
      { id: 'user-journey', name: 'User Journey Map', path: 'docs/active/USER_JOURNEY_MAP.md' },
      { id: 'tier-system', name: 'Tier System Manual', path: 'docs/active/TIER_SYSTEM_MANUAL.md' },
      { id: 'tier-features', name: 'Tier Features', path: 'docs/active/BUYER_TIER_FEATURES_MANUAL.md' },
      { id: 'local-prod', name: 'Local vs Production', path: 'docs/active/LOCAL_VS_PRODUCTION_DIFFERENCES.md' },
    ],
  },
  {
    id: 'guides',
    name: 'Setup Guides',
    icon: 'solar:book-2-bold-duotone',
    docs: [
      { id: 'turborepo', name: 'Turborepo Setup', path: 'docs/guides/TURBOREPO_VERCEL_SETUP.md' },
      { id: 'git-deploy', name: 'Git Deployment', path: 'docs/guides/GIT_DEPLOYMENT_STRUCTURE.md' },
      { id: 'deploy-strategy', name: 'Deployment Strategy', path: 'docs/guides/DEPLOYMENT_STRATEGY.md' },
      { id: 'deploy-instructions', name: 'Deployment Instructions', path: 'docs/guides/DEPLOYMENT_INSTRUCTIONS.md' },
      { id: 'stripe-setup', name: 'Stripe Setup', path: 'docs/guides/STRIPE_SETUP_GUIDE.md' },
      { id: 'openai-setup', name: 'OpenAI Setup', path: 'docs/guides/OPENAI_PRODUCTION_SETUP.md' },
      { id: 'migration-safety', name: 'Migration Safety', path: 'docs/guides/MIGRATION_SAFETY_GUIDE.md' },
      { id: 'field-naming', name: 'Field Naming Standards', path: 'docs/guides/FIELD_NAMING_STANDARDS.md' },
    ],
  },
  {
    id: 'features',
    name: 'Features',
    icon: 'solar:stars-bold-duotone',
    docs: [
      { id: 'title-intel', name: 'Title Intelligence', path: 'docs/features/TITLE_INTELLIGENCE.md' },
      { id: 'comps-navigator', name: 'Comps Navigator', path: 'docs/features/COMPS_NAVIGATOR_PLAN.md' },
      { id: 'comps-samples', name: 'Comps Sample Data', path: 'docs/features/COMPS_NAVIGATOR_SAMPLES.md' },
      { id: 'chatbot-overview', name: 'AI Chatbot Overview', path: 'docs/features/chatbot/OVERVIEW.md' },
      { id: 'chatbot-testing', name: 'Chatbot Testing', path: 'docs/features/chatbot/TESTING_GUIDE.md' },
      { id: 'pitch-analytics', name: 'Pitch Analytics', path: 'docs/features/chatbot/PITCH_ANALYTICS.md' },
      { id: 'comps-optimization', name: 'Comps Optimization', path: 'docs/features/comps-navigator/OPTIMIZATION_COMPLETE.md' },
    ],
  },
  {
    id: 'product',
    name: 'Product',
    icon: 'solar:document-text-bold-duotone',
    docs: [
      { id: 'features-guide', name: 'KStoryBridge Features', path: 'docs/KStoryBridge_features.md' },
      { id: 'stripe-integration', name: 'Stripe Integration', path: 'docs/STRIPE_PAYMENT_INTEGRATION.md' },
      { id: 'stripe-config', name: 'Stripe Configuration', path: 'docs/STRIPE_CONFIGURATION_REFERENCE.md' },
      { id: 'migration-policy', name: 'Migration Policy', path: 'docs/MIGRATION_POLICY.md' },
      { id: 'webhook-setup', name: 'Webhook Setup', path: 'docs/WEBHOOK_SETUP_CHECKLIST.md' },
    ],
  },
  {
    id: 'scripts',
    name: 'Scripts',
    icon: 'solar:code-bold-duotone',
    docs: [
      { id: 'scripts-readme', name: 'Scripts Overview', path: 'scripts/README.md' },
      {
        id: 'scripts-reference',
        name: 'Scripts Reference',
        path: '',
        inlineContent: `# Scripts Reference

This document provides a quick reference for all utility scripts in the \`/scripts\` directory.

---

## Deployment & Build Scripts

| Script | Description |
|--------|-------------|
| \`vercel-ignore-turbo.sh\` | Selective deployment script for Vercel. Determines which apps need rebuilding based on changes. Used in Vercel's "Ignored Build Step" setting. |
| \`check-app-changes.sh\` | Checks if specific app directories have changed since last deployment. |

---

## Database & Data Scripts

### Keyword Extraction
| Script | Description |
|--------|-------------|
| \`keyword-extractor.js\` | Main keyword extraction script. Extracts meaningful keywords from titles for content discovery. |
| \`generate-keyword-updates.js\` | Generates SQL update statements from keyword extraction results. |
| \`update-keywords.sql\` | SQL script to update keywords in the titles table. |
| \`update-keywords-complete.sql\` | Complete SQL script with all keyword updates. |

### Comp Analysis
| Script | Description |
|--------|-------------|
| \`comp-identifier.js\` | Main comparable title identification engine. Calculates similarity scores across multiple dimensions. |
| \`generate-comp-report.js\` | Generates human-readable markdown reports from comp analysis. |
| \`visual-comp-identifier.js\` | Visual comparison tool for identifying similar titles. |

### Embeddings & Vector Search
| Script | Description |
|--------|-------------|
| \`regenerate-embeddings.js\` | Regenerates vector embeddings for titles using OpenAI API. |
| \`regenerate-specific-title.js\` | Regenerates embedding for a specific title by ID. |
| \`fix-doting-father-embedding.js\` | Fixes embedding issues for specific title. |
| \`count-valid-embeddings.js\` | Counts titles with valid embeddings in the database. |
| \`verify-regeneration-success.js\` | Verifies that embedding regeneration completed successfully. |
| \`test-openai-embedding.js\` | Tests OpenAI embedding API connection and functionality. |
| \`test-write-read-embedding.js\` | Tests writing and reading embeddings to/from database. |

### Cache Management
| Script | Description |
|--------|-------------|
| \`check-comp-cache.js\` | Checks the state of the comp title cache. |
| \`clear-comp-cache.sql\` | SQL to clear the comp title cache table. |
| \`warm-comp-title-cache.js\` | Pre-warms the comp title cache with common searches. |
| \`test-cache-after-search.js\` | Tests cache behavior after performing searches. |

### User & Data Verification
| Script | Description |
|--------|-------------|
| \`check-user-buyer.js\` | Checks user_buyers table for specific user data. |
| \`verify-database-state.sql\` | SQL queries to verify database state and data integrity. |
| \`cleanup-duplicate-messages.sql\` | Cleans up duplicate chat messages in the database. |

---

## Testing Scripts

### Edge Function Testing
| Script | Description |
|--------|-------------|
| \`test-function-health.js\` | Tests health of all deployed edge functions. |
| \`test-edge-functions.ts\` | Comprehensive edge function testing suite. |
| \`test-validation-only.js\` | Tests input validation for edge functions. |
| \`test-security-fixes.js\` | Tests security fixes and vulnerability patches. |

### Feature Testing
| Script | Description |
|--------|-------------|
| \`test-generate-asset.js\` | Tests the asset generation edge function. |
| \`test-analyze-pitch-assets.js\` | Tests pitch deck asset analysis. |
| \`test-marketing-assets-setup.js\` | Tests marketing assets setup and configuration. |
| \`test-checkout-uuid-fix.ts\` | Tests checkout UUID fix for Stripe integration. |

### Search Testing
| Script | Description |
|--------|-------------|
| \`test-horror-search.js\` | Tests vector search with horror genre queries. |
| \`test-this-is-us-search.js\` | Tests search functionality with "This Is Us" title. |
| \`test-vector-search-this-is-us.js\` | Tests vector search specifically for "This Is Us". |
| \`test-mandate-search.js\` | Tests mandate matching search functionality. |
| \`test-comps-exact-dashboard.js\` | Tests comps functionality as used in dashboard. |
| \`check-horror-titles-similarity.js\` | Checks similarity scores for horror titles. |

### Scraping Testing
| Script | Description |
|--------|-------------|
| \`test-naver-scraper.ts\` | Tests Naver webtoon/series scraping functionality. |
| \`scrape_webtoons.py\` | Python script for scraping webtoon data. |

---

## Storage & Asset Scripts

| Script | Description |
|--------|-------------|
| \`create-storage-bucket.js\` | Creates Supabase storage buckets for assets. |
| \`make-bucket-public.js\` | Makes a storage bucket publicly accessible. |
| \`diagnose-asset.js\` | Diagnoses issues with asset storage and retrieval. |

---

## Import & Migration Scripts

| Script | Description |
|--------|-------------|
| \`fix-imports.js\` | Fixes import statements across the codebase. |
| \`fix-all-imports.js\` | Comprehensive import fixing script. |
| \`nuclear-import-fix.js\` | Aggressive import fixing for stubborn issues. |
| \`update-imports.js\` | Updates import paths after refactoring. |
| \`extract_mock_data.js\` | Extracts mock data for testing purposes. |

---

## Webhook & Integration Scripts

| Script | Description |
|--------|-------------|
| \`verify-stripe-webhook.sh\` | Verifies Stripe webhook configuration and connectivity. |
| \`debug-subscription-issue.sql\` | SQL queries for debugging subscription issues. |

---

## Data Analysis Scripts

| Script | Description |
|--------|-------------|
| \`check-doting-father.js\` | Analyzes data for "Doting Father" title specifically. |
| \`test-parse-embedding.js\` | Tests parsing of embedding data. |
| \`verify-optimization.js\` | Verifies optimization improvements. |
| \`batch-format-fit-analysis.js\` | Batch analysis for format fit scoring. |

---

## Usage

Most scripts can be run with Node.js:

\`\`\`bash
cd scripts
npm install  # Install dependencies (first time only)
node <script-name>.js
\`\`\`

For TypeScript scripts:
\`\`\`bash
npx ts-node <script-name>.ts
\`\`\`

For shell scripts:
\`\`\`bash
chmod +x <script-name>.sh
./<script-name>.sh
\`\`\`

---

## Environment Variables

Many scripts require environment variables. Create a \`.env\` file in the scripts directory or set them in your shell:

\`\`\`bash
SUPABASE_URL=https://dlrnrgcoguxlkkcitlpd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
OPENAI_API_KEY=<your-openai-api-key>
\`\`\`

---

*Last updated: December 2024*
`
      },
    ],
  },
];

// GitHub raw URL base for fetching docs
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/creepyblues/kstorybridge-integrated/main/';

export default function AdminDocs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<DocItem | null>(null);
  const [docContents, setDocContents] = useState<Record<string, { content?: string; loading?: boolean; error?: boolean }>>({});
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['core']);

  // Calculate total docs
  const totalDocs = DOC_CATEGORIES.reduce((sum, cat) => sum + cat.docs.length, 0);

  // Filter docs based on search (only filters by name since content isn't loaded yet)
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return DOC_CATEGORIES;

    const query = searchQuery.toLowerCase();
    return DOC_CATEGORIES
      .map(category => ({
        ...category,
        docs: category.docs.filter(doc =>
          doc.name.toLowerCase().includes(query)
        ),
      }))
      .filter(category => category.docs.length > 0);
  }, [searchQuery]);

  // Set default doc on mount
  useEffect(() => {
    if (!selectedDoc && DOC_CATEGORIES[0]?.docs[0]) {
      handleDocSelect(DOC_CATEGORIES[0].docs[0]);
    }
  }, []);

  const fetchDocContent = async (doc: DocItem) => {
    if (docContents[doc.id]?.content || docContents[doc.id]?.loading) {
      return;
    }

    // Handle inline content (no fetch needed)
    if (doc.inlineContent) {
      setDocContents(prev => ({
        ...prev,
        [doc.id]: { content: doc.inlineContent, loading: false },
      }));
      return;
    }

    setDocContents(prev => ({
      ...prev,
      [doc.id]: { loading: true },
    }));

    try {
      const response = await fetch(`${GITHUB_RAW_BASE}${doc.path}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      const content = await response.text();
      setDocContents(prev => ({
        ...prev,
        [doc.id]: { content, loading: false },
      }));
    } catch (error) {
      console.error(`Error fetching ${doc.path}:`, error);
      setDocContents(prev => ({
        ...prev,
        [doc.id]: { error: true, loading: false },
      }));
    }
  };

  const handleDocSelect = (doc: DocItem) => {
    setSelectedDoc(doc);
    fetchDocContent(doc);
  };

  const getCurrentDocContent = () => {
    if (!selectedDoc) return null;
    return docContents[selectedDoc.id];
  };

  const docState = getCurrentDocContent();

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            to="/admin"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Back to Admin"
          >
            <Icon icon="solar:arrow-left-linear" className="h-5 w-5 text-gray-600" />
          </Link>
          <div className="flex items-center gap-2">
            <Icon icon="solar:notebook-bold-duotone" className="h-6 w-6 text-hanok-teal" />
            <h1 className="text-xl font-semibold">Documentation</h1>
          </div>
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Icon
                icon="solar:magnifer-linear"
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
              />
              <Input
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <span className="text-sm text-gray-500">
            {totalDocs} documents
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 border-r bg-white overflow-y-auto shadow-sm">
          <Accordion
            type="multiple"
            value={expandedCategories}
            onValueChange={setExpandedCategories}
            className="p-2"
          >
            {filteredCategories.map(category => (
              <AccordionItem
                key={category.id}
                value={category.id}
                className="border-none"
              >
                <AccordionTrigger className="hover:no-underline py-2 px-3 rounded-lg hover:bg-gray-100">
                  <div className="flex items-center gap-2">
                    <Icon icon={category.icon} className="h-4 w-4 text-gray-600" />
                    <span className="font-medium text-sm">{category.name}</span>
                    <span className="text-xs text-gray-400 ml-auto mr-2">
                      {category.docs.length}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-2">
                  <div className="space-y-0.5 pl-6">
                    {category.docs.map(doc => (
                      <button
                        key={doc.id}
                        onClick={() => handleDocSelect(doc)}
                        className={cn(
                          'w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors',
                          selectedDoc?.id === doc.id
                            ? 'bg-hanok-teal text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        )}
                      >
                        {doc.name}
                      </button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {filteredCategories.length === 0 && (
            <div className="p-4 text-center text-gray-500 text-sm">
              No documents match your search
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-white">
          {selectedDoc ? (
            <Card className="m-4 border-0 shadow-none">
              <CardContent className="prose prose-sm max-w-none p-6">
                {docState?.loading && (
                  <div className="flex items-center justify-center py-12">
                    <Icon icon="solar:spinner-bold" className="h-8 w-8 animate-spin text-hanok-teal" />
                    <span className="ml-2 text-gray-500">Loading documentation...</span>
                  </div>
                )}
                {docState?.error && (
                  <div className="text-center py-12">
                    <Icon icon="solar:danger-triangle-bold-duotone" className="h-12 w-12 mx-auto mb-4 text-red-400" />
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Document</h2>
                    <p className="text-gray-500 mb-4">
                      Could not load <code className="bg-gray-100 px-2 py-1 rounded">{selectedDoc.path}</code>
                    </p>
                    <button
                      onClick={() => fetchDocContent(selectedDoc)}
                      className="px-4 py-2 bg-hanok-teal text-white rounded-lg hover:bg-hanok-teal/90 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                )}
                {docState?.content && (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      // Custom styling for headers
                      h1: ({ children }: { children?: React.ReactNode }) => (
                        <h1 className="text-2xl font-bold text-gray-900 border-b pb-2 mb-4">{children}</h1>
                      ),
                      h2: ({ children }: { children?: React.ReactNode }) => (
                        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">{children}</h2>
                      ),
                      h3: ({ children }: { children?: React.ReactNode }) => (
                        <h3 className="text-lg font-medium text-gray-700 mt-4 mb-2">{children}</h3>
                      ),
                      // Code blocks
                      code: ({ className, children, ...props }: { className?: string; children?: React.ReactNode }) => {
                        const isInline = !className;
                        if (isInline) {
                          return (
                            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-hanok-teal" {...props}>
                              {children}
                            </code>
                          );
                        }
                        return (
                          <code className={cn("block bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm", className)} {...props}>
                            {children}
                          </code>
                        );
                      },
                      pre: ({ children }: { children?: React.ReactNode }) => (
                        <pre className="bg-gray-900 rounded-lg overflow-x-auto my-4">{children}</pre>
                      ),
                      // Tables
                      table: ({ children }: { children?: React.ReactNode }) => (
                        <div className="overflow-x-auto my-4">
                          <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                            {children}
                          </table>
                        </div>
                      ),
                      th: ({ children }: { children?: React.ReactNode }) => (
                        <th className="px-4 py-2 bg-gray-50 text-left text-sm font-semibold text-gray-700">
                          {children}
                        </th>
                      ),
                      td: ({ children }: { children?: React.ReactNode }) => (
                        <td className="px-4 py-2 text-sm text-gray-600 border-t border-gray-100">
                          {children}
                        </td>
                      ),
                      // Links
                      a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
                        <a
                          href={href}
                          className="text-hanok-teal hover:text-hanok-teal/80 underline"
                          target={href?.startsWith('http') ? '_blank' : undefined}
                          rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                        >
                          {children}
                        </a>
                      ),
                      // Lists
                      ul: ({ children }: { children?: React.ReactNode }) => (
                        <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>
                      ),
                      ol: ({ children }: { children?: React.ReactNode }) => (
                        <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>
                      ),
                      // Blockquotes
                      blockquote: ({ children }: { children?: React.ReactNode }) => (
                        <blockquote className="border-l-4 border-hanok-teal pl-4 italic text-gray-600 my-4">
                          {children}
                        </blockquote>
                      ),
                    }}
                  >
                    {docState.content}
                  </ReactMarkdown>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <Icon icon="solar:document-text-bold-duotone" className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>Select a document to view</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
