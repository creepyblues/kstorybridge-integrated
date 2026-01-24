import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, Button } from "@kstorybridge/ui";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowLeft,
  Bot,
  Brain,
  MessageSquare,
  BarChart3,
  Search,
  Zap,
  ExternalLink,
  List
} from 'lucide-react';

export default function Experiment() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Admin check
  const isAdmin = user?.email === 'sungho@kstorybridge.com' || user?.email === 'kevin@sandstoneartists.com';

  if (!isAdmin) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-6">This page is only accessible to administrators.</p>
            <Button onClick={() => navigate("/buyers/profile")} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const experimentalTools = [
    {
      id: 'admin-panel',
      title: 'Admin Panel',
      description: 'Full admin dashboard for managing titles, users, and featured content',
      icon: <LayoutDashboard className="w-6 h-6" />,
      path: '/admin',
      color: 'from-red-500 to-pink-500',
      status: 'Admin'
    },
    {
      id: 'title-list',
      title: 'Original Titles View',
      description: 'Legacy titles page with table-only layout (for comparison)',
      icon: <List className="w-6 h-6" />,
      path: '/buyers/title-list',
      color: 'from-indigo-500 to-blue-500',
      status: 'Legacy'
    },
    {
      id: 'chat',
      title: 'Chat',
      description: 'Advanced AI-powered chatbot with vector search capabilities',
      icon: <Brain className="w-6 h-6" />,
      path: '/chat',
      color: 'from-purple-500 to-blue-500',
      status: 'Active'
    },
    {
      id: 'chatbot-feedback',
      title: 'Chatbot Feedback Analysis',
      description: 'Analytics dashboard for user feedback on chatbot performance',
      icon: <BarChart3 className="w-6 h-6" />,
      path: '/chatbot-feedback',
      color: 'from-orange-500 to-red-500',
      status: 'Analytics'
    },
    {
      id: 'chat-history',
      title: 'Chat History',
      description: 'View and analyze conversation history across all chatbots',
      icon: <MessageSquare className="w-6 h-6" />,
      path: '/chat-history',
      color: 'from-indigo-500 to-purple-500',
      status: 'Tools'
    },
    {
      id: 'vector-search-manager',
      title: 'Vector Search Manager',
      description: 'Manage and configure vector search embeddings',
      icon: <Search className="w-6 h-6" />,
      path: '/vector-search-manager',
      color: 'from-cyan-500 to-blue-500',
      status: 'System'
    },
    {
      id: 'openai-testing',
      title: 'OpenAI Environment Testing',
      description: 'Compare OpenAI responses across direct client, local backend, and production environments',
      icon: <Zap className="w-6 h-6" />,
      path: '/openai-chatbot-testing',
      color: 'from-cyan-500 to-teal-500',
      status: 'Tools'
    }
  ];

  const handleToolClick = (path: string) => {
    navigate(path);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => navigate("/buyers/profile")}
                  variant="outline"
                  size="sm"
                  className="border-slate-700 text-slate-300 hover:text-white hover:border-slate-600"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Profile
                </Button>
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Zap className="w-6 h-6 text-purple-400" />
                    Experimental Tools
                  </h2>
                  <p className="text-sm text-slate-400">
                    Advanced AI and analytics tools for administrators
                  </p>
                </div>
              </div>
              <div className="text-xs text-slate-500">
                Admin Access: {user?.email}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Introduction Card */}
            <Card className="bg-slate-800/50 border-slate-700 mb-8">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-400" />
                  Experimental Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 mb-4">
                  This page provides access to experimental AI tools, analytics dashboards, and system management utilities. 
                  These tools are designed for testing new features, analyzing performance, and managing the AI infrastructure.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-slate-700/50 p-3 rounded-lg">
                    <div className="font-medium text-purple-400 mb-1">AI Chatbots</div>
                    <div className="text-slate-400">Test and compare different AI implementations</div>
                  </div>
                  <div className="bg-slate-700/50 p-3 rounded-lg">
                    <div className="font-medium text-blue-400 mb-1">Analytics</div>
                    <div className="text-slate-400">Monitor performance and user feedback</div>
                  </div>
                  <div className="bg-slate-700/50 p-3 rounded-lg">
                    <div className="font-medium text-green-400 mb-1">System Tools</div>
                    <div className="text-slate-400">Manage vector search and configurations</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tools Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {experimentalTools.map((tool) => (
                <Card 
                  key={tool.id} 
                  className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all duration-300 cursor-pointer group"
                  onClick={() => handleToolClick(tool.path)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className={`p-3 rounded-lg bg-gradient-to-r ${tool.color} text-white`}>
                        {tool.icon}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          tool.status === 'Admin' ? 'bg-red-900/50 text-red-400 border border-red-800' :
                          tool.status === 'New' ? 'bg-cyan-900/50 text-cyan-400 border border-cyan-800' :
                          tool.status === 'Active' ? 'bg-green-900/50 text-green-400 border border-green-800' :
                          tool.status === 'Legacy' ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-800' :
                          tool.status === 'Analytics' ? 'bg-orange-900/50 text-orange-400 border border-orange-800' :
                          tool.status === 'Tools' ? 'bg-purple-900/50 text-purple-400 border border-purple-800' :
                          'bg-blue-900/50 text-blue-400 border border-blue-800'
                        }`}>
                          {tool.status}
                        </span>
                        <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h3 className="font-semibold text-white mb-2 group-hover:text-purple-400 transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      {tool.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* AI IP Discovery Section */}
            <Card className="bg-slate-800/50 border-slate-700 mt-8">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Brain className="w-5 h-5 text-emerald-400" />
                  AI IP Discovery
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 mb-6">
                  Access AI-powered Korean IP discovery tools and view your conversation history and analytics.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link to="/buyers/chat" className="block">
                    <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg rounded-2xl px-6 py-3 transition-all duration-300 group relative overflow-hidden">
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700 pointer-events-none"></div>

                      {/* Text */}
                      <span className="relative z-10">🧠 OPENAI CHAT</span>

                      {/* Glow effect */}
                      <div className="absolute inset-0 rounded-2xl bg-emerald-500/50 blur-md group-hover:bg-emerald-500/60 transition-colors duration-300 pointer-events-none"></div>
                    </Button>
                  </Link>

                  <Link to="/chat-history" className="block">
                    <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg rounded-2xl px-6 py-3 transition-all duration-300 group relative overflow-hidden">
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700 pointer-events-none"></div>

                      {/* Text */}
                      <span className="relative z-10">📊 CHAT HISTORY</span>

                      {/* Glow effect */}
                      <div className="absolute inset-0 rounded-2xl bg-indigo-500/50 blur-md group-hover:bg-indigo-500/60 transition-colors duration-300 pointer-events-none"></div>
                    </Button>
                  </Link>

                  <Link to="/vector-search-manager" className="block">
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg rounded-2xl px-6 py-3 transition-all duration-300 group relative overflow-hidden">
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700 pointer-events-none"></div>

                      {/* Text */}
                      <span className="relative z-10">🔍 VECTOR SEARCH</span>

                      {/* Glow effect */}
                      <div className="absolute inset-0 rounded-2xl bg-purple-500/50 blur-md group-hover:bg-purple-500/60 transition-colors duration-300 pointer-events-none"></div>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Footer Info */}
            <div className="mt-12 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg">
                <Zap className="w-4 h-4 text-purple-400" />
                <span className="text-slate-400 text-sm">
                  Experimental tools are subject to change and may have limited availability
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}