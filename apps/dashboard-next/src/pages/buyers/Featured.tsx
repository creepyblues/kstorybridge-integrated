import { BuyerLayout } from '@/components/layout/BuyerLayout';
import FeaturedTitlesCarousel from '@/components/FeaturedTitlesCarousel';
import { Star } from 'lucide-react';

export default function Featured() {
  return (
    <BuyerLayout>
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-hanok-teal to-hanok-teal/80 p-3 rounded-2xl shadow-lg">
              <Star className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-hanok-teal">Featured Titles</h1>
              <p className="text-lg text-gray-600 mt-1">AI-Curated Korean Content</p>
            </div>
          </div>
          <p className="text-gray-600 text-base">
            Discover our hand-picked selection of exceptional Korean IPs, carefully selected for market potential and storytelling excellence.
          </p>
        </div>

        {/* Featured Carousel */}
        <div className="mt-8">
          <FeaturedTitlesCarousel className="w-full" />
        </div>

        {/* Additional Info */}
        <div className="mt-12 p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-lg">
          <h2 className="text-xl font-bold text-hanok-teal mb-3">About Featured Titles</h2>
          <p className="text-gray-600 leading-relaxed">
            Our featured titles are carefully selected to showcase the best Korean intellectual properties available
            for licensing. Each featured title has been reviewed by our editorial team and represents exceptional
            storytelling, market potential, and cultural significance.
          </p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
              <h3 className="font-bold text-hanok-teal mb-2">✓ Editorial Review</h3>
              <p className="text-sm text-gray-600">
                Hand-picked by our team of industry experts
              </p>
            </div>
            <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
              <h3 className="font-bold text-hanok-teal mb-2">✓ Quality Content</h3>
              <p className="text-sm text-gray-600">
                Exceptional storytelling and production value
              </p>
            </div>
            <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
              <h3 className="font-bold text-hanok-teal mb-2">✓ Market Ready</h3>
              <p className="text-sm text-gray-600">
                Proven potential for international adaptation
              </p>
            </div>
          </div>
        </div>
      </div>
    </BuyerLayout>
  );
}
