/**
 * Modern Professional Buyer Dashboard
 * Redesigned with new design system components
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  Eye, 
  Heart, 
  Star, 
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  BookOpen,
  Video,
  FileText
} from 'lucide-react';

// New Design System Imports
import {
  DashboardContainer,
  DashboardPageHeader,
  DashboardGrid,
  DashboardSection,
  DashboardTabs,
  DashboardSearch,
  DashboardFilterBar,
  StatCard,
  DashboardCard,
  CardHeader,
  QuickActionCard,
  TableCard,
  EmptyStateCard,
} from '@/design-system';

// Existing Services
import { titlesService, type Title } from '@/services/titlesService';
import { useToast } from '@/components/ui/use-toast';
import { enhancedSearch, getTitleSearchFields } from '@/utils/searchUtils';
import { useDataCache } from '@/contexts/DataCacheContext';
import { Button } from '@/components/ui/button';

// Mock enhanced data for demonstration
const mockBuyerStats = {
  totalViews: 125400,
  favoritesTitles: 24,
  activeRequests: 8,
  monthlyGrowth: '+12%',
};

const mockRecentActivity = [
  { id: 1, title: 'Mystic Academy Chronicles', action: 'favorited', time: '2 hours ago' },
  { id: 2, title: 'Corporate Love Simulator', action: 'viewed', time: '5 hours ago' },
  { id: 3, title: 'Digital Phantom Detective', action: 'requested', time: '1 day ago' },
];

const filterOptions = [
  { id: 'all', label: 'All Titles', count: 156 },
  { id: 'webtoon', label: 'Webtoons', count: 89 },
  { id: 'webnovel', label: 'Web Novels', count: 42 },
  { id: 'video', label: 'Video Content', count: 25 },
];

const tabOptions = [
  { id: 'discover', label: 'Discover', count: 156 },
  { id: 'favorites', label: 'My Favorites', count: 24 },
  { id: 'requests', label: 'My Requests', count: 8 },
  { id: 'trending', label: 'Trending', count: 45 },
];

export default function BuyerDashboardNew() {
  const { toast } = useToast();
  const { getTitles, setTitles, isFresh, refreshData } = useDataCache();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('discover');
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  const titles = getTitles();

  useEffect(() => {
    if (titles.length === 0 || !isFresh('titles')) {
      loadTitles();
    }
  }, [titles.length, isFresh]);

  const loadTitles = async () => {
    try {
      setLoading(true);
      const data = await titlesService.getAllTitles();
      setTitles(data);
    } catch (error) {
      console.error('Error loading titles:', error);
      toast({ title: 'Error loading titles', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleFilterChange = (filterId: string) => {
    setActiveFilter(filterId);
  };

  // Filter titles based on search and active filters
  const filteredTitles = React.useMemo(() => {
    let filtered = titles;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const { exactMatches, expandedMatches } = enhancedSearch(
        titles,
        searchQuery,
        getTitleSearchFields()
      );
      filtered = [...exactMatches, ...expandedMatches];
    }
    
    // Apply content type filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(title => {
        const format = title.content_format?.toLowerCase();
        return format?.includes(activeFilter);
      });
    }
    
    return filtered;
  }, [titles, searchQuery, activeFilter]);

  const quickActions = [
    {
      title: 'Browse New Titles',
      description: 'Discover the latest Korean content',
      icon: BookOpen,
      onClick: () => setActiveTab('discover'),
    },
    {
      title: 'Request Content',
      description: 'Submit a new content request',
      icon: Plus,
      onClick: () => console.log('Navigate to request form'),
    },
    {
      title: 'View Analytics',
      description: 'Track your viewing patterns',
      icon: TrendingUp,
      onClick: () => console.log('Navigate to analytics'),
    },
  ];

  return (
    <DashboardContainer>
      {/* Page Header */}
      <DashboardPageHeader
        title="Welcome back!"
        subtitle="Discover amazing Korean content and track your favorites"
        action={
          <Button className="bg-primary-600 hover:bg-primary-700">
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        }
      />

      {/* Stats Overview */}
      <DashboardSection>
        <DashboardGrid cols={4} gap="lg">
          <StatCard
            title="Total Views"
            value={mockBuyerStats.totalViews.toLocaleString()}
            subtitle="This month"
            trend={{ value: mockBuyerStats.monthlyGrowth, isPositive: true }}
            icon={Eye}
          />
          <StatCard
            title="Favorites"
            value={mockBuyerStats.favoritesTitles}
            subtitle="Saved titles"
            icon={Heart}
          />
          <StatCard
            title="Active Requests"
            value={mockBuyerStats.activeRequests}
            subtitle="In progress"
            icon={FileText}
          />
          <StatCard
            title="Monthly Growth"
            value={mockBuyerStats.monthlyGrowth}
            subtitle="Views increase"
            trend={{ value: mockBuyerStats.monthlyGrowth, isPositive: true }}
            icon={TrendingUp}
          />
        </DashboardGrid>
      </DashboardSection>

      {/* Quick Actions */}
      <DashboardSection
        title="Quick Actions"
        description="Get started with these common tasks"
      >
        <DashboardGrid cols={3} gap="lg">
          {quickActions.map((action) => (
            <QuickActionCard
              key={action.title}
              title={action.title}
              description={action.description}
              icon={action.icon}
              onClick={action.onClick}
            />
          ))}
        </DashboardGrid>
      </DashboardSection>

      {/* Content Browse Section */}
      <DashboardSection
        title="Browse Content"
        description="Discover and manage Korean titles"
        action={
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Advanced Filters
          </Button>
        }
      >
        {/* Search Bar */}
        <DashboardSearch
          placeholder="Search titles, creators, genres..."
          value={searchQuery}
          onChange={handleSearch}
        />

        {/* Tabs */}
        <DashboardTabs
          tabs={tabOptions}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

        {/* Filters */}
        <DashboardFilterBar
          filters={filterOptions}
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
        />

        {/* Content Grid */}
        {loading ? (
          <DashboardGrid cols={4} gap="lg">
            {[...Array(8)].map((_, i) => (
              <DashboardCard key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-gray-200 rounded-lg mb-4" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                </div>
              </DashboardCard>
            ))}
          </DashboardGrid>
        ) : filteredTitles.length > 0 ? (
          <DashboardGrid cols={4} gap="lg">
            {filteredTitles.slice(0, 12).map((title) => (
              <Link key={title.title_id} to={`/titles/${title.title_id}`}>
                <DashboardCard hover className="h-full">
                  {/* Title Image */}
                  <div className="aspect-[3/4] bg-gradient-to-br from-primary-50 to-secondary-50 rounded-lg mb-4 overflow-hidden">
                    {title.title_image ? (
                      <img 
                        src={title.title_image} 
                        alt={title.title_name_en || title.title_name_kr}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-16 h-16 bg-primary-200 rounded-xl flex items-center justify-center">
                          <BookOpen className="h-8 w-8 text-primary-600" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Title Info */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-900 line-clamp-2">
                      {title.title_name_en || title.title_name_kr}
                    </h3>
                    
                    {title.genre && (
                      <span className="inline-block px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
                        {Array.isArray(title.genre) ? title.genre[0] : title.genre}
                      </span>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center">
                          <Eye className="h-3 w-3 mr-1" />
                          {title.views || 0}
                        </span>
                        <span className="flex items-center">
                          <Heart className="h-3 w-3 mr-1" />
                          {title.likes || 0}
                        </span>
                      </div>
                      <span className="flex items-center">
                        <Star className="h-3 w-3 mr-1 text-yellow-500" />
                        {title.rating || 'N/A'}
                      </span>
                    </div>
                  </div>
                </DashboardCard>
              </Link>
            ))}
          </DashboardGrid>
        ) : (
          <EmptyStateCard
            title="No titles found"
            description="Try adjusting your search terms or filters to find what you're looking for."
            icon={Search}
            action={{
              label: 'Clear Filters',
              onClick: () => {
                setSearchQuery('');
                setActiveFilter('all');
              }
            }}
          />
        )}
      </DashboardSection>

      {/* Recent Activity */}
      <DashboardSection
        title="Recent Activity"
        description="Your latest actions and updates"
      >
        <DashboardGrid cols={2} gap="lg">
          <TableCard
            title="Recent Activity"
            headers={['Title', 'Action', 'Time']}
            data={mockRecentActivity.map(item => ({
              title: item.title,
              action: item.action,
              time: item.time,
            }))}
            onRowClick={(row) => console.log('Navigate to:', row)}
          />
          
          <DashboardCard>
            <CardHeader
              title="Trending This Week"
              subtitle="Popular titles among buyers"
              icon={TrendingUp}
            />
            <div className="space-y-3">
              {filteredTitles.slice(0, 5).map((title, index) => (
                <div key={title.title_id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                  <span className="flex items-center justify-center w-6 h-6 bg-primary-100 text-primary-600 rounded-full text-xs font-medium">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {title.title_name_en || title.title_name_kr}
                    </p>
                    <p className="text-xs text-gray-500">
                      {title.views || 0} views
                    </p>
                  </div>
                  <Star className="h-4 w-4 text-yellow-500" />
                </div>
              ))}
            </div>
          </DashboardCard>
        </DashboardGrid>
      </DashboardSection>
    </DashboardContainer>
  );
}