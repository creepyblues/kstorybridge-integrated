import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

/**
 * AdminManualModal - Help documentation for Dashboard admin tools
 *
 * Provides quick reference and step-by-step instructions for:
 * - Featured Titles Management
 * - Titles Management
 * - Draft Approval
 * - Content CMS
 * - Asset Generation
 * - Pitch Extractor
 */
export function AdminManualModal() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-500 hover:text-gray-700 p-1"
          title="Admin Manual"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Dashboard Admin Manual</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 text-sm">
          {/* Quick Reference */}
          <section>
            <h2 className="text-base font-semibold text-black mb-3">Quick Reference</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 pr-4 font-medium text-gray-700">Tool</th>
                    <th className="text-left py-2 font-medium text-gray-700">Use When</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-4 font-medium">Featured</td>
                    <td className="py-2">Managing which titles appear on homepage</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-4 font-medium">Titles</td>
                    <td className="py-2">Editing title metadata, priority, verification</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-4 font-medium">Drafts</td>
                    <td className="py-2">Reviewing creator submissions</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-4 font-medium">Content</td>
                    <td className="py-2">Publishing news or learning articles</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-4 font-medium">Asset Generation</td>
                    <td className="py-2">Creating AI marketing materials</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-medium">Pitch Extractor</td>
                    <td className="py-2">Analyzing pitch deck PDFs</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Featured Titles Management */}
          <section className="border-t border-gray-200 pt-4">
            <h2 className="text-base font-semibold text-black mb-2">Featured Titles Management</h2>
            <p className="text-gray-600 mb-3">
              Control which titles appear on the homepage and organize them into sections.
            </p>
            <div className="mb-3">
              <p className="font-medium text-gray-700 mb-1">When to use:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-0.5">
                <li>Adding a new title to featured list</li>
                <li>Reordering featured titles</li>
                <li>Creating/managing display sections</li>
                <li>Assigning titles to specific sections</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-gray-700 mb-1">How to use:</p>
              <ol className="list-decimal list-inside text-gray-600 space-y-0.5">
                <li>Search for a title using the search bar</li>
                <li>Click "Add to Featured" to feature it</li>
                <li>Drag titles to reorder within a section</li>
                <li>Use the section dropdown to assign categories</li>
                <li>Click the external link icon to preview the title page</li>
              </ol>
            </div>
          </section>

          {/* Titles Management */}
          <section className="border-t border-gray-200 pt-4">
            <h2 className="text-base font-semibold text-black mb-2">Titles Management</h2>
            <p className="text-gray-600 mb-3">
              Master data management for all titles in the system.
            </p>
            <div className="mb-3">
              <p className="font-medium text-gray-700 mb-1">When to use:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-0.5">
                <li>Editing any title's metadata</li>
                <li>Setting title priority (High/Medium/Low)</li>
                <li>Marking titles as verified</li>
                <li>Collecting platform data via Title Intelligence</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-gray-700 mb-1">How to use:</p>
              <ol className="list-decimal list-inside text-gray-600 space-y-0.5">
                <li>Search by title name (EN/KR) or ID</li>
                <li>Click column headers to sort</li>
                <li>Use radio buttons to set priority inline</li>
                <li>Click any row to open the full edit modal</li>
                <li>In edit modal: expand sections to edit fields</li>
                <li>Click "Collect Data" to scrape platform metrics</li>
              </ol>
            </div>
          </section>

          {/* Draft Approval */}
          <section className="border-t border-gray-200 pt-4">
            <h2 className="text-base font-semibold text-black mb-2">Draft Approval</h2>
            <p className="text-gray-600 mb-3">
              Review and manage creator title submissions.
            </p>
            <div className="mb-3">
              <p className="font-medium text-gray-700 mb-1">When to use:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-0.5">
                <li>A creator has submitted a new title</li>
                <li>Reviewing questionnaire responses</li>
                <li>Approving or rejecting submissions</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-gray-700 mb-1">How to use:</p>
              <ol className="list-decimal list-inside text-gray-600 space-y-0.5">
                <li>Filter by status (Draft/Submitted/Approved/Rejected)</li>
                <li>Click a row to view full draft details</li>
                <li>Review all questionnaire steps (1-5)</li>
                <li>Approve or reject with comments</li>
              </ol>
            </div>
          </section>

          {/* Content CMS */}
          <section className="border-t border-gray-200 pt-4">
            <h2 className="text-base font-semibold text-black mb-2">Content CMS</h2>
            <p className="text-gray-600 mb-3">
              Create and manage learning/news posts for the creator app.
            </p>
            <div className="mb-3">
              <p className="font-medium text-gray-700 mb-1">When to use:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-0.5">
                <li>Publishing platform news</li>
                <li>Creating learning resources for creators</li>
                <li>Updating existing content</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-gray-700 mb-1">How to use:</p>
              <ol className="list-decimal list-inside text-gray-600 space-y-0.5">
                <li>Click "New Post" to create content</li>
                <li>Set category (Learning/News) and status</li>
                <li>Write content using the rich text editor</li>
                <li>Preview and publish</li>
              </ol>
            </div>
          </section>

          {/* Asset Generation */}
          <section className="border-t border-gray-200 pt-4">
            <h2 className="text-base font-semibold text-black mb-2">Asset Generation</h2>
            <p className="text-gray-600 mb-3">
              Generate marketing assets from pitch decks using AI.
            </p>
            <div className="mb-3">
              <p className="font-medium text-gray-700 mb-1">When to use:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-0.5">
                <li>Creating marketing materials for a title</li>
                <li>Need AI-generated asset ideas</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-gray-700 mb-1">How to use:</p>
              <ol className="list-decimal list-inside text-gray-600 space-y-0.5">
                <li>Search and select a title with a pitch deck</li>
                <li>Click "Analyze Pitch & Generate Ideas"</li>
                <li>Wait 30-60 seconds for AI processing</li>
                <li>Review generated asset suggestions</li>
              </ol>
            </div>
          </section>

          {/* Pitch Extractor */}
          <section className="border-t border-gray-200 pt-4">
            <h2 className="text-base font-semibold text-black mb-2">Pitch Extractor</h2>
            <p className="text-gray-600 mb-3">
              Extract and analyze pitch deck documents.
            </p>
            <div className="mb-3">
              <p className="font-medium text-gray-700 mb-1">When to use:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-0.5">
                <li>Processing new pitch deck uploads</li>
                <li>Getting structured data from PDFs</li>
                <li>Populating title metadata from pitch content</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-gray-700 mb-1">How to use:</p>
              <ol className="list-decimal list-inside text-gray-600 space-y-0.5">
                <li>Select a title from the list</li>
                <li>Click "Extract" to process the PDF</li>
                <li>Review extracted text and metrics</li>
                <li>Data is automatically saved to database</li>
              </ol>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
