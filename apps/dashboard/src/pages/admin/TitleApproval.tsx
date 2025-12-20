/**
 * Title Approval Page (Admin)
 * Review and approve creator title submissions
 *
 * Design: Based on ContentList.tsx structure
 * Functionality: Same as DraftApproval.tsx
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@iconify/react';
import { useToast } from '@/hooks/use-toast';
import { draftService, type DraftStatus } from '@/services/draftService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function TitleApproval() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch all drafts with TanStack Query
  const { data: drafts = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['title-drafts'],
    queryFn: () => draftService.getAllDrafts(),
    staleTime: 30000, // 30 seconds
  });

  // Fetch stats separately
  const { data: stats = { total: 0, draft: 0, submitted: 0, approved: 0, rejected: 0 } } = useQuery({
    queryKey: ['title-draft-stats'],
    queryFn: () => draftService.getDraftStats(),
    staleTime: 30000,
  });

  // Filter drafts based on status and search query
  const filteredDrafts = useMemo(() => {
    let result = drafts;

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter(draft => draft.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(draft => {
        const title = getTitleFromDraftData(draft.draft_data).toLowerCase();
        const creatorName = (draft.user_creators?.full_name || '').toLowerCase();
        const creatorEmail = (draft.user_creators?.email || '').toLowerCase();
        const penName = (draft.user_creators?.pen_name || '').toLowerCase();

        return title.includes(query) ||
               creatorName.includes(query) ||
               creatorEmail.includes(query) ||
               penName.includes(query);
      });
    }

    return result;
  }, [drafts, statusFilter, searchQuery]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: DraftStatus) => {
    const statusConfig = {
      draft: { className: 'bg-gray-100 text-gray-700', label: 'Draft' },
      submitted: { className: 'bg-blue-100 text-blue-700', label: 'Submitted' },
      approved: { className: 'bg-green-100 text-green-700', label: 'Approved' },
      rejected: { className: 'bg-red-100 text-red-700', label: 'Rejected' }
    };

    const config = statusConfig[status];
    return (
      <Badge className={`${config.className} border-0`}>
        {config.label}
      </Badge>
    );
  };

  const handleRefresh = async () => {
    try {
      await refetch();
      toast({
        title: 'Refreshed',
        description: 'Data has been refreshed'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to refresh data',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Icon icon="solar:document-check-bold-duotone" className="w-6 h-6" />
                Title Approval
                <Badge className="bg-purple-500 text-white text-xs ml-2">ADMIN</Badge>
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Review and approve creator title submissions
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Icon
                icon="solar:magnifer-bold-duotone"
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
              />
              <Input
                placeholder="Search by title or creator..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status ({stats.total})</SelectItem>
                <SelectItem value="submitted">Submitted ({stats.submitted})</SelectItem>
                <SelectItem value="approved">Approved ({stats.approved})</SelectItem>
                <SelectItem value="rejected">Rejected ({stats.rejected})</SelectItem>
                <SelectItem value="draft">Draft ({stats.draft})</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefetching}
              className="border-gray-300 hover:bg-gray-100"
            >
              <Icon
                icon="solar:refresh-bold-duotone"
                className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading submissions...</div>
          ) : filteredDrafts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery || statusFilter !== 'all'
                ? 'No submissions match your filters'
                : 'No submissions found. Check back later!'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Creator</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDrafts.map((draft) => (
                    <TableRow key={draft.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium max-w-xs">
                        <div className="truncate" title={getTitleFromDraftData(draft.draft_data)}>
                          {getTitleFromDraftData(draft.draft_data)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{draft.user_creators?.full_name || 'Unknown'}</div>
                          <div className="text-xs text-gray-500">{draft.user_creators?.pen_name || '-'}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(draft.status)}</TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          Step {draft.current_step}/5
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(draft.submitted_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/title-approval/${draft.id}`)}
                          title="View details"
                        >
                          <Icon icon="solar:eye-bold-duotone" className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Stats Row */}
          {drafts.length > 0 && (
            <div className="mt-6 text-sm text-gray-500">
              Showing {filteredDrafts.length} of {drafts.length} submissions
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Extract title from draft_data object
 */
function getTitleFromDraftData(draftData: any): string {
  if (!draftData) return 'Untitled';

  return draftData.title_name_en ||
         draftData.title_name_kr ||
         draftData.titleNameEn ||
         draftData.titleNameKr ||
         'Untitled';
}
