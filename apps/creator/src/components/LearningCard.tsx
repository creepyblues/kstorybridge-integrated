import { Card } from '@/components/ui/card';

interface LearningCardProps {
  title: string;
  excerpt: string;
  featuredImageUrl?: string;
  authorName: string;
  publishedAt: string | null;
  category: 'learning' | 'news';
  onClick?: () => void;
}

export function LearningCard({
  title,
  excerpt,
  featuredImageUrl,
  authorName,
  publishedAt,
  category,
  onClick,
}: LearningCardProps) {
  // Format date to "MONTH DAY, YEAR" or "MONTH DAY"
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    };
    return date.toLocaleDateString('en-US', options).toUpperCase();
  };

  // Map category to display name
  const categoryDisplay = category === 'learning' ? 'LEARNING CENTER' : 'NEWS';

  return (
    <Card
      className="bg-transparent border-gray-300 shadow-none rounded-2xl hover:border-gray-400 transition-colors cursor-pointer overflow-hidden"
      onClick={onClick}
    >
      <div className="p-6">
        {/* Horizontal layout: content on left, image on right */}
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Left side - Content */}
          <div className="flex-1 flex flex-col">
            {/* Category and Date header */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                {categoryDisplay}
              </span>
              {publishedAt && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    {formatDate(publishedAt)}
                  </span>
                </>
              )}
            </div>

            {/* Title */}
            <h3 className="font-bold text-black text-xl sm:text-2xl mb-3 leading-tight line-clamp-3">
              {title}
            </h3>

            {/* Excerpt */}
            <p className="text-gray-600 leading-relaxed mb-4 line-clamp-2 flex-grow">
              {excerpt}
            </p>

            {/* Author */}
            <div className="text-sm text-gray-500 mt-auto">
              By {authorName}
            </div>
          </div>

          {/* Right side - Image (only if available) */}
          {featuredImageUrl && (
            <div className="w-full sm:w-48 h-48 flex-shrink-0 rounded-lg overflow-hidden">
              <img
                src={featuredImageUrl}
                alt={title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
