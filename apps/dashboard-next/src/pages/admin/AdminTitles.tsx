import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AdminLayout from '@/components/layout/AdminLayout';
import { TitleEditModal } from '@/components/admin/TitleEditModal';
import { useToast } from '@/hooks/use-toast';
import { titlesService, Title } from '@/services/titlesService';
import { Search, Plus, Edit, Trash2, Loader2 } from 'lucide-react';

export default function AdminTitles() {
  const { toast } = useToast();
  const [titles, setTitles] = useState<Title[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTitles, setFilteredTitles] = useState<Title[]>([]);
  const [editingTitle, setEditingTitle] = useState<Title | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTitles();
  }, []);

  useEffect(() => {
    // Filter titles by search query
    if (searchQuery) {
      const filtered = titles.filter(
        (title) =>
          title.title_name_en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          title.title_name_kr?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          title.title_id.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTitles(filtered);
    } else {
      setFilteredTitles(titles);
    }
  }, [searchQuery, titles]);

  const fetchTitles = async () => {
    setLoading(true);
    try {
      const data = await titlesService.getTitles();
      setTitles(data);
      setFilteredTitles(data);
    } catch (error: any) {
      console.error('Error fetching titles:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch titles',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (title: Title) => {
    setEditingTitle(title);
  };

  const handleSaveEdit = async (updates: Partial<Title>) => {
    if (!editingTitle) return;

    try {
      await titlesService.updateTitle(editingTitle.title_id, updates);

      // Refresh titles list
      await fetchTitles();

      toast({
        title: 'Success',
        description: 'Title updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating title:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update title',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (titleId: string, titleName: string) => {
    if (!confirm(`Are you sure you want to delete "${titleName}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(titleId);
    try {
      await titlesService.deleteTitle(titleId);

      // Remove from local state
      setTitles((prev) => prev.filter((t) => t.title_id !== titleId));
      setFilteredTitles((prev) => prev.filter((t) => t.title_id !== titleId));

      toast({
        title: 'Success',
        description: 'Title deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting title:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete title',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-black">Titles Management</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage all titles in the system
            </p>
          </div>
          <Button className="bg-hanok-teal hover:bg-hanok-teal/90">
            <Plus className="h-4 w-4 mr-2" />
            Add New Title
          </Button>
        </div>

        {/* Search & Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by title name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={fetchTitles}
                className="border-gray-300"
              >
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Total Titles</div>
              <div className="text-2xl font-bold text-black mt-1">{titles.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">With Pitch Decks</div>
              <div className="text-2xl font-bold text-black mt-1">
                {titles.filter((t) => t.pitch).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Completed</div>
              <div className="text-2xl font-bold text-black mt-1">
                {titles.filter((t) => t.completed).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Ongoing</div>
              <div className="text-2xl font-bold text-black mt-1">
                {titles.filter((t) => !t.completed).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Titles Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : filteredTitles.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No titles found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Genre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Format
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Views
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Rating
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTitles.map((title) => (
                      <tr key={title.title_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {title.title_image && (
                              <div className="flex-shrink-0 h-10 w-10 rounded overflow-hidden bg-gray-100 mr-3">
                                <img
                                  src={title.title_image}
                                  alt={title.title_name_en || title.title_name_kr || ''}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-medium text-black">
                                {title.title_name_en || title.title_name_kr}
                              </div>
                              {title.title_name_kr && title.title_name_en && (
                                <div className="text-xs text-gray-500">
                                  {title.title_name_kr}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {title.genre || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {title.content_format || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              title.completed
                                ? 'bg-green-100 text-green-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {title.completed ? 'Completed' : 'Ongoing'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {title.views ? titlesService.formatNumber(title.views) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {title.rating ? title.rating.toFixed(1) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleEdit(title)}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() =>
                              handleDelete(
                                title.title_id,
                                title.title_name_en || title.title_name_kr || 'this title'
                              )
                            }
                            disabled={deletingId === title.title_id}
                            title="Delete"
                          >
                            {deletingId === title.title_id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      {editingTitle && (
        <TitleEditModal
          title={editingTitle}
          onSave={handleSaveEdit}
          onClose={() => setEditingTitle(null)}
        />
      )}
    </AdminLayout>
  );
}
