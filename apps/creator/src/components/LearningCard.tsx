import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface LearningCardProps {
  title: string;
  description: string;
  imageUrl?: string;
  tags: string[];
  onClick?: () => void;
}

export function LearningCard({ title, description, imageUrl, tags, onClick }: LearningCardProps) {
  return (
    <Card
      className="bg-transparent border-gray-300 shadow-none rounded-2xl hover:border-sunrise-coral-300 transition-colors cursor-pointer overflow-hidden"
      onClick={onClick}
    >
      {/* Cover Image - 4:3 aspect ratio */}
      <div className="relative w-full" style={{ paddingTop: '75%' }}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="absolute top-0 left-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <span className="text-gray-400 text-sm font-medium">No Image</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-bold text-black text-lg mb-2 line-clamp-2 hover:text-sunrise-coral-600 transition-colors">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-700 mb-3 line-clamp-2">
          {description}
        </p>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <Badge
                key={index}
                variant="outline"
                className="border-sunrise-coral-300 text-sunrise-coral-600 text-xs px-2 py-0.5 hover:bg-sunrise-coral-50 transition-colors"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
