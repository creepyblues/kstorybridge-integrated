import { useState } from 'react';

interface CategoryPillsProps {
  theme: 'purple' | 'coral' | 'slate';
}

export default function CategoryPills({ theme }: CategoryPillsProps) {
  const [activeCategory, setActiveCategory] = useState('all');

  const themeStyles = {
    purple: {
      active: 'bg-purple-600 text-white border-purple-600',
      inactive: 'bg-white text-gray-700 border-gray-300 hover:border-purple-300 hover:bg-purple-50',
    },
    coral: {
      active: 'bg-orange-500 text-white border-orange-500',
      inactive: 'bg-white text-gray-700 border-gray-300 hover:border-orange-300 hover:bg-orange-50',
    },
    slate: {
      active: 'bg-slate-600 text-white border-slate-600',
      inactive: 'bg-white text-gray-700 border-gray-300 hover:border-cyan-300 hover:bg-cyan-50',
    },
  };

  const styles = themeStyles[theme];

  const categories = [
    { id: 'all', label: 'All Titles', count: 400 },
    { id: 'webtoon', label: 'Webtoon', count: 156 },
    { id: 'web-novel', label: 'Web Novel', count: 98 },
    { id: 'romance', label: 'Romance', count: 142 },
    { id: 'fantasy', label: 'Fantasy', count: 127 },
    { id: 'action', label: 'Action', count: 89 },
    { id: 'drama', label: 'Drama', count: 115 },
  ];

  return (
    <div className="mb-6 sticky top-16 z-40 bg-gray-50 py-4 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 border-b border-gray-200">
      <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`
              px-4 py-2 rounded-full border-2 font-medium text-sm whitespace-nowrap
              transition-all duration-200
              ${activeCategory === category.id ? styles.active : styles.inactive}
            `}
          >
            {category.label}
            <span className="ml-2 opacity-70">({category.count})</span>
          </button>
        ))}
      </div>
    </div>
  );
}
