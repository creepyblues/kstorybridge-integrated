import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, TrendingUp, Database, ArrowRight } from 'lucide-react';
import { getIntelligenceRecords, type IntelligenceRecord } from '@/services/intelligenceService';

/**
 * Admin Tools Dashboard
 * Landing page showing available admin tools and recent intelligence collections
 */
export function ToolsIndex() {
  const [recentCollections, setRecentCollections] = useState<IntelligenceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentCollections();
  }, []);

  const loadRecentCollections = async () => {
    try {
      const records = await getIntelligenceRecords();
      setRecentCollections(records.slice(0, 5)); // Show 5 most recent
    } catch (error) {
      console.error('Failed to load recent collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'partial_failure':
        return 'bg-amber-500';
      case 'failed':
        return 'bg-red-500';
      case 'in_progress':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const tools = [
    {
      title: 'Title Investigator',
      description: 'Collect popularity signals and metadata from Reddit, AO3, Naver, and Kakao. Field-level verification before data ingestion.',
      href: '/tools/title-investigator',
      icon: TrendingUp,
      status: 'active',
      features: [
        'One-title-at-a-time processing',
        'Multi-source data collection',
        'Field-level verification workflow',
        'Raw data retained permanently'
      ]
    },
    {
      title: 'Bulk Intelligence (Coming Soon)',
      description: 'Process multiple titles overnight with scheduled batch runs and priority queues.',
      href: '#',
      icon: Database,
      status: 'coming_soon'
    }
  ];

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-6 w-6 text-black" />
            <h1 className="text-2xl sm:text-3xl font-bold text-black">Admin Tools</h1>
          </div>
          <p className="text-gray-600">
            Advanced data collection and management tools for administrators
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isActive = tool.status === 'active';

            return (
              <Card
                key={tool.title}
                className="bg-transparent border-gray-300 shadow-none rounded-2xl hover:border-gray-400 transition-colors"
              >
                <CardContent className="p-6">
                  {isActive ? (
                    <Link to={tool.href} className="block">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 p-3 bg-black rounded-lg">
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-black mb-2">
                            {tool.title}
                          </h3>
                          <p className="text-gray-600 text-sm mb-4">
                            {tool.description}
                          </p>

                          {tool.features && (
                            <ul className="space-y-2">
                              {tool.features.map((feature) => (
                                <li
                                  key={feature}
                                  className="flex items-center gap-2 text-sm text-gray-700"
                                >
                                  <span className="h-1.5 w-1.5 bg-black rounded-full" />
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <div className="flex items-start gap-4 opacity-60">
                      <div className="flex-shrink-0 p-3 bg-gray-200 rounded-lg">
                        <Icon className="h-6 w-6 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-700 mb-2">
                          {tool.title}
                        </h3>
                        <p className="text-gray-500 text-sm">
                          {tool.description}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Intelligence Collections */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-black">Recent Intelligence Collections</h2>
            <Link
              to="/tools/title-investigator"
              className="text-sm text-black hover:text-gray-700 flex items-center gap-1"
            >
              New Collection
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
              <CardContent className="p-6 text-center text-gray-500">
                Loading recent collections...
              </CardContent>
            </Card>
          ) : recentCollections.length === 0 ? (
            <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
              <CardContent className="p-6 text-center">
                <p className="text-gray-500 mb-4">No intelligence collections yet</p>
                <Link
                  to="/tools/title-investigator"
                  className="text-sm text-black hover:text-gray-700 underline"
                >
                  Create your first collection
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentCollections.map((record) => (
                <Link
                  key={record.id}
                  to={`/tools/intelligence/${record.id}`}
                  className="block"
                >
                  <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl hover:border-gray-400 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-black truncate">
                            {record.title_name_input}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                            <span>
                              {new Date(record.created_at).toLocaleDateString()}
                            </span>
                            <span>•</span>
                            <span>
                              {record.sources_requested.length} source{record.sources_requested.length !== 1 ? 's' : ''}
                            </span>
                            {record.ingested && (
                              <>
                                <span>•</span>
                                <span className="text-green-600 font-medium">Ingested</span>
                              </>
                            )}
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(record.collection_status)} text-white ml-4`}>
                          {record.collection_status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
