import { useState, useEffect } from 'react';
import { Star, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AdminLayout from '@/components/layout/AdminLayout';
import { featuredService, type FeaturedWithTitle } from '@/services/featuredService';
import { titlesService, type Title } from '@/services/titlesService';
import { useToast } from '@/hooks/use-toast';

export default function AdminFeatured() {
  const { toast } = useToast();
  const [featured, setFeatured] = useState<FeaturedWithTitle[]>([]);
  const [allTitles, setAllTitles] = useState<Title[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selectedTitleId, setSelectedTitleId] = useState('');
  const [newNote, setNewNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteValue, setEditNoteValue] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [featuredData, titlesData] = await Promise.all([
        featuredService.getAllFeatured(),
        titlesService.getTitles()
      ]);
      setFeatured(featuredData);
      setAllTitles(titlesData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load data'
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleAddFeatured() {
    if (!selectedTitleId) {
      toast({
        title: 'Error',
        description: 'Please select a title'
      });
      return;
    }

    try {
      setAdding(true);

      // Check if already featured
      const isAlreadyFeatured = await featuredService.isTitleFeatured(selectedTitleId);
      if (isAlreadyFeatured) {
        toast({
          title: 'Error',
          description: 'This title is already featured'
        });
        return;
      }

      await featuredService.addFeaturedTitle(selectedTitleId, newNote || undefined);

      toast({
        title: 'Success',
        description: 'Title added to featured'
      });

      // Reset form and reload data
      setSelectedTitleId('');
      setNewNote('');
      await loadData();
    } catch (error) {
      console.error('Error adding featured:', error);
      toast({
        title: 'Error',
        description: 'Failed to add featured title'
      });
    } finally {
      setAdding(false);
    }
  }

  function startEditingNote(featuredId: string, currentNote: string | null) {
    setEditingNoteId(featuredId);
    setEditNoteValue(currentNote || '');
  }

  function cancelEditingNote() {
    setEditingNoteId(null);
    setEditNoteValue('');
  }

  async function saveNote(featuredId: string) {
    try {
      await featuredService.updateFeaturedNote(featuredId, editNoteValue);

      // Update only the changed item in state (no reload needed)
      setFeatured(prev => prev.map(item =>
        item.id === featuredId
          ? { ...item, note: editNoteValue }
          : item
      ));

      toast({
        title: 'Success',
        description: 'Note updated successfully'
      });

      setEditingNoteId(null);
      setEditNoteValue('');
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: 'Error',
        description: 'Failed to update note'
      });
    }
  }

  async function handleDelete(featuredId: string, titleName: string) {
    if (!confirm(`Remove "${titleName}" from featured titles?`)) return;

    try {
      await featuredService.removeFeaturedTitle(featuredId);

      toast({
        title: 'Success',
        description: 'Title removed from featured'
      });

      await loadData();
    } catch (error) {
      console.error('Error deleting featured:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove featured title'
      });
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Get titles that are not already featured
  const availableTitles = allTitles.filter(
    title => !featured.some(f => f.title_id === title.title_id)
  );

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Star className="h-8 w-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-midnight-ink">Featured Titles Management</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-purple-500 text-white">
              ADMIN ONLY
            </span>
          </div>
          <p className="text-gray-600">
            Manage featured titles displayed on the homepage
          </p>
          {!loading && (
            <p className="text-sm text-gray-500 mt-2">
              <span className="font-medium text-purple-600">
                {featured.length} featured titles
              </span>
              {' / '}
              <span className="font-medium text-gray-700">
                {allTitles.length} total titles
              </span>
            </p>
          )}
        </div>

        {/* Add New Featured Title */}
        <Card className="mb-8 bg-white border-gray-300 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600 font-bold">
                <Plus className="h-4 w-4" />
              </span>
              <h2 className="text-xl font-semibold text-midnight-ink">Add Featured Title</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Title
                </label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  value={selectedTitleId}
                  onChange={(e) => setSelectedTitleId(e.target.value)}
                  disabled={adding || loading}
                >
                  <option value="">Choose a title to feature...</option>
                  {availableTitles.map(title => (
                    <option key={title.title_id} value={title.title_id}>
                      {title.title_name_en || title.title_name_kr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note (Optional)
                </label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  rows={3}
                  placeholder="Add a note about why this title is featured..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  disabled={adding || loading}
                />
              </div>

              <Button
                onClick={handleAddFeatured}
                disabled={!selectedTitleId || adding || loading}
                variant="outline"
                className="border-purple-300 hover:bg-purple-50"
              >
                {adding ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Featured Title
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Featured Titles Table */}
        <Card className="bg-white border-gray-300 shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-midnight-ink mb-4">Current Featured Titles</h2>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : featured.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Star className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-lg">No featured titles yet</p>
                <p className="text-sm mt-1">Add titles above to feature them on the homepage</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title Name</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {featured.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.titles?.title_name_en || item.titles?.title_name_kr || 'Unknown Title'}
                        </TableCell>
                        <TableCell>
                          {editingNoteId === item.id ? (
                            <div className="space-y-2">
                              <textarea
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                                rows={2}
                                value={editNoteValue}
                                onChange={(e) => setEditNoteValue(e.target.value)}
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => saveNote(item.id)}
                                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-xs"
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={cancelEditingNote}
                                  className="px-3 py-1 text-xs"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div
                              className="max-w-md text-gray-600 cursor-pointer hover:bg-gray-50 p-2 rounded"
                              onClick={() => startEditingNote(item.id, item.note)}
                            >
                              {item.note || <span className="italic text-gray-400">Click to add note</span>}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {formatDate(item.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(
                              item.id,
                              item.titles?.title_name_en || item.titles?.title_name_kr || 'Unknown Title'
                            )}
                            className="border-red-300 hover:bg-red-50 text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
