import PreviewLayout1 from '@/components/layout/PreviewLayout1';
import PreviewBanner from '@/components/preview/PreviewBanner';
import StatsSection from '@/components/preview/StatsSection';
import CategoryPills from '@/components/preview/CategoryPills';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, TrendingUp, Eye, Award } from 'lucide-react';

export default function Design1Dashboard() {
  // Mock data for featured titles
  const featuredTitles = [
    {
      id: '1',
      title_name_en: 'The Villainess Reverses the Hourglass',
      title_image: 'https://placehold.co/400x600/8B7AB8/white?text=Title+1',
      genre: ['Fantasy', 'Romance'],
      rating: 9.2,
      views: '2.5M',
      description: 'Aria Roscente isn\'t a very good person. As a young child, she\'s always been a bit...much. But after her mother marries a count, Aria gets the chance to turn it all around.',
      author: 'Sansobee'
    },
    {
      id: '2',
      title_name_en: 'Solo Leveling',
      title_image: 'https://placehold.co/400x600/9F86C0/white?text=Title+2',
      genre: ['Action', 'Fantasy'],
      rating: 9.5,
      views: '5.8M',
      description: 'In a world where hunters—humans with supernatural abilities—must battle deadly monsters to protect mankind, Sung Jinwoo is the weakest of the weak.',
      author: 'Chugong'
    },
    {
      id: '3',
      title_name_en: 'True Beauty',
      title_image: 'https://placehold.co/400x600/B69FCE/white?text=Title+3',
      genre: ['Romance', 'Drama'],
      rating: 8.9,
      views: '3.2M',
      description: 'After binge-watching beauty videos online, a shy comic book fan masters the art of makeup and sees her social standing skyrocket.',
      author: 'Yaongyi'
    },
  ];

  return (
    <PreviewLayout1>
      <PreviewBanner designName="Design 1: Purple & Lavender" productionUrl="/buyers/chat" />

      <div className="max-w-7xl mx-auto">
        {/* Stats Section */}
        <StatsSection theme="purple" />

        {/* Category Pills */}
        <CategoryPills theme="purple" />

        {/* Featured Titles Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Featured This Week</h2>
              <p className="text-gray-600">Top-rated titles recommended by our AI</p>
            </div>
            <Button variant="outline" className="border-purple-300 text-purple-600 hover:bg-purple-50">
              View All
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredTitles.map((title) => (
              <Card key={title.id} className="group overflow-hidden border-purple-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-white">
                <div className="relative h-96 overflow-hidden">
                  <img
                    src={title.title_image}
                    alt={title.title_name_en}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-purple-600 text-white px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5 shadow-lg">
                    <Star className="h-4 w-4 fill-current" />
                    {title.rating}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-6 pt-24">
                    <h3 className="text-white font-bold text-xl mb-2">{title.title_name_en}</h3>
                    <div className="flex gap-2 mb-3">
                      {title.genre.map((g) => (
                        <span key={g} className="px-2.5 py-1 bg-purple-500/80 text-white text-xs rounded-full">
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <CardContent className="p-6">
                  <p className="text-gray-700 text-sm leading-relaxed mb-4 line-clamp-3">
                    {title.description}
                  </p>

                  {/* Author Info (Mentor Style) */}
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                      {title.author.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Story by</div>
                      <div className="font-semibold text-gray-900">{title.author}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Eye className="h-4 w-4 text-purple-500" />
                      <span>{title.views} views</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-purple-500" />
                      <span>Trending #1</span>
                    </div>
                  </div>

                  <Button className="w-full mt-4 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white shadow-lg shadow-purple-200">
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Achievement Section */}
        <Card className="bg-gradient-to-r from-purple-50 to-lavender-50 border-purple-200">
          <CardContent className="p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-purple-600 rounded-2xl p-4">
                <Award className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Your Discovery Journey</h3>
                <p className="text-gray-600">Keep exploring to unlock achievements</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 border border-purple-200">
                <div className="text-3xl mb-2">🎯</div>
                <div className="text-sm text-gray-600">Explorer</div>
                <div className="text-xs text-gray-500">50+ titles viewed</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-purple-200">
                <div className="text-3xl mb-2">💎</div>
                <div className="text-sm text-gray-600">Curator</div>
                <div className="text-xs text-gray-500">20+ favorites</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-purple-200 opacity-50">
                <div className="text-3xl mb-2">🏆</div>
                <div className="text-sm text-gray-600">Expert</div>
                <div className="text-xs text-gray-500">Locked</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-purple-200 opacity-50">
                <div className="text-3xl mb-2">⭐</div>
                <div className="text-sm text-gray-600">Master</div>
                <div className="text-xs text-gray-500">Locked</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PreviewLayout1>
  );
}
