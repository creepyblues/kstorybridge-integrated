import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Title = Tables<'titles'>;

const TestTitlesWithSample: React.FC = () => {
  const [titles, setTitles] = useState<Title[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('');

  const createSampleTitle = async () => {
    try {
      const sampleTitle = {
        title_name_kr: "샘플 웹툰",
        title_name_en: "Sample Webtoon",
        content_format: "webtoon" as const,
        genre: "romance" as const,
        author: "김작가",
        writer: "김작가",
        illustrator: "박화가",
        synopsis: "이것은 테스트용 샘플 웹툰입니다. 로맨스 장르의 흥미진진한 스토리를 담고 있습니다.",
        pitch: "글로벌 시장을 타겟으로 한 K-로맨스 웹툰",
        rating: 4.5,
        rating_count: 150,
        views: 10000,
        likes: 500,
        tags: ["romance", "comedy", "school"],
        creator_id: "sample-creator-123"
      };

      const { data, error } = await supabase
        .from('titles')
        .insert(sampleTitle)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setConnectionStatus('Sample title created successfully!');
      return data;
    } catch (err) {
      console.error('Error creating sample title:', err);
      setConnectionStatus(`Error creating sample: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return null;
    }
  };

  const fetchTitles = async () => {
    try {
      setLoading(true);
      setConnectionStatus('Testing connection...');
      
      // First check if we can connect
      const { data, error } = await supabase
        .from('titles')
        .select('*')
        .limit(10);

      if (error) {
        throw error;
      }

      setConnectionStatus('Connection successful!');
      setTitles(data || []);

      // If no titles exist, create a sample one
      if (data?.length === 0) {
        setConnectionStatus('No titles found. Creating sample title...');
        const sampleTitle = await createSampleTitle();
        if (sampleTitle) {
          setTitles([sampleTitle]);
        }
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setConnectionStatus('Connection failed!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTitles();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Testing Supabase Connection with Sample Data</h1>
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
          <p>Loading titles...</p>
          {connectionStatus && <p className="mt-1">{connectionStatus}</p>}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Testing Supabase Connection with Sample Data</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
        </div>
        <div className="mt-4">
          <button 
            onClick={fetchTitles}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Testing Supabase Connection with Sample Data</h1>
      
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
        <strong>Success!</strong> Connected to Supabase and fetched {titles.length} titles.
        {connectionStatus && <p className="mt-1">{connectionStatus}</p>}
      </div>
      
      <div className="mb-4 flex gap-2">
        <button 
          onClick={fetchTitles}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Refresh Data
        </button>
        <button 
          onClick={createSampleTitle}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Create Another Sample
        </button>
      </div>
      
      <h2 className="text-xl font-semibold mb-4">Titles from Database:</h2>
      
      {titles.length === 0 ? (
        <p className="text-gray-600">No titles found in the database.</p>
      ) : (
        <div className="grid gap-4">
          {titles.map((title) => (
            <div key={title.title_id} className="border p-4 rounded-lg shadow-sm bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-bold text-lg mb-2 text-purple-800">
                    {title.title_name_kr}
                    {title.title_name_en && (
                      <span className="text-gray-600 font-normal"> ({title.title_name_en})</span>
                    )}
                  </h3>
                  
                  <div className="space-y-1 text-sm">
                    <p><strong>Format:</strong> 
                      <span className="capitalize bg-purple-100 text-purple-800 px-2 py-1 rounded ml-1">
                        {title.content_format || 'N/A'}
                      </span>
                    </p>
                    <p><strong>Genre:</strong> 
                      <span className="capitalize bg-pink-100 text-pink-800 px-2 py-1 rounded ml-1">
                        {title.genre || 'N/A'}
                      </span>
                    </p>
                    <p><strong>Author:</strong> {title.author || 'N/A'}</p>
                    <p><strong>Writer:</strong> {title.writer || 'N/A'}</p>
                    <p><strong>Illustrator:</strong> {title.illustrator || 'N/A'}</p>
                  </div>
                </div>
                
                <div>
                  <div className="space-y-1 text-sm">
                    <p><strong>Rating:</strong> 
                      {title.rating ? (
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded ml-1">
                          ⭐ {title.rating}/5
                        </span>
                      ) : 'N/A'} 
                      {title.rating_count && ` (${title.rating_count} reviews)`}
                    </p>
                    <p><strong>Views:</strong> 
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded ml-1">
                        👁️ {title.views?.toLocaleString() || 0}
                      </span>
                    </p>
                    <p><strong>Likes:</strong> 
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded ml-1">
                        ❤️ {title.likes?.toLocaleString() || 0}
                      </span>
                    </p>
                    <p><strong>Created:</strong> {new Date(title.created_at).toLocaleDateString()}</p>
                  </div>
                  
                  {title.tags && title.tags.length > 0 && (
                    <div className="mt-2">
                      <strong className="text-sm">Tags:</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {title.tags.map((tag, index) => (
                          <span key={index} className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded">
                            #{tag}
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
                  <p className="text-sm text-gray-700 mt-1 bg-gray-50 p-2 rounded">{title.synopsis}</p>
                </div>
              )}
              
              {title.pitch && (
                <div className="mt-2">
                  <strong className="text-sm">Pitch:</strong>
                  <p className="text-sm text-gray-700 mt-1 bg-orange-50 p-2 rounded border-l-4 border-orange-300">{title.pitch}</p>
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
              
              <div className="mt-2 text-xs text-gray-500">
                ID: {title.title_id} | Creator: {title.creator_id}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TestTitlesWithSample;