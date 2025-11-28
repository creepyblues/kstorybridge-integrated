/**
 * Content List Page (Admin)
 * View and manage all CMS content posts
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { listPosts, deletePost, type ContentPost } from '@/services/contentService';
import { Plus, Edit, Trash2, Eye, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const ContentList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<{ id: string; title: string } | null>(null);

  // Fetch posts with filters
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['content-posts', categoryFilter, statusFilter, searchQuery],
    queryFn: () =>
      listPosts({
        category: categoryFilter !== 'all' ? (categoryFilter as 'learning' | 'news') : undefined,
        status: statusFilter !== 'all' ? (statusFilter as 'draft' | 'published' | 'archived') : undefined,
        search: searchQuery || undefined,
      }),
  });

  const openDeleteDialog = (id: string, title: string) => {
    console.log('🗑️ Delete button clicked:', { id, title });

    // Use browser confirm as fallback if dialog doesn't work
    const confirmed = window.confirm(`Are you sure you want to delete "${title}"?\n\nThis action cannot be undone.`);

    if (confirmed) {
      console.log('✅ User confirmed deletion');
      // Directly call confirmDelete with the post info
      handleDirectDelete(id, title);
    } else {
      console.log('❌ User cancelled deletion');
    }
  };

  const handleDirectDelete = async (id: string, title: string) => {
    try {
      await deletePost(id);
      toast({
        title: 'Post deleted',
        description: `"${title}" has been deleted successfully.`,
      });
      refetch();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete post. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const confirmDelete = async () => {
    if (!postToDelete) return;

    try {
      await deletePost(postToDelete.id);
      toast({
        title: 'Post deleted',
        description: `"${postToDelete.title}" has been deleted successfully.`,
      });
      refetch();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete post. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setPostToDelete(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-500 text-white">Published</Badge>;
      case 'draft':
        return <Badge className="bg-amber-500 text-white">Draft</Badge>;
      case 'archived':
        return <Badge className="bg-gray-500 text-white">Archived</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'learning':
        return <Badge variant="outline" className="border-blue-500 text-blue-500">Learning</Badge>;
      case 'news':
        return <Badge variant="outline" className="border-purple-500 text-purple-500">News</Badge>;
      default:
        return <Badge variant="outline">{category}</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-2xl font-bold">Content Management</CardTitle>
            <Button
              onClick={() => navigate('/admin/content/new')}
              className="bg-black text-white hover:bg-gray-800"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by title or excerpt..."
                value={searchQuery}
                onChange={(e: React.FormEvent) => setSearchQuery((e as React.ChangeEvent<HTMLInputElement>).target.value)}
                className="pl-10"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="learning">Learning</SelectItem>
                <SelectItem value="news">News</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Posts Table */}
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading posts...</div>
          ) : data?.posts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No posts found. Create your first post to get started!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.posts.map((post: ContentPost) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium max-w-xs truncate">
                        {post.title}
                      </TableCell>
                      <TableCell>{getCategoryBadge(post.category)}</TableCell>
                      <TableCell>{getStatusBadge(post.status)}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(post.published_at)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {post.author_name}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {post.status === 'published' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`https://creator.kstorybridge.com/${post.category === 'learning' ? 'learning-center' : 'news'}/${post.slug}`, '_blank')}
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/admin/content/${post.id}/edit`)}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(post.id, post.title)}
                            title="Delete"
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Stats */}
          {data && data.posts.length > 0 && (
            <div className="mt-6 text-sm text-gray-500">
              Showing {data.posts.length} of {data.count} posts
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete Post"
        description={`Are you sure you want to delete "${postToDelete?.title}"? This action cannot be undone.`}
      />
    </div>
  );
};
