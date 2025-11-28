import PreviewLayout1 from '@/components/layout/PreviewLayout1';
import PreviewBanner from '@/components/preview/PreviewBanner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Bot, Star, TrendingUp, Sparkles } from 'lucide-react';

export default function Design1CompsNavigator() {

  const mockResults = [
    {
      id: '1',
      title_name_en: 'The Remarried Empress',
      title_image: 'https://placehold.co/300x450/8B7AB8/white?text=Match+1',
      match_score: 92,
      genre: ['Fantasy', 'Romance'],
      match_reason: 'Strong female protagonist navigating political intrigue similar to Game of Thrones\' Cersei, with romantic elements like Bridgerton.',
    },
    {
      id: '2',
      title_name_en: 'The Villainess is a Marionette',
      title_image: 'https://placehold.co/300x450/9F86C0/white?text=Match+2',
      match_score: 88,
      genre: ['Fantasy', 'Drama'],
      match_reason: 'Court intrigue and manipulation tactics reminiscent of The Tudors meets subtle supernatural elements.',
    },
    {
      id: '3',
      title_name_en: 'A Stepmother\'s Märchen',
      title_image: 'https://placehold.co/300x450/B69FCE/white?text=Match+3',
      match_score: 85,
      genre: ['Fantasy', 'Romance', 'Drama'],
      match_reason: 'Time-loop narrative with political maneuvering and character development similar to Russian Doll meets period drama.',
    },
  ];

  return (
    <PreviewLayout1>
      <PreviewBanner designName="Design 1: Purple & Lavender" productionUrl="/buyers/comps-navigator" />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
            Find Korean Titles by Hollywood Comps
          </h1>
          <p className="text-lg text-gray-600">
            Use 1-3 comparable titles to discover Korean stories with similar appeal
          </p>
        </div>

        {/* Search Card */}
        <Card className="mb-8 bg-gradient-to-br from-white to-purple-50 border-purple-200 shadow-lg">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-purple-600 rounded-full p-3">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">AI-Powered Search</h2>
                <p className="text-sm text-gray-600">Enter 1-3 comparable titles you love</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-400" />
                <Input
                  placeholder="e.g., Bridgerton, Game of Thrones, The Crown..."
                  className="pl-12 h-14 text-lg border-purple-300 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                <span className="text-sm text-gray-600">Popular comps:</span>
                {['Bridgerton', 'Game of Thrones', 'The Crown', 'Squid Game'].map((comp) => (
                  <button
                    key={comp}
                    className="px-3 py-1.5 bg-white border-2 border-purple-200 text-purple-700 rounded-full text-sm hover:bg-purple-50 transition-colors"
                  >
                    {comp}
                  </button>
                ))}
              </div>

              <Button className="w-full h-12 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white text-lg font-semibold shadow-lg shadow-purple-200">
                Search Titles
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Top Matches</h2>
            <p className="text-gray-600">Based on: <span className="text-purple-600 font-medium">Game of Thrones, Bridgerton</span></p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Bot className="h-5 w-5 text-purple-600" />
            <span>AI-ranked by similarity</span>
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {mockResults.map((result) => (
            <Card key={result.id} className="group overflow-hidden border-purple-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-white">
              {/* Image with Score Badge */}
              <div className="relative h-72 overflow-hidden">
                <img
                  src={result.title_image}
                  alt={result.title_name_en}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3">
                  <div className={`
                    px-4 py-2 rounded-full font-bold text-sm backdrop-blur-sm border-2
                    ${result.match_score >= 90
                      ? 'bg-gradient-to-r from-emerald-500/90 to-emerald-400/90 text-white border-emerald-300'
                      : result.match_score >= 85
                      ? 'bg-gradient-to-r from-purple-500/90 to-purple-400/90 text-white border-purple-300'
                      : 'bg-gradient-to-r from-blue-500/90 to-blue-400/90 text-white border-blue-300'
                    }
                  `}>
                    {result.match_score}% Match
                  </div>
                </div>
              </div>

              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">{result.title_name_en}</h3>

                <div className="flex gap-2 mb-4">
                  {result.genre.map((g) => (
                    <span key={g} className="px-2.5 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                      {g}
                    </span>
                  ))}
                </div>

                {/* AI Explanation */}
                <div className="mb-4">
                  <div className="flex items-start gap-2 mb-2">
                    <Bot className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span className="text-xs font-semibold text-purple-600 uppercase">Why it matches</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed bg-purple-50 rounded-lg p-3 border border-purple-100">
                    {result.match_reason}
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <Button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">
                    View Details
                  </Button>
                  <Button variant="outline" size="icon" className="border-purple-300 text-purple-600 hover:bg-purple-50">
                    <Star className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats Footer */}
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-purple-600" />
                <div>
                  <div className="font-semibold text-gray-900">Search completed in 4.2s</div>
                  <div className="text-sm text-gray-600">Found 127 matches across all genres</div>
                </div>
              </div>
              <Button variant="outline" className="border-purple-300 text-purple-600 hover:bg-white">
                Refine Search
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PreviewLayout1>
  );
}
