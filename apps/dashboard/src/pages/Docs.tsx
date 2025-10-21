import { useState } from "react";
import { Link } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@kstorybridge/ui";
import { StandardButton } from "@/components/StandardButton";
import { Badge } from "@kstorybridge/ui";
import {
  BookOpen,
  Database,
  Shield,
  Bot,
  FileText,
  Settings,
  Rocket,
  Code,
  Search,
  Filter,
  Target,
  Sparkles,
  Cpu,
  Layout,
  MessageSquare
} from "lucide-react";

interface DocumentItem {
  filename: string;
  title: string;
  description: string;
  category: 'core' | 'technical' | 'deployment' | 'analytics' | 'security' | 'development';
  icon: React.ComponentType<{ className?: string }>;
  lastUpdated?: string;
}

const documentCategories = [
  { id: 'core', label: 'Core Documentation', icon: BookOpen, color: 'bg-blue-100 text-blue-800' },
  { id: 'technical', label: 'Technical Architecture', icon: Code, color: 'bg-green-100 text-green-800' },
  { id: 'deployment', label: 'Deployment & Infrastructure', icon: Rocket, color: 'bg-purple-100 text-purple-800' },
  { id: 'analytics', label: 'Analytics & Tracking', icon: Settings, color: 'bg-orange-100 text-orange-800' },
  { id: 'security', label: 'Security & Authentication', icon: Shield, color: 'bg-red-100 text-red-800' },
  { id: 'development', label: 'Development Guides', icon: FileText, color: 'bg-gray-100 text-gray-800' },
];

const documents: DocumentItem[] = [
  {
    filename: 'PRODUCT_REQUIREMENTS_DOCUMENT.md',
    title: 'Product Requirements Document (PRD)',
    description: 'Complete guide to replicate the KStoryBridge Dashboard application with all technical specifications.',
    category: 'core',
    icon: BookOpen,
    lastUpdated: '2025-01-26'
  },
  {
    filename: 'PRD-2.1.md',
    title: 'PRD 2.1: User Engagement & Paid Conversion',
    description: 'Strategic improvements to onboarding, analytics tracking, email re-engagement, and conversion optimization.',
    category: 'core',
    icon: Rocket,
    lastUpdated: '2025-01-27'
  },
  {
    filename: 'PRD-2.1-Implementation-Plan.md',
    title: 'PRD 2.1 Implementation Plan',
    description: 'Detailed task tracking, sprint planning, and execution roadmap for PRD 2.1 features.',
    category: 'development',
    icon: FileText,
    lastUpdated: '2025-01-27'
  },
  {
    filename: 'PRD-2.1-Onboarding-Enhancement-Plan.md',
    title: 'PRD 2.1: Onboarding Enhancement Plan',
    description: 'Comprehensive plan for improving user onboarding based on B2B SaaS best practices research.',
    category: 'development',
    icon: Sparkles,
    lastUpdated: '2025-01-29'
  },
  {
    filename: 'BUYERS_PAGE_OVERHAUL.md',
    title: '/buyers Page Overhaul - Visual Strategy Guide',
    description: 'Complete visual redesign strategy with mermaid diagrams: AI-first messaging, clear rights chain, expert support showcase, and conversion optimization.',
    category: 'core',
    icon: Layout,
    lastUpdated: '2025-10-13'
  },
  {
    filename: 'AI_CHATBOT_DOCUMENTATION.md',
    title: 'AI Chatbot System Documentation',
    description: 'Architecture, data structures, search pipelines, and improvement areas for the AI chatbot system.',
    category: 'technical',
    icon: Bot,
    lastUpdated: '2025-01-26'
  },
  {
    filename: 'CHATBOT_IMPROVEMENT_GUIDE.md',
    title: 'AI Chatbot Quality Improvement Guide',
    description: 'Complete guide to chatbot improvements, current status (Phase 1 & 2 complete), and roadmap for quality enhancements.',
    category: 'technical',
    icon: Target,
    lastUpdated: '2025-10-05'
  },
  {
    filename: 'MODEL_CONFIGURATION_GUIDE.md',
    title: 'Model Configuration Guide',
    description: 'GPT model comparison, API parameter differences, and migration procedures for chatbot model switching.',
    category: 'technical',
    icon: Cpu,
    lastUpdated: '2025-10-13'
  },
  {
    filename: 'CHATBOT_SAMPLE_DIALOGUES.md',
    title: 'AI Chatbot Sample Dialogues',
    description: '10 scenarios showcasing how AI helps buyers discover and evaluate Korean content for adaptation.',
    category: 'technical',
    icon: MessageSquare,
    lastUpdated: '2025-10-14'
  },
  {
    filename: 'PITCH_DECK_ANALYTICS_REFERENCE.md',
    title: 'Pitch Deck Analytics - Technical Reference',
    description: 'Complete system architecture, database queries, integration patterns, security, error recovery, and performance benchmarks for the automated pitch deck extraction system.',
    category: 'technical',
    icon: Database,
    lastUpdated: '2025-01-30'
  },
  {
    filename: 'DATABASE_SCHEMA.md',
    title: 'Database Schema Reference',
    description: 'Complete database structure, table definitions, relationships, and field requirements.',
    category: 'technical',
    icon: Database,
    lastUpdated: '2025-01-14'
  },
  {
    filename: 'AUTH_DOCUMENTATION.md',
    title: 'Authentication System Documentation',
    description: 'Authentication flows, OAuth implementation, user management, and security patterns.',
    category: 'security',
    icon: Shield,
    lastUpdated: '2025-01-14'
  },
  {
    filename: 'USER_JOURNEY_MAP.md',
    title: 'User Journey Map',
    description: 'Complete user flow documentation covering all authentication paths and failure points.',
    category: 'core',
    icon: FileText,
    lastUpdated: '2025-01-14'
  },
  {
    filename: 'SECURITY_BEST_PRACTICES.md',
    title: 'Security Best Practices',
    description: 'Credential management, security guidelines, and incident response procedures.',
    category: 'security',
    icon: Shield,
    lastUpdated: '2025-01-14'
  },
  {
    filename: 'EMAIL_POLICY_DOCUMENTATION.md',
    title: 'Email System Policy',
    description: 'Centralized email management, deduplication, and welcome email workflows.',
    category: 'technical',
    icon: FileText,
    lastUpdated: '2025-01-14'
  },
  {
    filename: 'SLACK_BLACKLIST_DOCUMENTATION.md',
    title: 'Slack Notification System',
    description: 'Blacklist management and notification filtering for internal team accounts.',
    category: 'technical',
    icon: Settings,
    lastUpdated: '2025-01-14'
  },
  {
    filename: 'VERCEL_DEPLOYMENT.md',
    title: 'Vercel Deployment Guide',
    description: 'Production deployment instructions and environment configuration.',
    category: 'deployment',
    icon: Rocket,
    lastUpdated: '2025-01-14'
  },
  {
    filename: 'STRIPE_SETUP_GUIDE.md',
    title: 'Stripe Payment Integration',
    description: 'Payment system setup, webhook configuration, and tier management.',
    category: 'technical',
    icon: Settings,
    lastUpdated: '2025-01-14'
  },
  {
    filename: 'gtm-ga4-setup-guide.md',
    title: 'GTM & GA4 Setup Guide',
    description: 'Google Tag Manager and Analytics 4 configuration and implementation.',
    category: 'analytics',
    icon: Settings,
    lastUpdated: '2025-01-14'
  },
  {
    filename: 'GTM_BUTTON_TRACKING_LIST.md',
    title: 'GTM Button Tracking List',
    description: 'Comprehensive list of tracked buttons and events for analytics.',
    category: 'analytics',
    icon: Settings,
    lastUpdated: '2025-01-14'
  },
  {
    filename: 'CLAUDE.md',
    title: 'Claude Development Guidelines',
    description: 'Monorepo commands, architecture patterns, and development standards.',
    category: 'development',
    icon: Code,
    lastUpdated: '2025-01-14'
  }
];

