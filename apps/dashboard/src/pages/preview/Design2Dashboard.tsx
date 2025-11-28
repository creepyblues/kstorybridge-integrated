import PreviewLayout2 from '@/components/layout/PreviewLayout2';
import PreviewBanner from '@/components/preview/PreviewBanner';
import StatsSection from '@/components/preview/StatsSection';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Star, Heart, BookOpen, TrendingUp, Search } from 'lucide-react';

export default function Design2Dashboard() {
  const trendingTitles = [
    {
      id: '1',
      title: 'Honey, I\'m Going on Strike',
      image: 'https://placehold.co/600x400/4C9C9B/white?text=Title+1',
      genre: ['Romance', 'Comedy'],
      rating: 9.1,
      views: '1.8M',
      trend: '+23%',
      description: 'A duchess decides to go on strike when she realizes her husband takes her for granted.',
    },
    {
      id: '2',
      title: 'The Reason Why Raeliana Ended up',
      image: 'https://placehold.co/600x400/E63946/white?text=Title+2',
      genre: ['Romance', 'Fantasy'],
      rating: 9.3,
      views: '2.1M',
      trend: '+31%',
      description: 'Transported into a novel as a side character doomed to die, she makes a dangerous deal.',
    },
    {
      id: '3',
      title: 'The Abandoned Empress',
      image: 'https://placehold.co/600x400/F77F00/white?text=Title+3',
      genre: ['Fantasy', 'Drama'],
      rating: 8.9,
      views: '1.5M',
      trend: '+18%',
      description: 'After being executed, the empress is given a second chance to rewrite her tragic fate.',
    },
  ];

  return (
    <PreviewLayout2>
      <PreviewBanner designName="Design 2: Hanok Teal & Sunrise Coral" productionUrl="/buyers/chat" />

      <div className="max-w-7xl mx-auto">
        {/* Stats with Bar Chart */}
        <StatsSection theme="coral" />

        {/* Category Pills (Horizontal Navigation Style) */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Browse by Genre</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
            <button className="px-6 py-3 rounded-full bg-hanok-teal text-white font-medium text-sm whitespace-nowrap transition-all hover:bg-hanok-teal/90 shadow-sm">
              All Titles <span className="ml-1.5">(400)</span>
            </button>
            <button className="px-6 py-3 rounded-full bg-white border-2 border-gray-300 text-gray-700 font-medium text-sm whitespace-nowrap transition-all hover:border-hanok-teal hover:bg-hanok-teal/5">
              Webtoon <span className="ml-1.5 text-gray-500">(156)</span>
            </button>
            <button className="px-6 py-3 rounded-full bg-white border-2 border-gray-300 text-gray-700 font-medium text-sm whitespace-nowrap transition-all hover:border-hanok-teal hover:bg-hanok-teal/5">
              Web Novel <span className="ml-1.5 text-gray-500">(98)</span>
            </button>
            <button className="px-6 py-3 rounded-full bg-white border-2 border-gray-300 text-gray-700 font-medium text-sm whitespace-nowrap transition-all hover:border-hanok-teal hover:bg-hanok-teal/5">
              Romance <span className="ml-1.5 text-gray-500">(142)</span>
            </button>
            <button className="px-6 py-3 rounded-full bg-white border-2 border-gray-300 text-gray-700 font-medium text-sm whitespace-nowrap transition-all hover:border-hanok-teal hover:bg-hanok-teal/5">
              Fantasy <span className="ml-1.5 text-gray-500">(127)</span>
            </button>
            <button className="px-6 py-3 rounded-full bg-white border-2 border-gray-300 text-gray-700 font-medium text-sm whitespace-nowrap transition-all hover:border-hanok-teal hover:bg-hanok-teal/5">
              Action <span className="ml-1.5 text-gray-500">(89)</span>
            </button>
            <button className="px-6 py-3 rounded-full bg-white border-2 border-gray-300 text-gray-700 font-medium text-sm whitespace-nowrap transition-all hover:border-hanok-teal hover:bg-hanok-teal/5">
              Drama <span className="ml-1.5 text-gray-500">(115)</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search titles by name, genre, or keyword..."
              className="pl-12 h-14 border-hanok-teal/30 focus:border-hanok-teal focus:ring-hanok-teal text-base"
            />
          </div>
        </div>

        {/* Trending Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-hanok-teal/10 rounded-xl p-3">
                <TrendingUp className="h-6 w-6 text-hanok-teal" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Trending This Week</h2>
                <p className="text-gray-600">Most-viewed titles gaining momentum</p>
              </div>
            </div>
            <Button variant="outline" className="border-hanok-teal/30 text-hanok-teal hover:bg-hanok-teal/10">
              View All
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingTitles.map((title) => (
              <Card key={title.id} className="overflow-hidden border-hanok-teal/20 hover:shadow-xl transition-all duration-300 group bg-white">
                {/* Horizontal Image Layout */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={title.image}
                    alt={title.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="bg-sunrise-coral text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {title.trend}
                      </div>
                      <div className="bg-white/90 text-gray-900 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        {title.rating}
                      </div>
                    </div>
                  </div>
                </div>

                <CardContent className="p-5">
                  <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1">{title.title}</h3>

                  <div className="flex gap-2 mb-3">
                    {title.genre.map((g) => (
                      <span key={g} className="px-2 py-0.5 bg-hanok-teal/10 text-hanok-teal text-xs rounded-full">
                        {g}
                      </span>
                    ))}
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {title.description}
                  </p>

                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <BookOpen className="h-4 w-4 text-hanok-teal" />
                      {title.views}
                    </div>
                    <button className="text-sunrise-coral hover:text-red-600">
                      <Heart className="h-5 w-5" />
                    </button>
                  </div>

                  <Button className="w-full bg-hanok-teal hover:bg-hanok-teal/90 text-white shadow-md">
                    Explore Title
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Discovery Insights */}
        <Card className="bg-hanok-teal/5 border-hanok-teal/20">
          <CardContent className="p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Your Discovery Insights</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-3xl font-bold text-hanok-teal mb-1">42</div>
                <div className="text-sm text-gray-600 mb-3">Titles Viewed</div>
                <div className="h-2 bg-hanok-teal/20 rounded-full overflow-hidden">
                  <div className="h-full bg-hanok-teal rounded-full" style={{ width: '65%' }}></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">65% of weekly goal</div>
              </div>

              <div>
                <div className="text-3xl font-bold text-sunrise-coral mb-1">18</div>
                <div className="text-sm text-gray-600 mb-3">Saved Favorites</div>
                <div className="h-2 bg-sunrise-coral/20 rounded-full overflow-hidden">
                  <div className="h-full bg-sunrise-coral rounded-full" style={{ width: '90%' }}></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">90% of monthly goal</div>
              </div>

              <div>
                <div className="text-3xl font-bold text-hanok-teal mb-1">27</div>
                <div className="text-sm text-gray-600 mb-3">AI Searches</div>
                <div className="h-2 bg-hanok-teal/20 rounded-full overflow-hidden">
                  <div className="h-full bg-hanok-teal rounded-full" style={{ width: '45%' }}></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">45% of weekly goal</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PreviewLayout2>
  );
}
