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
 * AdminManualModal - Help documentation for Creator admin tools
 *
 * Provides quick reference and step-by-step instructions for:
 * - Title Investigator (data collection from Korean platforms)
 * - Investigation Detail (data verification and ingestion)
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
          <DialogTitle className="text-xl font-bold">Creator Admin Tools Manual</DialogTitle>
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
                    <td className="py-2 pr-4 font-medium">Title Investigator</td>
                    <td className="py-2">Collecting data from Korean platforms</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-medium">Investigation Detail</td>
                    <td className="py-2">Reviewing & ingesting collected data</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Title Investigator */}
          <section className="border-t border-gray-200 pt-4">
            <h2 className="text-base font-semibold text-black mb-2">Title Investigator</h2>
            <p className="text-gray-600 mb-3">
              Collect popularity signals and metadata from multiple Korean content platforms.
            </p>

            <div className="mb-4">
              <p className="font-medium text-gray-700 mb-2">Supported Platforms:</p>
              <div className="bg-gray-50 rounded-lg p-3 space-y-1.5 font-mono text-xs">
                <div><span className="text-gray-500">Naver Webtoon:</span> comic.naver.com/webtoon/list?titleId=XXX</div>
                <div><span className="text-gray-500">Naver Series:</span> series.naver.com/comic/detail.series?productNo=XXX</div>
                <div><span className="text-gray-500">Kakao Page:</span> page.kakao.com/content/XXX or ?seriesId=XXX</div>
                <div><span className="text-gray-500">Kakao Webtoon:</span> webtoon.kakao.com/content/slug/XXX</div>
                <div><span className="text-gray-500">Manta:</span> manta.net/en/series/title?seriesId=XXX</div>
                <div><span className="text-gray-500">Ridibooks:</span> ridibooks.com/books/{'{bookId}'}</div>
                <div><span className="text-gray-500">Bomtoon:</span> bomtoon.com/comic/ep_list/{'{slug}'}</div>
              </div>
            </div>

            <div className="mb-4">
              <p className="font-medium text-gray-700 mb-2">Fan Engagement Sources (title name search):</p>
              <ul className="list-disc list-inside text-gray-600 space-y-0.5">
                <li><strong>Reddit</strong> - Posts & discussions</li>
                <li><strong>AO3</strong> - Fanfiction works</li>
                <li><strong>Comick.live</strong> - Fan translations</li>
              </ul>
            </div>

            <div className="mb-3">
              <p className="font-medium text-gray-700 mb-1">How to use:</p>
              <ol className="list-decimal list-inside text-gray-600 space-y-0.5">
                <li>Paste platform URLs (one per line)</li>
                <li>System auto-detects platform from URL domain</li>
                <li>Select content type (webtoon, webnovel, etc.)</li>
                <li>Optional: Enable fan engagement sources</li>
                <li>Click "Collect Intelligence"</li>
                <li>Wait 10-30 seconds per URL</li>
                <li>Navigate to detail page for verification</li>
              </ol>
            </div>

            <div className="bg-blue-50 rounded-lg p-3">
              <p className="font-medium text-blue-800 mb-1">URL Validation:</p>
              <ul className="text-blue-700 text-xs space-y-0.5">
                <li><span className="text-green-600">✓</span> Green check = valid URL, platform detected</li>
                <li><span className="text-red-600">✗</span> Red X = invalid URL format</li>
                <li>Shows extracted platform IDs</li>
                <li>Displays count of valid sources ready</li>
              </ul>
            </div>
          </section>

          {/* Investigation Detail */}
          <section className="border-t border-gray-200 pt-4">
            <h2 className="text-base font-semibold text-black mb-2">Investigation Detail</h2>
            <p className="text-gray-600 mb-3">
              View collected data and ingest it into the main titles database.
            </p>

            <div className="mb-3">
              <p className="font-medium text-gray-700 mb-1">When to use:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-0.5">
                <li>After running a Title Investigator collection</li>
                <li>Verifying scraped data before ingestion</li>
                <li>Linking intelligence to existing titles</li>
              </ul>
            </div>

            <div className="mb-4">
              <p className="font-medium text-gray-700 mb-1">How to use:</p>
              <ol className="list-decimal list-inside text-gray-600 space-y-0.5">
                <li>Click a collection from the list</li>
                <li>Review metrics from each source</li>
                <li>Compare values across platforms</li>
                <li>Search for target title in database</li>
                <li>Select fields to ingest</li>
                <li>Click "Execute Ingestion"</li>
                <li>Data is merged with audit trail</li>
              </ol>
            </div>

            <div>
              <p className="font-medium text-gray-700 mb-2">Field Mapping (Intelligence → Titles):</p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-1.5 pr-4 font-medium text-gray-700">Intelligence Field</th>
                      <th className="text-left py-1.5 font-medium text-gray-700">Titles Table Field</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600">
                    <tr className="border-b border-gray-100">
                      <td className="py-1.5 pr-4">views</td>
                      <td className="py-1.5">views</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-1.5 pr-4">subscribers</td>
                      <td className="py-1.5">likes</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-1.5 pr-4">rating_score</td>
                      <td className="py-1.5">rating</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-1.5 pr-4">episode_count</td>
                      <td className="py-1.5">chapters</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-1.5 pr-4">synopsis_kr</td>
                      <td className="py-1.5">description_kr</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-1.5 pr-4">genre</td>
                      <td className="py-1.5">genre</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-1.5 pr-4">author</td>
                      <td className="py-1.5">story_author</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-1.5 pr-4">thumbnail</td>
                      <td className="py-1.5">title_image</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 pr-4">tags</td>
                      <td className="py-1.5">keywords</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
