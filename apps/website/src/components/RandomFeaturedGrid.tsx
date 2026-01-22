import { useState, useEffect } from 'react';
import { Card, CardContent } from '@kstorybridge/ui';
import { Star } from 'lucide-react';
import { featuredService, type FeaturedWithTitle } from '../services/featuredService';

interface RandomFeaturedGridProps {
  className?: string;
  count?: number;
}

const RandomFeaturedGrid = ({ className = "", count = 6 }: RandomFeaturedGridProps) => {
  const [featuredTitles, setFeaturedTitles] = useState<FeaturedWithTitle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRandomTitles = async () => {
      try {
        setLoading(true);
        const titles = await featuredService.getRandomFeaturedTitles(count);
        setFeaturedTitles(titles);
      } catch (error) {
        console.error('Error loading random featured titles:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRandomTitles();
  }, [count]);

  if (loading) {
    return (
      <div className={`text-center text-midnight-ink-600 py-8 ${className}`}>
        Loading featured titles...
      </div>
    );
  }

  if (featuredTitles.length === 0) {
    return (
      <div className={`text-center text-midnight-ink-600 py-8 ${className}`}>
        No featured titles available.
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {featuredTitles.map((featured) => {
          const title = featured.titles;
          return (
            <Card
              key={featured.id}
              className="bg-white rounded-xl border-0 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 group h-full flex flex-col"
            >
              <div className="aspect-[3/4] bg-gradient-to-br from-porcelain-blue-100 to-hanok-teal-100 flex items-center justify-center relative overflow-hidden">
                {title.title_image ? (
                  <img
                    src={title.title_image}
                    alt={title.title_name_en || title.title_name_kr}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="text-center p-4">
                    <Star className="w-8 h-8 text-hanok-teal mx-auto mb-2" />
                    <p className="text-xs text-midnight-ink-600 leading-tight">
                      {title.title_name_en || title.title_name_kr}
                    </p>
                  </div>
                )}
              </div>

              <CardContent className="p-4 flex-1 flex flex-col">
                <h3 className="font-bold text-midnight-ink text-sm mb-1 line-clamp-2 flex-1">
                  {title.title_name_en || title.title_name_kr}
                </h3>

                {title.story_author && (
                  <p className="text-xs text-midnight-ink-600">
                    by {title.story_author}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default RandomFeaturedGrid;
