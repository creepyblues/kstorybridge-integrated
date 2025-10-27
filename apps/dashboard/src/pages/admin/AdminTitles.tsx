import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { RefreshCw, Edit, ChevronUp, ChevronDown, ArrowUpDown } from "lucide-react";
import { Button } from "@kstorybridge/ui";
import { useToast } from "@/hooks/use-toast";
import { titlesService, type Title } from "@/services/titlesService";
import AdminLayout from "@/components/layout/AdminLayout";
import { PitchBadge } from "@/components/PitchBadge";
import { VerifiedBadge } from "@/components/VerifiedBadge";

export default function AdminTitles() {
  const { toast } = useToast();
  const [titles, setTitles] = useState<Title[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState<string | null>('title');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    loadTitles();
  }, []);

  const loadTitles = async () => {
    try {
      setLoading(true);
      console.log('📚 Loading all titles for admin...');

      const allTitles = await titlesService.getAllTitles();
      setTitles(allTitles);

      console.log(`✅ Successfully loaded ${allTitles.length} titles`);
    } catch (error) {
      console.error("❌ Error loading titles:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      toast({
        title: "Error Loading Titles",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadTitles();
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortTitles = (titles: Title[]) => {
    if (!sortField) return titles;

    return [...titles].sort((a, b) => {
      let aValue: string | string[] | null | undefined;
      let bValue: string | string[] | null | undefined;

      switch (sortField) {
        case 'title':
          aValue = a.title_name_en || a.title_name_kr || '';
          bValue = b.title_name_en || b.title_name_kr || '';
          break;
        case 'genre':
          aValue = Array.isArray(a.genre) ? a.genre.join(', ') : (a.genre || '');
          bValue = Array.isArray(b.genre) ? b.genre.join(', ') : (b.genre || '');
          break;
        case 'tone':
          aValue = a.tone || '';
          bValue = b.tone || '';
          break;
        case 'keywords':
          const aKeywords = (a as any).keywords || a.tags;
          const bKeywords = (b as any).keywords || b.tags;
          aValue = Array.isArray(aKeywords) ? aKeywords.join(', ') : (aKeywords || '');
          bValue = Array.isArray(bKeywords) ? bKeywords.join(', ') : (bKeywords || '');
          break;
        case 'comps':
          aValue = Array.isArray(a.comps) ? a.comps.join(', ') : (a.comps || '');
          bValue = Array.isArray(b.comps) ? b.comps.join(', ') : (b.comps || '');
          break;
        default:
          return 0;
      }

      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();

      if (aStr < bStr) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aStr > bStr) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  const formatGenre = (genre: string | string[]) => {
    if (Array.isArray(genre)) {
      return genre.map(g => g.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())).join(', ');
    }
    return genre.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const SortableHeader = ({ field, children, className = "" }: {
    field: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <button
      onClick={() => handleSort(field)}
      className={`flex items-center gap-1 hover:text-gray-900 transition-colors ${className}`}
    >
      {children}
      {sortField === field ? (
        sortDirection === 'asc' ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )
      ) : (
        <ArrowUpDown className="w-4 h-4 text-gray-400 opacity-60" />
      )}
    </button>
  );

  const sortedTitles = sortTitles(titles);

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-midnight-ink">Title Management</h1>
              <Button
                onClick={handleRefresh}
                disabled={loading}
                variant="outline"
                size="sm"
                className="text-midnight-ink border-midnight-ink/20 hover:bg-midnight-ink/5 p-2"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <div className="text-sm text-gray-600">
              Total: {sortedTitles.length} titles
            </div>
          </div>
          <p className="text-gray-600">
            View and edit all titles in the database
          </p>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Desktop Table Header */}
          <div className="hidden lg:block bg-gray-50 px-6 py-4 border-b">
            <div className="grid grid-cols-12 gap-4 items-center font-semibold text-gray-700 text-sm">
              <div className="col-span-1">Image</div>
              <div className="col-span-3">
                <SortableHeader field="title">Title</SortableHeader>
              </div>
              <div className="col-span-2">
                <SortableHeader field="genre">Genre</SortableHeader>
              </div>
              <div className="col-span-2">
                <SortableHeader field="tone">Tone</SortableHeader>
              </div>
              <div className="col-span-2">
                <SortableHeader field="keywords">Keywords</SortableHeader>
              </div>
              <div className="col-span-1">
                <SortableHeader field="comps">Comps</SortableHeader>
              </div>
              <div className="col-span-1 text-center">Actions</div>
            </div>
          </div>

          {/* Mobile Header */}
          <div className="lg:hidden bg-gray-50 px-4 py-3 border-b">
            <div className="text-sm font-semibold text-gray-700">
              All Titles ({sortedTitles.length})
            </div>
          </div>

          <div className="divide-y">
            {loading ? (
              <div className="px-6 py-12 text-center text-gray-500">
                <RefreshCw className="w-6 h-6 animate-spin text-hanok-teal mx-auto mb-2" />
                Loading titles...
              </div>
            ) : sortedTitles.length > 0 ? (
              sortedTitles.map((title) => (
                <div key={title.title_id}>
                  {/* Desktop Table Row */}
                  <div className="hidden lg:grid px-6 py-4 grid-cols-12 gap-4 items-center hover:bg-gray-50 transition-colors">
                    <div className="col-span-1">
                      {title.title_image ? (
                        <div className="w-16 h-20 bg-gray-200 rounded-lg overflow-hidden">
                          <img
                            src={title.title_image}
                            alt={title.title_name_en || title.title_name_kr}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.parentElement!.classList.add('flex', 'items-center', 'justify-center');
                              e.currentTarget.parentElement!.innerHTML = '<span class="text-xs text-gray-400">No Image</span>';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-xs text-gray-400">No Image</span>
                        </div>
                      )}
                    </div>

                    <div className="col-span-3">
                      {title.pitch && (
                        <div className="mb-1">
                          <PitchBadge size="sm" />
                        </div>
                      )}
                      {title.verified && (
                        <div className="mb-1">
                          <VerifiedBadge size="sm" />
                        </div>
                      )}
                      <div className="font-medium text-gray-800 line-clamp-1 text-sm">
                        {title.title_name_en || title.title_name_kr}
                      </div>
                      {title.title_name_en && title.title_name_kr && (
                        <div className="text-xs text-gray-500 line-clamp-1 mt-1">
                          {title.title_name_kr}
                        </div>
                      )}
                    </div>

                    <div className="col-span-2">
                      {title.genre && (Array.isArray(title.genre) ? title.genre.length > 0 : true) ? (
                        <div className="flex flex-wrap gap-1 max-h-[3.5rem] overflow-hidden">
                          {Array.isArray(title.genre) ? (
                            title.genre.map((g, idx) => (
                              <div key={`${title.title_id}-genre-${idx}`} className="inline-block bg-cyan-100 text-cyan-800 px-2 py-1 rounded-lg text-xs font-medium truncate max-w-[120px]" title={formatGenre(g)}>
                                {formatGenre(g)}
                              </div>
                            ))
                          ) : (
                            <div className="inline-block bg-cyan-100 text-cyan-800 px-2 py-1 rounded-lg text-xs font-medium truncate max-w-[120px]" title={formatGenre(title.genre)}>
                              {formatGenre(title.genre)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>

                    <div className="col-span-2">
                      {title.tone ? (
                        <div className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded-lg text-xs font-medium">
                          {title.tone}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>

                    <div className="col-span-2">
                      {((title as any).keywords || title.tags) && ((title as any).keywords || title.tags).length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-h-[3.5rem] overflow-hidden">
                          {((title as any).keywords || title.tags).map((tag: string, idx: number) => (
                            <div key={`${title.title_id}-keyword-${idx}`} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-lg text-xs font-medium truncate max-w-[120px]" title={tag}>
                              {tag}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>

                    <div className="col-span-1">
                      {title.comps && title.comps.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {title.comps.slice(0, 2).map((comp, index) => (
                            <div key={index} className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-lg text-xs font-medium truncate max-w-[100px]" title={comp}>
                              {comp}
                            </div>
                          ))}
                          {title.comps.length > 2 && (
                            <span className="text-xs text-gray-500">+{title.comps.length - 2}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>

                    <div className="col-span-1 flex justify-center">
                      <Link to={`/admin/titles/${title.title_id}/edit`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-300 hover:bg-gray-100"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Mobile Card Layout */}
                  <div className="lg:hidden p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex gap-4">
                      {/* Image */}
                      <div className="flex-shrink-0">
                        {title.title_image ? (
                          <div className="w-20 h-24 bg-gray-200 rounded-lg overflow-hidden">
                            <img
                              src={title.title_image}
                              alt={title.title_name_en || title.title_name_kr}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-20 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                            <span className="text-xs text-gray-400">No Image</span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="mb-2">
                          {title.pitch && (
                            <PitchBadge size="sm" className="mr-2" />
                          )}
                          <h3 className="font-semibold text-gray-800 text-base line-clamp-2">
                            {title.title_name_en || title.title_name_kr}
                          </h3>
                          {title.title_name_en && title.title_name_kr && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                              {title.title_name_kr}
                            </p>
                          )}
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1 items-center mb-3">
                          {title.genre && (
                            Array.isArray(title.genre) ? (
                              title.genre.slice(0, 2).map((g, idx) => (
                                <span key={idx} className="inline-block bg-cyan-100 text-cyan-800 px-1.5 py-0.5 rounded-lg text-xs font-medium">
                                  {formatGenre(g)}
                                </span>
                              ))
                            ) : (
                              <span className="inline-block bg-cyan-100 text-cyan-800 px-1.5 py-0.5 rounded-lg text-xs font-medium">
                                {formatGenre(title.genre)}
                              </span>
                            )
                          )}
                          {Array.isArray(title.genre) && title.genre.length > 2 && (
                            <span className="text-xs text-gray-500">+{title.genre.length - 2}</span>
                          )}

                          {title.tone && (
                            <span className="inline-block bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded-lg text-xs font-medium">
                              {title.tone}
                            </span>
                          )}
                        </div>

                        {/* Edit Button */}
                        <Link to={`/admin/titles/${title.title_id}/edit`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-gray-300 hover:bg-gray-100 w-full"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Title
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center text-gray-500">
                No titles found
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
