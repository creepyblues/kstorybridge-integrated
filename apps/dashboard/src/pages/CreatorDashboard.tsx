
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Eye, 
  Plus,
  TrendingUp,
  Users,
  BarChart3,
  PlusCircle,
  BookOpen
} from "lucide-react";
import { CreatorTitleCard } from "@/components/dashboard/CreatorTitleCard";

// Mock data for creator titles
const mockCreatorTitles = [
  {
    id: "1",
    title_name_en: "The Last Kingdom Chronicles",
    title_name_kr: "마지막 왕국 연대기",
    genre: "Fantasy",
    author: "John Creator",
    status: "published",
    title_image: "/covers/last-kingdom.jpg",
    views: 2100,
    likes: 156,
    inquiries: 5,
    content_format: "Webtoon",
    created_at: "2024-01-15"
  },
  {
    id: "2",
    title_name_en: "Urban Legends Collection",
    title_name_kr: "도시 전설 모음집",
    genre: "Mystery",
    author: "John Creator",
    status: "draft",
    title_image: "/covers/urban-legends.jpg",
    views: 0,
    likes: 0,
    inquiries: 0,
    content_format: "Webnovel",
    created_at: "2024-02-10"
  },
  {
    id: "3",
    title_name_en: "Digital Hearts",
    title_name_kr: "디지털 하트",
    genre: "Romance",
    author: "John Creator",
    status: "published",
    title_image: "/covers/digital-hearts.jpg",
    views: 1800,
    likes: 203,
    inquiries: 12,
    content_format: "Video",
    created_at: "2024-01-30"
  },
  {
    id: "4",
    title_name_en: "Neon Samurai",
    title_name_kr: "네온 사무라이",
    genre: "Action",
    author: "John Creator",
    status: "under_review",
    title_image: "/covers/neon-samurai.jpg",
    views: 450,
    likes: 67,
    inquiries: 2,
    content_format: "Webtoon",
    created_at: "2024-02-20"
  }
];

export default function CreatorDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [titles, setTitles] = useState(mockCreatorTitles);

  const handleEditTitle = (titleId: string) => {
    console.log('Edit title:', titleId);
    // Navigate to edit page
  };

  const handleViewAnalytics = (titleId: string) => {
    console.log('View analytics for:', titleId);
    // Navigate to analytics page
  };

  const handleViewInquiries = (titleId: string) => {
    console.log('View inquiries for:', titleId);
    // Navigate to inquiries page
  };

  const handleCreateNew = () => {
    console.log('Create new title');
    // Navigate to creation form
  };

  // Calculate stats
  const totalViews = titles.reduce((sum, title) => sum + (title.views || 0), 0);
  const totalLikes = titles.reduce((sum, title) => sum + (title.likes || 0), 0);
  const totalInquiries = titles.reduce((sum, title) => sum + (title.inquiries || 0), 0);
  const publishedTitles = titles.filter(title => title.status === 'published').length;

  return (
    <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-4xl font-bold text-gray-800">Your Creative Studio</h1>
          <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
          <Card className="bg-gradient-to-br from-hanok-teal-50 to-hanok-teal-100 border-hanok-teal-200">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-hanok-teal rounded-lg">
                <BookOpen className="h-6 w-6 text-snow-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-midnight-ink">{titles.length}</p>
                <p className="text-sm text-midnight-ink-600">Total Titles</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-porcelain-blue-50 to-porcelain-blue-100 border-porcelain-blue-200">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-porcelain-blue-600 rounded-lg">
                <Eye className="h-6 w-6 text-snow-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-midnight-ink">{totalViews.toLocaleString()}</p>
                <p className="text-sm text-midnight-ink-600">Total Views</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-sunrise-coral-50 to-sunrise-coral-100 border-sunrise-coral-200">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-sunrise-coral rounded-lg">
                <Users className="h-6 w-6 text-snow-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-midnight-ink">{totalInquiries}</p>
                <p className="text-sm text-midnight-ink-600">Buyer Inquiries</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-warm-sand-50 to-warm-sand-100 border-warm-sand-300">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-warm-sand-600 rounded-lg">
                <TrendingUp className="h-6 w-6 text-snow-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-midnight-ink">{publishedTitles}</p>
                <p className="text-sm text-midnight-ink-600">Published</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-6 mb-16">
          {[
            { value: "overview", label: "Overview", icon: BarChart3 },
            { value: "titles", label: `My Titles (${titles.length})`, icon: FileText },
            { value: "analytics", label: "Analytics", icon: TrendingUp }
          ].map((tab) => (
            <Button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-8 py-3 rounded-2xl text-base font-medium flex items-center gap-2 ${
                activeTab === tab.value
                  ? "bg-hanok-teal text-white shadow-lg"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </Button>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-12 mt-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              <Card className="bg-snow-white border-porcelain-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-midnight-ink">
                    <TrendingUp className="h-5 w-5 text-hanok-teal" />
                    Performance Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-porcelain-blue-50">
                      <p className="text-2xl font-bold text-hanok-teal">{totalViews.toLocaleString()}</p>
                      <p className="text-sm text-midnight-ink-600">Total Views</p>
                    </div>
                    <div className="p-3 rounded-lg bg-sunrise-coral-50">
                      <p className="text-2xl font-bold text-sunrise-coral">{totalLikes.toLocaleString()}</p>
                      <p className="text-sm text-midnight-ink-600">Total Likes</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-r from-hanok-teal-50 to-porcelain-blue-50 border border-hanok-teal-200">
                    <p className="text-lg font-semibold text-midnight-ink">{totalInquiries} Buyer Inquiries</p>
                    <p className="text-sm text-midnight-ink-600">Potential partnership opportunities</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-snow-white border-porcelain-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-midnight-ink">
                    <PlusCircle className="h-5 w-5 text-sunrise-coral" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <Button 
                    onClick={handleCreateNew}
                    className="w-full justify-start bg-sunrise-coral hover:bg-sunrise-coral-600 text-snow-white"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Title
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start border-hanok-teal text-hanok-teal hover:bg-hanok-teal hover:text-snow-white"
                    onClick={() => setActiveTab('titles')}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Manage Titles
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start border-porcelain-blue-400 text-midnight-ink-700 hover:bg-porcelain-blue-100"
                    onClick={() => setActiveTab('analytics')}
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View Analytics
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Titles Tab */}
          <TabsContent value="titles" className="space-y-12 mt-16">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-2xl font-bold text-midnight-ink">Your Titles</h2>
              <Button 
                onClick={handleCreateNew}
                className="bg-sunrise-coral hover:bg-sunrise-coral-600 text-snow-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Title
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {titles.map((title) => (
                <CreatorTitleCard
                  key={title.id}
                  title={title}
                  onEdit={handleEditTitle}
                  onViewAnalytics={handleViewAnalytics}
                  onViewInquiries={handleViewInquiries}
                />
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-12 mt-16">
            <div className="text-center py-24">
              <BarChart3 className="h-16 w-16 text-hanok-teal mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-midnight-ink-600 mb-2">Analytics Dashboard</h3>
              <p className="text-midnight-ink-500">Detailed analytics and insights coming soon!</p>
            </div>
          </TabsContent>
        </Tabs>
    </div>
  );
}
