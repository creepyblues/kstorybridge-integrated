import { BuyerLayout } from '@/components/layout/BuyerLayout';
import FeaturedTitlesCarousel from '@/components/FeaturedTitlesCarousel';
import { Star } from 'lucide-react';

export default function Featured() {
  return (
    <BuyerLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Star className="h-8 w-8 text-gray-700" />
          <div>
            <h1 className="text-3xl font-bold text-black">Featured Titles</h1>
            <p className="text-gray-600 mt-1">Discover our hand-picked selection of exceptional Korean IPs</p>
          </div>
        </div>

        {/* Featured Carousel */}
        <div className="mt-8">
          <FeaturedTitlesCarousel className="w-full" />
        </div>

        {/* Additional Info */}
        <div className="mt-12 p-6 bg-gray-50 rounded-2xl border border-gray-300">
          <h2 className="text-xl font-bold text-black mb-3">About Featured Titles</h2>
          <p className="text-gray-600 leading-relaxed">
            Our featured titles are carefully selected to showcase the best Korean intellectual properties available
            for licensing. Each featured title has been reviewed by our editorial team and represents exceptional
            storytelling, market potential, and cultural significance.
          </p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <h3 className="font-bold text-black mb-2">✓ Editorial Review</h3>
              <p className="text-sm text-gray-600">
                Hand-picked by our team of industry experts
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <h3 className="font-bold text-black mb-2">✓ Quality Content</h3>
              <p className="text-sm text-gray-600">
                Exceptional storytelling and production value
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <h3 className="font-bold text-black mb-2">✓ Market Ready</h3>
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
