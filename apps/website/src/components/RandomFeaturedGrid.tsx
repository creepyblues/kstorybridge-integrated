import { useState, useEffect } from 'react';
import { Card, CardContent } from '@kstorybridge/ui';
import { featuredService, type FeaturedWithTitle } from '../services/featuredService';

interface RandomFeaturedGridProps {
  className?: string;
  count?: number;
}

const checkImage = (url: string): Promise<boolean> =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });

const shuffle = <T,>(arr: T[]): T[] => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const RandomFeaturedGrid = ({ className = "", count = 6 }: RandomFeaturedGridProps) => {
  const [featuredTitles, setFeaturedTitles] = useState<FeaturedWithTitle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const all = await featuredService.getFeaturedTitles();
        const candidates = shuffle(all).filter((f) => Boolean(f.titles?.title_image));

        const validations = await Promise.all(
          candidates.map(async (item) => ({
            item,
            ok: await checkImage(item.titles!.title_image as string),
          }))
        );

        const valid = validations
          .filter((v) => v.ok)
          .map((v) => v.item)
          .slice(0, count);

        if (!cancelled) setFeaturedTitles(valid);
      } catch (error) {
        console.error('Error loading random featured titles:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
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
          const title = featured.titles as typeof featured.titles & { story_author?: string | null };
          return (
            <Card
              key={featured.id}
              className="bg-white rounded-xl border-0 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 group h-full flex flex-col"
            >
              <div className="aspect-[3/4] bg-gradient-to-br from-porcelain-blue-100 to-hanok-teal-100 relative overflow-hidden">
                <img
                  src={title.title_image as string}
                  alt={title.title_name_en || title.title_name_kr}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
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
