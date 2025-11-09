import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useToast } from '@/hooks/use-toast';
import { featuredService, type FeaturedWithTitle } from '@/services/featuredService';
import { titlesService, type Title } from '@/services/titlesService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Star, Plus, Trash2, Loader2, Save, X } from 'lucide-react';

export default function Featured() {
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
        titlesService.getTitles(),
      ]);
      setFeatured(featuredData);
      setAllTitles(titlesData);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleAddFeatured() {
    if (!selectedTitleId) {
      toast({
        title: 'Error',
        description: 'Please select a title',
        variant: 'destructive',
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
          description: 'This title is already featured',
          variant: 'destructive',
        });
        return;
      }

      await featuredService.addFeaturedTitle(selectedTitleId, newNote || undefined);

      toast({
        title: 'Success',
        description: 'Title added to featured',
      });

      // Reset form and reload data
      setSelectedTitleId('');
      setNewNote('');
      await loadData();
    } catch (error: any) {
      console.error('Error adding featured:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add featured title',
        variant: 'destructive',
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

      // Update local state
      setFeatured((prev) =>
        prev.map((item) =>
          item.id === featuredId ? { ...item, note: editNoteValue } : item
        )
      );

      toast({
        title: 'Success',
        description: 'Note updated successfully',
      });

      setEditingNoteId(null);
      setEditNoteValue('');
    } catch (error: any) {
      console.error('Error updating note:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update note',
        variant: 'destructive',
      });
    }
  }

  async function handleDelete(featuredId: string, titleName: string) {
    if (!confirm(`Remove "${titleName}" from featured titles?`)) return;

    try {
      await featuredService.removeFeaturedTitle(featuredId);

      toast({
        title: 'Success',
        description: 'Title removed from featured',
      });

      await loadData();
    } catch (error: any) {
      console.error('Error deleting featured:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove featured title',
        variant: 'destructive',
      });
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  // Get titles that are not already featured
  const availableTitles = allTitles.filter(
    (title) => !featured.some((f) => f.title_id === title.title_id)
  );

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Star className="h-8 w-8 text-hanok-teal" />
            <h1 className="text-3xl font-bold text-black">Featured Titles Management</h1>
          </div>
          <p className="text-gray-600">Manage featured titles displayed on the homepage</p>
          {!loading && (
            <p className="text-sm text-gray-500 mt-2">
              <span className="font-medium text-hanok-teal">{featured.length} featured</span>
              {' / '}
              <span className="font-medium text-gray-700">{allTitles.length} total titles</span>
            </p>
          )}
        </div>

        {/* Add New Featured Title */}
        <Card className="bg-transparent border-gray-300 shadow-none">
          <CardHeader>
            <CardTitle className="text-black flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Featured Title
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Title
              </label>
              <Select
                value={selectedTitleId}
                onValueChange={setSelectedTitleId}
                disabled={adding || loading}
              >
                <SelectTrigger className="border-gray-300">
                  <SelectValue placeholder="Choose a title to feature..." />
                </SelectTrigger>
                <SelectContent>
                  {availableTitles.map((title) => (
                    <SelectItem key={title.title_id} value={title.title_id}>
                      {title.title_name_en || title.title_name_kr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Note (Optional)
              </label>
              <Textarea
                rows={3}
                placeholder="Add a note about why this title is featured..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                disabled={adding || loading}
                className="border-gray-300"
              />
            </div>

            <Button
              onClick={handleAddFeatured}
              disabled={!selectedTitleId || adding || loading}
              className="bg-hanok-teal hover:bg-hanok-teal/90"
            >
              {adding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Featured Title
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Featured Titles Table */}
        <Card className="bg-transparent border-gray-300 shadow-none">
          <CardHeader>
            <CardTitle className="text-black">Current Featured Titles</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
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
                          {item.titles?.title_name_en ||
                            item.titles?.title_name_kr ||
                            'Unknown Title'}
                        </TableCell>
                        <TableCell>
                          {editingNoteId === item.id ? (
                            <div className="space-y-2">
                              <Textarea
                                rows={2}
                                value={editNoteValue}
                                onChange={(e) => setEditNoteValue(e.target.value)}
                                autoFocus
                                className="border-gray-300"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => saveNote(item.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <Save className="h-3 w-3 mr-1" />
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={cancelEditingNote}
                                  className="border-gray-300"
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div
                              className="max-w-md text-gray-600 cursor-pointer hover:bg-gray-50 p-2 rounded"
                              onClick={() => startEditingNote(item.id, item.note)}
                            >
                              {item.note || (
                                <span className="italic text-gray-400">Click to add note</span>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {formatDate(item.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              handleDelete(
                                item.id,
                                item.titles?.title_name_en ||
                                  item.titles?.title_name_kr ||
                                  'Unknown Title'
                              )
                            }
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
