import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, Eye, FileEdit } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { draftService, type DraftWithCreator, type DraftStatus } from "@/services/draftService";
// import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type FilterTab = 'all' | 'draft' | 'submitted' | 'approved' | 'rejected';

export default function AdminDraftApproval() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<DraftWithCreator[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    submitted: 0,
    approved: 0,
    rejected: 0
  });

  useEffect(() => {
    loadDrafts();
    loadStats();
  }, [activeFilter]);

  const loadDrafts = async () => {
    try {
      setLoading(true);

      let data: DraftWithCreator[];
      if (activeFilter === 'all') {
        data = await draftService.getAllDrafts();
      } else {
        data = await draftService.getAllDrafts(activeFilter as DraftStatus);
      }

      setDrafts(data);
    } catch (error: any) {
      console.error('Error loading drafts:', error);

      // Provide more helpful error message for RLS issues
      const errorMessage = error?.message?.includes('Permission denied')
        ? 'Admin access not configured. Please apply the admin RLS policy migration.'
        : error?.message?.includes('policy')
        ? 'Database permission error. Contact system administrator.'
        : 'Failed to load drafts. Please try again.';

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await draftService.getDraftStats();
      setStats(statsData);
    } catch (error: any) {
      console.error('Error loading stats:', error);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: DraftStatus) => {
    const statusColors = {
      draft: "bg-gray-100 text-gray-700",
      submitted: "bg-blue-100 text-blue-700",
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700"
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[status]}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const getTitleFromDraftData = (draftData: any): string => {
    if (!draftData) return 'Untitled';

    // Try different possible field names for title
    return draftData.title_name_en ||
           draftData.title_name_kr ||
           draftData.titleNameEn ||
           draftData.titleNameKr ||
           'Untitled';
  };

  const handleDraftClick = (draftId: string) => {
    navigate(`/admin/drafts/${draftId}`);
  };

  const FilterTab = ({ filter, label, count }: { filter: FilterTab; label: string; count?: number }) => {
    const isActive = activeFilter === filter;
    return (
      <button
        onClick={() => setActiveFilter(filter)}
        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
          isActive
            ? 'bg-gray-900 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        {label}
        {count !== undefined && (
          <span className={`ml-2 ${isActive ? 'text-white' : 'text-gray-500'}`}>
            ({count})
          </span>
        )}
      </button>
    );
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 w-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <FileEdit className="w-6 h-6 text-gray-900" />
              <h1 className="text-2xl font-bold text-black">Draft Approval</h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-purple-500 text-white">
                ADMIN ONLY
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Review and approve creator title submissions
            </p>
          </div>
          <Button
            onClick={loadDrafts}
            variant="outline"
            disabled={loading}
            className="border-gray-300 hover:bg-gray-100"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2">
          <FilterTab filter="all" label="All" count={stats.total} />
          <FilterTab filter="draft" label="Draft" count={stats.draft} />
          <FilterTab filter="submitted" label="Submitted" count={stats.submitted} />
          <FilterTab filter="approved" label="Approved" count={stats.approved} />
          <FilterTab filter="rejected" label="Rejected" count={stats.rejected} />
        </div>

        {/* Drafts Table */}
        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
          <CardHeader>
            <CardTitle>
              {activeFilter === 'all' ? 'All Drafts' :
               activeFilter === 'draft' ? 'Draft Submissions' :
               activeFilter === 'submitted' ? 'Submitted Drafts' :
               activeFilter === 'approved' ? 'Approved Drafts' :
               'Rejected Drafts'}
            </CardTitle>
          </CardHeader>
          <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : drafts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No drafts found for this filter
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden lg:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Creator</TableHead>
                          <TableHead>Pen Name</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Step</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {drafts.map((draft) => (
                          <TableRow
                            key={draft.id}
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => handleDraftClick(draft.id)}
                          >
                            <TableCell className="font-medium">
                              <div>
                                <div>{draft.user_creators?.full_name || 'Unknown'}</div>
                                <div className="text-xs text-gray-500">
                                  {draft.user_creators?.email}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {draft.user_creators?.pen_name || '-'}
                            </TableCell>
                            <TableCell>
                              {getTitleFromDraftData(draft.draft_data)}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(draft.status)}
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-gray-600">
                                {draft.current_step} / 5
                              </span>
                            </TableCell>
                            <TableCell>
                              {formatDate(draft.submitted_at)}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation();
                                  handleDraftClick(draft.id);
                                }}
                                className="border-gray-300 hover:bg-gray-100"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="lg:hidden space-y-4">
                    {drafts.map((draft) => (
                      <Card
                        key={draft.id}
                        className="bg-white border-gray-300 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleDraftClick(draft.id)}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="font-semibold text-gray-900">
                                  {draft.user_creators?.full_name || 'Unknown'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {draft.user_creators?.email}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  {draft.user_creators?.pen_name || '-'}
                                </div>
                              </div>
                              {getStatusBadge(draft.status)}
                            </div>

                            <div>
                              <div className="text-sm font-medium text-gray-700">
                                Title
                              </div>
                              <div className="text-sm text-gray-900">
                                {getTitleFromDraftData(draft.draft_data)}
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                              <div>
                                <span className="text-gray-600">Step: </span>
                                <span className="font-medium">{draft.current_step} / 5</span>
                              </div>
                              <div className="text-gray-500">
                                {formatDate(draft.submitted_at)}
                              </div>
                            </div>

                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full border-gray-300 hover:bg-gray-100"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                handleDraftClick(draft.id);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
      </div>
    </AdminLayout>
  );
}
