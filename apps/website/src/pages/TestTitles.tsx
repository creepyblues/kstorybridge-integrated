import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Title = Tables<'titles'>;

const TestTitles: React.FC = () => {
  const [titles, setTitles] = useState<Title[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTitles = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('titles')
          .select('*')
          .limit(10);

        if (error) {
          throw error;
        }

        setTitles(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTitles();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Testing Supabase Connection</h1>
        <p>Loading titles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Testing Supabase Connection</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Testing Supabase Connection</h1>
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
        <strong>Success!</strong> Connected to Supabase and fetched {titles.length} titles.
      </div>
      
      <h2 className="text-xl font-semibold mb-4">Titles from Database:</h2>
      
      {titles.length === 0 ? (
        <p className="text-gray-600">No titles found in the database.</p>
      ) : (
        <div className="grid gap-4">
          {titles.map((title) => (
            <div key={title.title_id} className="border p-4 rounded-lg shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-bold text-lg mb-2">
                    {title.title_name_kr}
                    {title.title_name_en && (
                      <span className="text-gray-600 font-normal"> ({title.title_name_en})</span>
                    )}
                  </h3>
                  
                  <div className="space-y-1 text-sm">
                    <p><strong>Format:</strong> {title.content_format || 'N/A'}</p>
                    <p><strong>Genre:</strong> {title.genre || 'N/A'}</p>
                    <p><strong>Author:</strong> {title.author || 'N/A'}</p>
                    <p><strong>Writer:</strong> {title.writer || 'N/A'}</p>
                    <p><strong>Illustrator:</strong> {title.illustrator || 'N/A'}</p>
                  </div>
                </div>
                
                <div>
                  <div className="space-y-1 text-sm">
                    <p><strong>Rating:</strong> {title.rating ? `${title.rating}/5` : 'N/A'} 
                      {title.rating_count && ` (${title.rating_count} reviews)`}</p>
                    <p><strong>Views:</strong> {title.views || 0}</p>
                    <p><strong>Likes:</strong> {title.likes || 0}</p>
                    <p><strong>Created:</strong> {new Date(title.created_at).toLocaleDateString()}</p>
                  </div>
                  
                  {title.tags && title.tags.length > 0 && (
                    <div className="mt-2">
                      <strong className="text-sm">Tags:</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {title.tags.map((tag, index) => (
                          <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {title.synopsis && (
                <div className="mt-3 pt-3 border-t">
                  <strong className="text-sm">Synopsis:</strong>
                  <p className="text-sm text-gray-700 mt-1">{title.synopsis}</p>
                </div>
              )}
              
              {title.pitch && (
                <div className="mt-2">
                  <strong className="text-sm">Pitch:</strong>
                  <p className="text-sm text-gray-700 mt-1">{title.pitch}</p>
                </div>
              )}
              
              {title.title_url && (
                <div className="mt-2">
                  <a 
                    href={title.title_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm underline"
                  >
                    View Original →
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TestTitles;