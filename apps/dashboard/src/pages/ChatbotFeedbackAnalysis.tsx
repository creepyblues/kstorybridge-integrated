import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from "@kstorybridge/ui";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { chatHistoryService } from '@/services/chatHistoryService';
import { getProfilePath } from '@/utils/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Download, ArrowLeft, RefreshCw, Filter, Search, Star, MessageSquare, TrendingUp, AlertTriangle } from 'lucide-react';

interface FeedbackAnalysisProps {}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE'];

const ChatbotFeedbackAnalysis: React.FC<FeedbackAnalysisProps> = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [allFeedback, setAllFeedback] = useState<any[]>([]);
  const [filteredFeedback, setFilteredFeedback] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<string | null>(null);

  // Authorization check - restrict to admin users
  const isAuthorized = user?.email === 'sungho@dadble.com' || user?.email === 'kevin@sandstoneartists.com';

  useEffect(() => {
    if (!isAuthorized) {
      const accountType = user?.user_metadata?.account_type || 'buyer';
      navigate(getProfilePath(accountType));
      return;
    }
    
    loadData();
  }, [isAuthorized]);

  useEffect(() => {
    // Apply filters
    let filtered = allFeedback;
    
    if (searchTerm) {
      filtered = filtered.filter(f => 
        f.general_feedback?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.suggested_improvements?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.chat_messages?.content?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedRating) {
      filtered = filtered.filter(f => f.overall_rating === selectedRating);
    }
    
    if (selectedQuality) {
      filtered = filtered.filter(f => f.response_quality === selectedQuality);
    }
    
    setFilteredFeedback(filtered);
  }, [allFeedback, searchTerm, selectedRating, selectedQuality]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [analyticsData, feedbackData] = await Promise.all([
        chatHistoryService.getFeedbackAnalytics(),
        chatHistoryService.getAllFeedback(200)
      ]);
      
      setAnalytics(analyticsData);
      setAllFeedback(feedbackData);
      setFilteredFeedback(feedbackData);
    } catch (error) {
      console.error('Error loading feedback data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = () => {
    const csvContent = [
      ['Date', 'Rating', 'Response Quality', 'Title Relevance', 'General Feedback', 'Improvements', 'User Message'].join(','),
      ...filteredFeedback.map(f => [
        new Date(f.created_at).toLocaleDateString(),
        f.overall_rating,
        f.response_quality,
        f.title_relevance,
        `"${f.general_feedback || ''}"`,
        `"${f.suggested_improvements || ''}"`,
        `"${f.chat_messages?.content?.substring(0, 100) || ''}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chatbot-feedback-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getPriorityIssues = () => {
    const poorRatingFeedback = allFeedback.filter(f => f.overall_rating <= 2);
    const commonComplaints = {};
    
    poorRatingFeedback.forEach(f => {
      const feedback = f.general_feedback?.toLowerCase() || '';
      const improvements = f.suggested_improvements?.toLowerCase() || '';
      const combined = feedback + ' ' + improvements;
      
      // Simple keyword extraction for common issues
      ['irrelevant', 'wrong', 'bad', 'poor', 'not helpful', 'inaccurate', 'slow'].forEach(keyword => {
        if (combined.includes(keyword)) {
          commonComplaints[keyword] = (commonComplaints[keyword] || 0) + 1;
        }
      });
    });
    
    return Object.entries(commonComplaints)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5);
  };

  if (!isAuthorized) {
    return <div>Access Denied</div>;
  }

  if (isLoading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Loading feedback analytics...</span>
        </div>
      </div>
    );
  }

  const qualityData = analytics?.qualityBreakdown ? Object.entries(analytics.qualityBreakdown).map(([key, value]) => ({
    name: key,
    value: Number(value) || 0
  })) : [];

  const relevanceData = analytics?.relevanceBreakdown ? Object.entries(analytics.relevanceBreakdown).map(([key, value]) => ({
    name: key,
    value: Number(value) || 0
  })) : [];

  const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
    rating: `${rating} Star${rating !== 1 ? 's' : ''}`,
    count: allFeedback.filter(f => f.overall_rating === rating).length
  }));

  const priorityIssues = getPriorityIssues();

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => {
                  const accountType = user?.user_metadata?.account_type || 'buyer';
                  navigate(getProfilePath(accountType));
                }}
                variant="outline"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Profile
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Chatbot Feedback Analysis</h1>
                <p className="text-sm text-gray-600">Review and analyze user feedback to improve chatbot performance</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={loadData} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={exportData} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Feedback</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics?.totalFeedbacks || 0}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Rating</p>
                  <div className="flex items-center gap-1">
                    <p className="text-3xl font-bold text-gray-900">{analytics?.averageRating || 0}</p>
                    <Star className="w-6 h-6 text-yellow-500" />
                  </div>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Poor Ratings</p>
                  <p className="text-3xl font-bold text-red-600">
                    {allFeedback.filter(f => f.overall_rating <= 2).length}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Response Rate</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {analytics?.totalFeedbacks ? Math.round((analytics.totalFeedbacks / allFeedback.length) * 100) : 0}%
                  </p>
                </div>
                <MessageSquare className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Rating Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Rating Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={ratingDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="rating" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Response Quality */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Response Quality</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={qualityData}
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {qualityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Title Relevance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Title Relevance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={relevanceData}
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    fill="#82ca9d"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {relevanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Priority Issues */}
        {priorityIssues.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Priority Issues to Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {priorityIssues.map(([issue, count]) => (
                  <div key={issue} className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
                    <span className="font-medium capitalize">{issue}</span>
                    <span className="bg-red-600 text-white px-2 py-1 rounded text-sm">{count} mentions</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters and Feedback List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detailed Feedback</CardTitle>
            <div className="flex gap-4 items-center flex-wrap">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search feedback..."
                  className="pl-10 pr-4 py-2 border rounded-md text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="px-3 py-2 border rounded-md text-sm"
                value={selectedRating || ''}
                onChange={(e) => setSelectedRating(e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="">All Ratings</option>
                <option value="1">1 Star</option>
                <option value="2">2 Stars</option>
                <option value="3">3 Stars</option>
                <option value="4">4 Stars</option>
                <option value="5">5 Stars</option>
              </select>
              <select
                className="px-3 py-2 border rounded-md text-sm"
                value={selectedQuality || ''}
                onChange={(e) => setSelectedQuality(e.target.value || null)}
              >
                <option value="">All Quality</option>
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedRating(null);
                  setSelectedQuality(null);
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredFeedback.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No feedback found matching your filters.</p>
              ) : (
                filteredFeedback.map((feedback) => (
                  <div key={feedback.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${star <= feedback.overall_rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">
                          {feedback.response_quality} response, {feedback.title_relevance} relevance
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(feedback.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {(feedback.chat_messages?.content || feedback.user_prompt) && (
                      <div className="mb-2">
                        <p className="text-sm font-medium text-gray-700">Original Query:</p>
                        <p className="text-sm text-gray-600 bg-white p-2 rounded border">
                          {(feedback.chat_messages?.content || feedback.user_prompt || '').substring(0, 200)}...
                        </p>
                      </div>
                    )}
                    
                    {/* Display title-specific feedback */}
                    {feedback.title_feedback && Array.isArray(feedback.title_feedback) && feedback.title_feedback.length > 0 && (
                      <div className="mb-2">
                        <p className="text-sm font-medium text-gray-700">Title Feedback:</p>
                        <div className="space-y-1">
                          {feedback.title_feedback.map((titleFeedback, idx) => (
                            <div key={idx} className="bg-blue-50 p-2 rounded text-xs">
                              <div className="flex justify-between items-center">
                                <span className="font-medium">{titleFeedback.title_name}</span>
                                <div className="flex gap-1">
                                  <span>Overall: {titleFeedback.overall_rating}/5</span>
                                  <span>Relevance: {titleFeedback.relevance_rating}/5</span>
                                </div>
                              </div>
                              {titleFeedback.feedback_reason && (
                                <p className="mt-1 text-gray-600">{titleFeedback.feedback_reason}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {feedback.general_feedback && (
                      <div className="mb-2">
                        <p className="text-sm font-medium text-gray-700">General Feedback:</p>
                        <p className="text-sm text-gray-600">{feedback.general_feedback}</p>
                      </div>
                    )}
                    
                    {feedback.suggested_improvements && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Suggested Improvements:</p>
                        <p className="text-sm text-gray-600">{feedback.suggested_improvements}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChatbotFeedbackAnalysis;