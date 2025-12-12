import { useState } from 'react';
import PreviewLayout2 from '@/components/layout/PreviewLayout2';
import PreviewBanner from '@/components/preview/PreviewBanner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icon } from '@iconify/react';

export default function Design2CompsNavigator() {
  const [compTitles, setCompTitles] = useState<string[]>(['Bridgerton']);
  const [refinementText, setRefinementText] = useState('');

  const handleAddComp = () => {
    if (compTitles.length < 3) {
      setCompTitles([...compTitles, '']);
    }
  };

  const handleRemoveComp = (index: number) => {
    setCompTitles(compTitles.filter((_, i) => i !== index));
  };

  const handleCompChange = (index: number, value: string) => {
    const newComps = [...compTitles];
    newComps[index] = value;
    setCompTitles(newComps);
  };

  // Mock results
  const mockResults = [
    {
      id: '1',
      title_name_en: 'The Remarried Empress',
      title_image: 'https://placehold.co/300x450/4C9C9B/white?text=Match+1',
      match_score: 92,
      genre: ['Fantasy', 'Romance'],
      rating: 9.2,
      views: '2.8M',
      match_reason: 'Strong female protagonist navigating political intrigue and romance in a royal court setting, similar to Bridgerton\'s regency-era social dynamics.',
    },
    {
      id: '2',
      title_name_en: 'The Villainess is a Marionette',
      title_image: 'https://placehold.co/300x450/E63946/white?text=Match+2',
      match_score: 88,
      genre: ['Fantasy', 'Drama'],
      rating: 9.0,
      views: '2.1M',
      match_reason: 'Court intrigue and manipulation tactics with elegant period aesthetics and high society drama.',
    },
    {
      id: '3',
      title_name_en: 'A Stepmother\'s Märchen',
      title_image: 'https://placehold.co/300x450/F77F00/white?text=Match+3',
      match_score: 85,
      genre: ['Fantasy', 'Romance'],
      rating: 8.8,
      views: '1.9M',
      match_reason: 'Time-loop narrative with political maneuvering and romantic elements in a historical fantasy setting.',
    },
  ];

  // Mock search history
  const searchHistory = [
    { id: '1', comps: ['Bridgerton', 'The Crown'], date: '2 hours ago', matchCount: 15 },
    { id: '2', comps: ['Game of Thrones'], date: '1 day ago', matchCount: 12 },
    { id: '3', comps: ['Squid Game', 'Alice in Borderland'], date: '3 days ago', matchCount: 18 },
  ];

  return (
    <PreviewLayout2>
      <PreviewBanner designName="Design 2: Hanok Teal & Sunrise Coral" productionUrl="/buyers/comps-navigator" />

      <div className="flex gap-8 max-w-7xl mx-auto">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="bg-hanok-teal p-3 rounded-2xl">
              <Icon icon="solar:compass-bold-duotone" className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
                Comps Navigator
              </h1>
              <p className="text-lg text-gray-600 mt-1">
                Find Korean titles using Hollywood comparables
              </p>
            </div>
          </div>
        </div>

        {/* Search Card */}
        <Card className="mb-8 border-hanok-teal/20 shadow-lg">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-hanok-teal/10 rounded-full p-2.5">
                <Icon icon="solar:stars-bold-duotone" className="h-5 w-5 text-hanok-teal" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Your Comparable Titles</h2>
                <p className="text-sm text-gray-600">Enter 1-3 titles you want to match against</p>
              </div>
            </div>

            {/* Comp Title Inputs */}
            <div className="space-y-3 mb-6">
              {compTitles.map((comp, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={comp}
                    onChange={(e) => handleCompChange(index, e.target.value)}
                    placeholder={`Comparable title ${index + 1} (e.g., Bridgerton, Game of Thrones)`}
                    className="flex-1 h-12 border-hanok-teal/30 focus:border-hanok-teal focus:ring-hanok-teal"
                  />
                  {compTitles.length > 1 && (
                    <Button
                      onClick={() => handleRemoveComp(index)}
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <Icon icon="solar:close-circle-bold-duotone" className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              {compTitles.length < 3 && (
                <Button
                  onClick={handleAddComp}
                  variant="outline"
                  className="w-full border-dashed border-2 border-hanok-teal/30 text-hanok-teal hover:bg-hanok-teal/5"
                >
                  <Icon icon="solar:add-circle-bold-duotone" className="h-4 w-4 mr-2" />
                  Add another comparable (optional)
                </Button>
              )}
            </div>

            {/* Refinement Text */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Context (Optional)
              </label>
              <Input
                value={refinementText}
                onChange={(e) => setRefinementText(e.target.value)}
                placeholder="e.g., Focus on romance elements, exclude action"
                className="h-12 border-hanok-teal/30 focus:border-hanok-teal focus:ring-hanok-teal"
              />
            </div>

            {/* Search Button */}
            <Button className="w-full h-12 bg-hanok-teal hover:bg-hanok-teal/90 text-white text-lg font-semibold shadow-lg">
              <Icon icon="solar:compass-bold-duotone" className="h-5 w-5 mr-2" />
              Find Matching Korean Titles
            </Button>
          </CardContent>
        </Card>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Top Matches</h2>
            <p className="text-gray-600">
              Based on: <span className="text-hanok-teal font-medium">{compTitles.filter(c => c).join(', ')}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-hanok-teal/5 px-4 py-2 rounded-full border border-hanok-teal/20">
            <Icon icon="solar:chat-square-bold-duotone" className="h-4 w-4 text-hanok-teal" />
            <span>AI-ranked similarity</span>
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockResults.map((result) => (
            <Card key={result.id} className="group overflow-hidden border-hanok-teal/20 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-white">
              {/* Image with Score Badge */}
              <div className="relative h-80 overflow-hidden">
                <img
                  src={result.title_image}
                  alt={result.title_name_en}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3">
                  <div className={`
                    px-4 py-2 rounded-full font-bold text-sm backdrop-blur-sm border-2
                    ${result.match_score >= 90
                      ? 'bg-emerald-500 text-white border-emerald-300'
                      : result.match_score >= 85
                      ? 'bg-hanok-teal text-white border-hanok-teal'
                      : 'bg-blue-500 text-white border-blue-300'
                    }
                  `}>
                    {result.match_score}% Match
                  </div>
                </div>
              </div>

              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">{result.title_name_en}</h3>

                <div className="flex gap-2 mb-4 flex-wrap">
                  {result.genre.map((g) => (
                    <span key={g} className="px-2.5 py-1 bg-hanok-teal/10 text-hanok-teal text-xs rounded-full font-medium">
                      {g}
                    </span>
                  ))}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Icon icon="solar:star-bold-duotone" className="h-4 w-4 text-yellow-500" />
                    <span className="font-semibold text-gray-900">{result.rating}</span>
                  </div>
                  <div>
                    {result.views} views
                  </div>
                </div>

                {/* AI Explanation */}
                <div className="mb-4">
                  <div className="flex items-start gap-2 mb-2">
                    <Icon icon="solar:chat-square-bold-duotone" className="h-4 w-4 text-hanok-teal mt-0.5 flex-shrink-0" />
                    <span className="text-xs font-semibold text-hanok-teal uppercase">Why it matches</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed bg-hanok-teal/5 rounded-lg p-3 border border-hanok-teal/10">
                    {result.match_reason}
                  </p>
                </div>

                <Button className="w-full bg-hanok-teal hover:bg-hanok-teal/90 text-white">
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats Footer */}
        <Card className="mt-8 bg-hanok-teal/5 border-hanok-teal/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon icon="solar:stars-bold-duotone" className="h-6 w-6 text-hanok-teal" />
                <div>
                  <div className="font-semibold text-gray-900">Search completed in 4.2s</div>
                  <div className="text-sm text-gray-600">Found 127 matches • Estimated cost: $0.002</div>
                </div>
              </div>
              <Button variant="outline" className="border-hanok-teal/30 text-hanok-teal hover:bg-hanok-teal/10">
                Refine Search
              </Button>
            </div>
          </CardContent>
        </Card>
        </div>

        {/* Right Sidebar - Search History */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-20">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-hanok-teal/10 rounded-full p-2">
                <Icon icon="solar:clock-circle-bold-duotone" className="h-4 w-4 text-hanok-teal" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900">Recent Searches</h2>
                <p className="text-xs text-gray-500">Quick re-runs</p>
              </div>
            </div>

            <div className="space-y-2">
              {searchHistory.map((search) => (
                <Card key={search.id} className="group border-hanok-teal/20 hover:border-hanok-teal hover:shadow-md transition-all duration-200 cursor-pointer bg-white">
                  <CardContent className="p-3">
                    <div className="mb-2">
                      <div className="flex flex-wrap gap-1 mb-2">
                        {search.comps.map((comp, idx) => (
                          <span
                            key={idx}
                            className="inline-block px-1.5 py-0.5 bg-hanok-teal/10 text-hanok-teal text-xs font-medium rounded-md"
                          >
                            {comp}
                          </span>
                        ))}
                      </div>
                      <div className="flex flex-col gap-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Icon icon="solar:clock-circle-bold-duotone" className="h-3 w-3" />
                          {search.date}
                        </span>
                        <span>{search.matchCount} matches</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-hanok-teal/30 text-hanok-teal hover:bg-hanok-teal hover:text-white transition-colors text-xs py-1"
                    >
                      <Icon icon="solar:refresh-circle-bold-duotone" className="h-3 w-3 mr-1" />
                      Re-run
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </PreviewLayout2>
  );
}
