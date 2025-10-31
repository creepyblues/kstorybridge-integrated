import { useState } from "react";
import { Link } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@kstorybridge/ui";
import { StandardButton } from "@/components/StandardButton";
import { Badge } from "@kstorybridge/ui";
import {
  ArrowLeft,
  Database,
  Users,
  FileText,
  Heart,
  Mail,
  Shield,
  Key,
  ExternalLink,
  Info
} from "lucide-react";

interface TableField {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey?: boolean;
  foreignKey?: string;
  defaultValue?: string;
  description: string;
}

interface DatabaseTable {
  name: string;
  description: string;
  category: 'auth' | 'users' | 'content' | 'system';
  icon: React.ComponentType<{ className?: string }>;
  fields: TableField[];
  relationships: Array<{
    type: 'one-to-many' | 'many-to-one' | 'one-to-one';
    table: string;
    description: string;
  }>;
}

const tables: DatabaseTable[] = [
  {
    name: 'user_buyers',
    description: 'Buyer accounts with tier-based access system',
    category: 'users',
    icon: Users,
    fields: [
      { name: 'id', type: 'uuid', nullable: false, primaryKey: true, foreignKey: 'auth.users(id)', description: 'Primary key, references auth users' },
      { name: 'email', type: 'text', nullable: false, description: 'Unique email address' },
      { name: 'full_name', type: 'text', nullable: false, description: 'Full name of the buyer' },
      { name: 'buyer_company', type: 'text', nullable: true, description: 'Company name (optional)' },
      { name: 'buyer_role', type: 'enum', nullable: true, description: 'Role: producer|executive|agent|content_scout|other' },
      { name: 'linkedin_url', type: 'text', nullable: true, description: 'LinkedIn profile URL (optional)' },
      { name: 'tier', type: 'enum', nullable: false, defaultValue: 'basic', description: 'Access tier: basic|invited|pro|suite' },
      { name: 'requested', type: 'boolean', nullable: true, description: 'Premium access request flag' },
      { name: 'created_at', type: 'timestamptz', nullable: false, defaultValue: 'now()', description: 'Account creation timestamp' },
      { name: 'updated_at', type: 'timestamptz', nullable: false, defaultValue: 'now()', description: 'Last update timestamp' }
    ],
    relationships: [
      { type: 'one-to-many', table: 'user_favorites', description: 'Buyers can have multiple favorites' },
      { type: 'one-to-one', table: 'auth.users', description: 'Links to Supabase auth user' }
    ]
  },
  {
    name: 'user_creators',
    description: 'Content creator/IP owner accounts',
    category: 'users',
    icon: Users,
    fields: [
      { name: 'id', type: 'uuid', nullable: false, primaryKey: true, foreignKey: 'auth.users(id)', description: 'Primary key, references auth users' },
      { name: 'email', type: 'text', nullable: false, description: 'Unique email address' },
      { name: 'full_name', type: 'text', nullable: false, description: 'Full name of the creator' },
      { name: 'pen_name', type: 'text', nullable: true, description: 'Pen name or studio name' },
      { name: 'ip_owner_role', type: 'enum', nullable: true, description: 'IP ownership role' },
      { name: 'ip_owner_company', type: 'text', nullable: true, description: 'IP owner company name' },
      { name: 'website_url', type: 'text', nullable: true, description: 'Creator website URL' },
      { name: 'invitation_status', type: 'text', nullable: false, defaultValue: 'invited', description: 'Invitation status: invited|accepted' },
      { name: 'created_at', type: 'timestamptz', nullable: false, defaultValue: 'now()', description: 'Account creation timestamp' },
      { name: 'updated_at', type: 'timestamptz', nullable: false, defaultValue: 'now()', description: 'Last update timestamp' }
    ],
    relationships: [
      { type: 'one-to-many', table: 'titles', description: 'Creators can have multiple titles' },
      { type: 'one-to-one', table: 'auth.users', description: 'Links to Supabase auth user' }
    ]
  },
  {
    name: 'titles',
    description: 'Content catalog with comprehensive metadata and vector embeddings',
    category: 'content',
    icon: FileText,
    fields: [
      { name: 'title_id', type: 'uuid', nullable: false, primaryKey: true, description: 'Primary key for title' },
      { name: 'title_name_kr', type: 'text', nullable: true, description: 'Korean title name' },
      { name: 'title_name_en', type: 'text', nullable: true, description: 'English title name' },
      { name: 'description', type: 'text', nullable: true, description: 'Title description' },
      { name: 'synopsis', type: 'text', nullable: true, description: 'Story synopsis' },
      { name: 'genre', type: 'text', nullable: true, description: 'Content genre' },
      { name: 'content_format', type: 'text', nullable: true, description: 'Format: webtoon|novel|manhwa|etc' },
      { name: 'author', type: 'text', nullable: true, description: 'Primary author' },
      { name: 'creator_id', type: 'uuid', nullable: true, foreignKey: 'user_creators(id)', description: 'Links to creator account' },
      { name: 'rights', type: 'text', nullable: true, description: 'Rights information' },
      { name: 'rights_owner', type: 'text', nullable: true, description: 'Rights owner details' },
      { name: 'title_image', type: 'text', nullable: true, description: 'Cover image URL' },
      { name: 'pitch', type: 'text', nullable: true, description: 'Pitch document URL' },
      { name: 'tags', type: 'text[]', nullable: true, description: 'Content tags array' },
      { name: 'comps', type: 'text[]', nullable: true, description: 'Comparable titles array' },
      { name: 'embedding', type: 'vector(1536)', nullable: true, description: 'OpenAI text embedding for semantic search' },
      { name: 'views', type: 'integer', nullable: true, defaultValue: '0', description: 'View count' },
      { name: 'likes', type: 'integer', nullable: true, defaultValue: '0', description: 'Like count' },
      { name: 'created_at', type: 'timestamptz', nullable: false, defaultValue: 'now()', description: 'Creation timestamp' },
      { name: 'updated_at', type: 'timestamptz', nullable: false, defaultValue: 'now()', description: 'Last update timestamp' }
    ],
    relationships: [
      { type: 'many-to-one', table: 'user_creators', description: 'Title belongs to a creator' },
      { type: 'one-to-many', table: 'user_favorites', description: 'Title can be favorited by multiple users' }
    ]
  },
  {
    name: 'user_favorites',
    description: 'User-favorited titles relationship table',
    category: 'content',
    icon: Heart,
    fields: [
      { name: 'id', type: 'uuid', nullable: false, primaryKey: true, defaultValue: 'gen_random_uuid()', description: 'Primary key' },
      { name: 'user_id', type: 'uuid', nullable: false, foreignKey: 'auth.users(id)', description: 'User who favorited' },
      { name: 'title_id', type: 'uuid', nullable: false, foreignKey: 'titles(title_id)', description: 'Favorited title' },
      { name: 'created_at', type: 'timestamptz', nullable: false, defaultValue: 'now()', description: 'When favorited' }
    ],
    relationships: [
      { type: 'many-to-one', table: 'auth.users', description: 'Favorite belongs to a user' },
      { type: 'many-to-one', table: 'titles', description: 'Favorite references a title' }
    ]
  },
  {
    name: 'email_logs',
    description: 'Email communication tracking and deduplication',
    category: 'system',
    icon: Mail,
    fields: [
      { name: 'id', type: 'uuid', nullable: false, primaryKey: true, defaultValue: 'gen_random_uuid()', description: 'Primary key' },
      { name: 'user_email', type: 'text', nullable: false, description: 'Recipient email address' },
      { name: 'email_type', type: 'text', nullable: false, description: 'Type: welcome|notification|etc' },
      { name: 'account_type', type: 'text', nullable: true, description: 'User account type: buyer|creator' },
      { name: 'sent_successfully', type: 'boolean', nullable: false, description: 'Email send status' },
      { name: 'error_message', type: 'text', nullable: true, description: 'Error details if failed' },
      { name: 'created_at', type: 'timestamptz', nullable: false, defaultValue: 'now()', description: 'Email send timestamp' }
    ],
    relationships: []
  },
  {
    name: 'admin',
    description: 'Administrative users for system access',
    category: 'auth',
    icon: Shield,
    fields: [
      { name: 'id', type: 'uuid', nullable: false, primaryKey: true, foreignKey: 'auth.users(id)', description: 'Primary key, references auth users' },
      { name: 'email', type: 'text', nullable: false, description: 'Admin email address' },
      { name: 'full_name', type: 'text', nullable: false, description: 'Admin full name' },
      { name: 'active', type: 'boolean', nullable: false, defaultValue: 'true', description: 'Admin account status' },
      { name: 'created_at', type: 'timestamp', nullable: false, defaultValue: 'now()', description: 'Admin creation timestamp' }
    ],
    relationships: [
      { type: 'one-to-one', table: 'auth.users', description: 'Links to Supabase auth user' }
    ]
  }
];