export default function Docs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryInfo = (categoryId: string) => {
    return documentCategories.find(cat => cat.id === categoryId);
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">Documentation Center</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Comprehensive documentation for the KStoryBridge Dashboard application.
            Organize and explore all technical guides, deployment instructions, and architecture documentation.
          </p>
        </div>

        {/* Search and Filter */}
        <Card className="bg-transparent border-gray-300 shadow-none">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documentation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Categories</option>
                  {documentCategories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Access - Database Schema */}
        <Card className="bg-transparent border-gray-300 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              Database Schema & Architecture
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Database Visualization</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Interactive schema overview, entity relationships, and data structure exploration.
                </p>
                <Link to="/docs/schema">
                  <StandardButton variant="outline" className="w-full sm:w-auto">
                    View Database Schema
                  </StandardButton>
                </Link>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Schema Documentation</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Complete table definitions, field requirements, and naming conventions.
                </p>
                <Link to="/docs/view/DATABASE_SCHEMA.md">
                  <StandardButton variant="outline" className="w-full sm:w-auto">
                    Read Schema Docs
                  </StandardButton>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Access - UX Management */}
        <Card className="bg-transparent border-gray-300 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-purple-600" />
              UX Management Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">User Journey Maps</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Interactive flowcharts showing complete buyer and creator user journeys from signup to dashboard navigation.
                </p>
                <Link to="/docs/user_journey">
                  <StandardButton variant="outline" className="w-full sm:w-auto">
                    View User Journeys
                  </StandardButton>
                </Link>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Messaging Management</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Centralized interface to update page titles, descriptions, CTAs, and empty states across the entire application.
                </p>
                <Link to="/docs/messaging">
                  <StandardButton variant="outline" className="w-full sm:w-auto">
                    Manage Messaging
                  </StandardButton>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documentation Grid */}
        <div className="grid gap-6">
          {documentCategories.map(category => {
            const categoryDocs = filteredDocuments.filter(doc => doc.category === category.id);
            if (categoryDocs.length === 0 && selectedCategory !== 'all') return null;
            if (categoryDocs.length === 0 && selectedCategory === 'all') return null;

            return (
              <Card key={category.id} className="bg-transparent border-gray-300 shadow-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <category.icon className="h-5 w-5" />
                    {category.label}
                    <Badge className={category.color}>
                      {categoryDocs.length} {categoryDocs.length === 1 ? 'doc' : 'docs'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {categoryDocs.map(doc => (
                      <div key={doc.filename} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <doc.icon className="h-4 w-4 text-gray-500" />
                              <h3 className="font-semibold text-gray-900">{doc.title}</h3>
                            </div>
                            <p className="text-gray-600 text-sm mb-3">{doc.description}</p>
                            {doc.lastUpdated && (
                              <p className="text-xs text-gray-400">Last updated: {doc.lastUpdated}</p>
                            )}
                          </div>
                          <Link to={`/docs/view/${doc.filename}`}>
                            <StandardButton variant="outline" size="sm">
                              View
                            </StandardButton>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* No Results */}
        {filteredDocuments.length === 0 && (
          <Card className="bg-transparent border-gray-300 shadow-none">
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documentation found</h3>
              <p className="text-gray-600">
                Try adjusting your search terms or category filter.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}