import PreviewLayout3 from '@/components/layout/PreviewLayout3';
import PreviewBanner from '@/components/preview/PreviewBanner';
import StatsSection from '@/components/preview/StatsSection';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';

export default function Design3Dashboard() {
  const compactTitles = [
    {
      id: '1',
      title: 'Omniscient Reader\'s Viewpoint',
      image: 'https://placehold.co/300x200/64748B/white?text=Title+1',
      genre: ['Action', 'Fantasy'],
      format: 'Webtoon',
      rating: 9.4,
      chapters: 127,
      views: '8.2M',
    },
    {
      id: '2',
      title: 'The Beginning After The End',
      image: 'https://placehold.co/300x200/475569/white?text=Title+2',
      genre: ['Fantasy', 'Adventure'],
      format: 'Webtoon',
      rating: 9.2,
      chapters: 156,
      views: '6.8M',
    },
    {
      id: '3',
      title: 'Eleceed',
      image: 'https://placehold.co/300x200/334155/white?text=Title+3',
      genre: ['Action', 'Comedy'],
      format: 'Webtoon',
      rating: 9.1,
      chapters: 245,
      views: '5.4M',
    },
    {
      id: '4',
      title: 'Lookism',
      image: 'https://placehold.co/300x200/1e293b/white?text=Title+4',
      genre: ['Drama', 'Action'],
      format: 'Webtoon',
      rating: 8.9,
      chapters: 460,
      views: '7.1M',
    },
    {
      id: '5',
      title: 'Wind Breaker',
      image: 'https://placehold.co/300x200/0f172a/white?text=Title+5',
      genre: ['Action', 'Sports'],
      format: 'Webtoon',
      rating: 8.8,
      chapters: 478,
      views: '4.9M',
    },
    {
      id: '6',
      title: 'Weak Hero',
      image: 'https://placehold.co/300x200/06b6d4/white?text=Title+6',
      genre: ['Action', 'Drama'],
      format: 'Webtoon',
      rating: 9.0,
      chapters: 225,
      views: '6.2M',
    },
  ];

  return (
    <PreviewLayout3>
      <PreviewBanner designName="Design 3: Cool Slate & Cyan" productionUrl="/buyers/chat" />

      <div className="max-w-7xl mx-auto">
        {/* Minimalist Stats */}
        <StatsSection theme="slate" />

        {/* Quick Filters Bar */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Icon icon="solar:filter-bold-duotone" className="h-5 w-5 text-slate-600" />
            <h2 className="text-xl font-bold text-gray-900">Quick Filters</h2>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {['All', 'Webtoon', 'Web Novel', 'Romance', 'Fantasy', 'Action', 'New Arrivals'].map((filter) => (
              <button
                key={filter}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                  ${filter === 'All'
                    ? 'bg-slate-700 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:border-cyan-400 hover:bg-cyan-50'
                  }
                `}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Compact Title Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Top Rated Titles</h2>
            <Button variant="outline" size="sm" className="border-slate-300 text-slate-700 hover:bg-slate-50">
              View All
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {compactTitles.map((title) => (
              <Card key={title.id} className="group hover:shadow-lg transition-all duration-200 border-slate-200 bg-white">
                <div className="flex gap-4 p-4">
                  {/* Compact Image */}
                  <div className="relative w-24 h-32 flex-shrink-0 overflow-hidden rounded-lg">
                    <img
                      src={title.image}
                      alt={title.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>

                  {/* Dense Metadata */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-gray-900 mb-2 line-clamp-2 group-hover:text-cyan-700 transition-colors">
                      {title.title}
                    </h3>

                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {title.genre.slice(0, 2).map((g) => (
                        <span key={g} className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded">
                          {g}
                        </span>
                      ))}
                      <span className="px-2 py-0.5 bg-cyan-100 text-cyan-700 text-xs rounded font-medium">
                        {title.format}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-gray-600 mb-3">
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:star-bold-duotone" className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        <span className="font-semibold text-gray-900">{title.rating}</span>
                        <span>·</span>
                        <span>{title.chapters} ch</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:book-bold-duotone" className="h-3 w-3 text-slate-400" />
                        <span>{title.views} views</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 h-7 text-xs bg-slate-700 hover:bg-slate-800 text-white">
                        View
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 w-7 p-0 border-slate-300 hover:bg-cyan-50 hover:border-cyan-400">
                        <Icon icon="solar:heart-bold-duotone" className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Minimal Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-slate-700 mb-1">400</div>
              <div className="text-xs text-gray-600">Total Titles</div>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-cyan-600 mb-1">42</div>
              <div className="text-xs text-gray-600">Viewed</div>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-cyan-600 mb-1">18</div>
              <div className="text-xs text-gray-600">Saved</div>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-cyan-600 mb-1">27</div>
              <div className="text-xs text-gray-600">Searches</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PreviewLayout3>
  );
}
