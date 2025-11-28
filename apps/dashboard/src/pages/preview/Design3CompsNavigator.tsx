import PreviewLayout3 from '@/components/layout/PreviewLayout3';
import PreviewBanner from '@/components/preview/PreviewBanner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Bot, Plus, X } from 'lucide-react';
import { useState } from 'react';

export default function Design3CompsNavigator() {
  const [comps, setComps] = useState(['Bridgerton', 'Game of Thrones']);

  const mockResults = [
    {
      id: '1',
      title: 'The Red Sleeve',
      image: 'https://placehold.co/250x150/64748B/white?text=Result+1',
      match: 91,
      genre: ['Romance', 'Historical'],
      format: 'Web Novel',
      rating: 9.2,
      chapters: 45,
      reason: 'Period romance with court intrigue.',
    },
    {
      id: '2',
      title: 'Mr. Queen',
      image: 'https://placehold.co/250x150/475569/white?text=Result+2',
      match: 87,
      genre: ['Comedy', 'Historical'],
      format: 'Web Novel',
      rating: 9.0,
      chapters: 38,
      reason: 'Time-slip comedy with royal politics.',
    },
    {
      id: '3',
      title: 'The King\'s Affection',
      image: 'https://placehold.co/250x150/334155/white?text=Result+3',
      match: 84,
      genre: ['Romance', 'Drama'],
      format: 'Webtoon',
      rating: 8.8,
      chapters: 62,
      reason: 'Hidden identity in royal court setting.',
    },
  ];

  return (
    <PreviewLayout3>
      <PreviewBanner designName="Design 3: Cool Slate & Cyan" productionUrl="/buyers/comps-navigator" />

      <div className="max-w-6xl mx-auto">
        {/* Minimal Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Comparable Title Search
          </h1>
          <p className="text-sm text-gray-600">
            Enter Hollywood/global titles to find similar Korean content
          </p>
        </div>

        {/* Compact Search Card */}
        <Card className="mb-6 border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-slate-100 rounded-lg p-2">
                <Search className="h-4 w-4 text-slate-600" />
              </div>
              <h2 className="font-semibold text-gray-900">Your Comparables</h2>
            </div>

            {/* Chip-based Comp Display */}
            <div className="flex flex-wrap gap-2 mb-4">
              {comps.map((comp, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5">
                  <span className="text-sm font-medium text-slate-700">{comp}</span>
                  <button
                    onClick={() => setComps(comps.filter((_, i) => i !== idx))}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {comps.length < 3 && (
                <button className="flex items-center gap-1.5 border-2 border-dashed border-slate-300 rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:border-cyan-400 hover:text-cyan-700 transition-colors">
                  <Plus className="h-3 w-3" />
                  Add comparable
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Add another comparable..."
                className="h-9 text-sm border-slate-300 focus:border-cyan-400"
              />
              <Button size="sm" className="bg-slate-700 hover:bg-slate-800 text-white whitespace-nowrap">
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Results</h2>
            <p className="text-xs text-gray-600">Based on {comps.length} comparables</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <Bot className="h-3.5 w-3.5 text-slate-600" />
            AI-ranked
          </div>
        </div>

        {/* Compact Results List */}
        <div className="space-y-3">
          {mockResults.map((result, idx) => (
            <Card key={result.id} className="border-slate-200 hover:shadow-md hover:border-cyan-300 transition-all group">
              <div className="flex gap-4 p-4">
                {/* Rank Badge */}
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-700 group-hover:bg-cyan-100 group-hover:text-cyan-700 transition-colors">
                  #{idx + 1}
                </div>

                {/* Compact Image */}
                <div className="relative w-32 h-20 flex-shrink-0 overflow-hidden rounded-lg">
                  <img
                    src={result.image}
                    alt={result.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-sm text-gray-900 group-hover:text-cyan-700 transition-colors">
                      {result.title}
                    </h3>
                    <div className="flex items-center gap-1.5 ml-3">
                      <div className="text-lg font-bold text-cyan-600">{result.match}%</div>
                      <div className="text-xs text-gray-500">match</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {result.genre.map((g) => (
                      <span key={g} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">
                        {g}
                      </span>
                    ))}
                    <span className="px-2 py-0.5 bg-cyan-100 text-cyan-700 text-xs rounded font-medium">
                      {result.format}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 line-clamp-1 mb-2">
                    {result.reason}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>★ {result.rating}</span>
                    <span>{result.chapters} chapters</span>
                  </div>
                </div>

                {/* Action */}
                <div className="flex-shrink-0 flex items-center">
                  <Button size="sm" variant="outline" className="h-8 text-xs border-slate-300 hover:bg-cyan-50 hover:border-cyan-400 hover:text-cyan-700">
                    View Details
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Compact Footer Stats */}
        <div className="mt-6 flex items-center justify-between text-sm text-gray-600 bg-slate-50 rounded-lg p-4 border border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
            <span>Search completed in 3.8s</span>
          </div>
          <span>127 total matches found</span>
        </div>
      </div>
    </PreviewLayout3>
  );
}
