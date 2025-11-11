import { MainLayout } from '@/components/layout/MainLayout';
import { LearningCard } from '@/components/LearningCard';

// Placeholder data - will be replaced with CMS data later
const placeholderLearningMaterials = [
  {
    id: 1,
    title: 'How Hollywood works',
    description: 'Kevin unravels insider secrets about How Hollywood works and provide insights and strategy to standout in the game!',
    imageUrl: undefined, // No image yet - will show gradient placeholder
    tags: ['Hollywood', 'development', 'insight'],
  },
];

export default function LearningCenter() {
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        {/* Page Title */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-black">Learning Center</h1>
          <p className="text-gray-700 mt-2">
            Access key learning materials to help you succeed in the entertainment industry
          </p>
        </div>

        {/* Learning Materials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {placeholderLearningMaterials.map((material) => (
            <LearningCard
              key={material.id}
              title={material.title}
              description={material.description}
              imageUrl={material.imageUrl}
              tags={material.tags}
              onClick={() => {
                // TODO: Navigate to learning material detail page or open modal
                console.log('Learning material clicked:', material.title);
              }}
            />
          ))}
        </div>

        {/* Empty State - shown when no materials available */}
        {placeholderLearningMaterials.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No learning materials available yet. Check back soon!</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