const categoryColors = {
  auth: 'bg-red-100 text-red-800',
  users: 'bg-blue-100 text-blue-800',
  content: 'bg-green-100 text-green-800',
  system: 'bg-purple-100 text-purple-800'
};

const typeColors = {
  uuid: 'bg-yellow-100 text-yellow-800',
  text: 'bg-gray-100 text-gray-800',
  boolean: 'bg-green-100 text-green-800',
  integer: 'bg-blue-100 text-blue-800',
  enum: 'bg-purple-100 text-purple-800',
  timestamptz: 'bg-orange-100 text-orange-800',
  timestamp: 'bg-orange-100 text-orange-800',
  'text[]': 'bg-indigo-100 text-indigo-800',
  'vector(1536)': 'bg-pink-100 text-pink-800'
};

export default function DatabaseSchema() {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredTables = selectedCategory === 'all'
    ? tables
    : tables.filter(table => table.category === selectedCategory);

  const selectedTableData = selectedTable
    ? tables.find(table => table.name === selectedTable)
    : null;

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <Link to="/docs">
                <StandardButton variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Docs
                </StandardButton>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Database className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Database Schema</h1>
            </div>
            <p className="text-gray-600 mt-2">
              Interactive visualization of the KStoryBridge database structure, relationships, and field definitions.
            </p>
          </div>
          <Link to="/docs/view/DATABASE_SCHEMA.md">
            <StandardButton variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" />
              Full Schema Docs
            </StandardButton>
          </Link>
        </div>

        {/* Category Filter */}
        <Card className="bg-transparent border-gray-300 shadow-none">
          <CardContent className="p-4">
            <div className="flex gap-2 flex-wrap">
              {['all', 'auth', 'users', 'content', 'system'].map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                  }`}
                >
                  {category === 'all' ? 'All Tables' : category.charAt(0).toUpperCase() + category.slice(1)}
                  {category !== 'all' && (
                    <span className="ml-1 text-xs">
                      ({tables.filter(t => t.category === category).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Tables List */}
          <div className="lg:col-span-1">
            <Card className="bg-transparent border-gray-300 shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Tables
                  <Badge className="bg-gray-100 text-gray-800">
                    {filteredTables.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {filteredTables.map((table) => (
                  <button
                    key={table.name}
                    onClick={() => setSelectedTable(table.name)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedTable === table.name
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <table.icon className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-gray-900">{table.name}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{table.description}</p>
                    <Badge className={`text-xs ${categoryColors[table.category]}`}>
                      {table.category}
                    </Badge>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Table Details */}
          <div className="lg:col-span-2">
            {selectedTableData ? (
              <Card className="bg-transparent border-gray-300 shadow-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <selectedTableData.icon className="h-5 w-5" />
                    {selectedTableData.name}
                    <Badge className={categoryColors[selectedTableData.category]}>
                      {selectedTableData.category}
                    </Badge>
                  </CardTitle>
                  <p className="text-gray-600">{selectedTableData.description}</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Fields */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      Fields ({selectedTableData.fields.length})
                    </h3>
                    <div className="space-y-2">
                      {selectedTableData.fields.map((field) => (
                        <div key={field.name} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-gray-900">{field.name}</span>
                            <Badge className={`text-xs ${typeColors[field.type] || 'bg-gray-100 text-gray-800'}`}>
                              {field.type}
                            </Badge>
                            {field.primaryKey && (
                              <Badge className="text-xs bg-yellow-100 text-yellow-800">PK</Badge>
                            )}
                            {field.foreignKey && (
                              <Badge className="text-xs bg-blue-100 text-blue-800">FK</Badge>
                            )}
                            {!field.nullable && (
                              <Badge className="text-xs bg-red-100 text-red-800">NOT NULL</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{field.description}</p>
                          {field.foreignKey && (
                            <p className="text-xs text-blue-600">References: {field.foreignKey}</p>
                          )}
                          {field.defaultValue && (
                            <p className="text-xs text-gray-500">Default: {field.defaultValue}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Relationships */}
                  {selectedTableData.relationships.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Relationships</h3>
                      <div className="space-y-2">
                        {selectedTableData.relationships.map((rel, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className="text-xs bg-purple-100 text-purple-800">
                                {rel.type}
                              </Badge>
                              <span className="font-medium text-gray-900">{rel.table}</span>
                            </div>
                            <p className="text-sm text-gray-600">{rel.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-transparent border-gray-300 shadow-none">
                <CardContent className="text-center py-12">
                  <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Table</h3>
                  <p className="text-gray-600">
                    Click on a table from the list to view its structure, fields, and relationships.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Schema Conventions */}
        <Card className="bg-transparent border-gray-300 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Schema Conventions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Naming Standards</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• <strong>Tables:</strong> snake_case (e.g., user_buyers, user_favorites)</li>
                  <li>• <strong>Fields:</strong> snake_case (e.g., full_name, created_at)</li>
                  <li>• <strong>Primary Keys:</strong> id (uuid) or table_name_id</li>
                  <li>• <strong>Timestamps:</strong> created_at, updated_at (with timezone)</li>
                  <li>• <strong>Foreign Keys:</strong> table_name_id references table(id)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Data Standards</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• <strong>Account Types:</strong> 'buyer' and 'creator' (standardized)</li>
                  <li>• <strong>Tier System:</strong> basic (default) | invited | pro | suite</li>
                  <li>• <strong>Arrays:</strong> PostgreSQL array types (text[], etc.)</li>
                  <li>• <strong>Vectors:</strong> pgvector extension for AI embeddings</li>
                  <li>• <strong>Auth:</strong> All user tables link to auth.users(id)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}