import FeaturedTitleCard from './FeaturedTitleCard';
import type { FeaturedWithTitle } from '@/services/featuredService';

interface FeaturedSectionProps {
  name: string;
  description?: string | null;
  titles: FeaturedWithTitle[];
}

export default function FeaturedSection({ name, description, titles }: FeaturedSectionProps) {
  if (titles.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="border-b border-gray-200 pb-3">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
          {name}
        </h2>
        {description && (
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        )}
      </div>

      {/* Titles in this section */}
      <div className="space-y-6">
        {titles.map((featured) => (
          <FeaturedTitleCard key={featured.id} featured={featured} />
        ))}
      </div>
    </div>
  );
}
