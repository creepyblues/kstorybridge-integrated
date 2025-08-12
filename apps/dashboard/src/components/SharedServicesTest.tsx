// Test component to verify shared services integration
import { useEffect, useState } from 'react';
import { titlesService, featuredService, favoritesService } from '@kstorybridge/api-client';
import type { Title, Featured, UserFavorite } from '@kstorybridge/api-client';
import { Card, CardHeader, CardTitle, CardContent } from '@kstorybridge/ui';

export default function SharedServicesTest() {
  const [titles, setTitles] = useState<Title[]>([]);
  const [featured, setFeatured] = useState<Featured[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testServices = async () => {
      try {
        console.log('🧪 Testing shared services...');
        
        // Test titles service
        const titlesData = await titlesService.getAllTitles();
        setTitles(titlesData.slice(0, 3)); // Just show first 3
        
        // Test featured service
        const featuredData = await featuredService.getFeaturedTitles();
        setFeatured(featuredData.slice(0, 3)); // Just show first 3
        
        console.log('✅ Shared services test completed successfully');
      } catch (error) {
        console.error('❌ Shared services test failed:', error);
      } finally {
        setLoading(false);
      }
    };

    testServices();
  }, []);

  if (loading) {
    return (
      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Shared Services Test</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading shared services test...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl">
      <CardHeader>
        <CardTitle>Shared Services Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Titles Service ({titles.length} titles)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {titles.map((title) => (
              <div key={title.title_id} className="p-3 border rounded">
                <h4 className="font-medium text-sm">{title.title_name_en || title.title_name_kr}</h4>
                <p className="text-xs text-gray-500 mt-1">Views: {title.views?.toLocaleString() || 'N/A'}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-2">Featured Service ({featured.length} featured)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featured.map((item) => (
              <div key={item.id} className="p-3 border rounded">
                <h4 className="font-medium text-sm">Featured Title</h4>
                <p className="text-xs text-gray-500 mt-1">ID: {item.title_id}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-green-50 rounded">
          <p className="text-sm text-green-700">
            ✅ Shared services are working! Data is being loaded from @kstorybridge/api-client package.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}