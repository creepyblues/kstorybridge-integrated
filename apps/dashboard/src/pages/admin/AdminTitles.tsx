import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AdminLayout from '@/components/layout/AdminLayout';
import { TitleEditModal } from '@/components/admin/TitleEditModal';
import { AuditRunModal } from '@/components/admin/AuditRunModal';
import { LowPriorityBadge } from '@/components/admin/LowPriorityBadge';
import { useToast } from '@/hooks/use-toast';
import { titlesService, Title } from '@/services/titlesService';
import { Icon } from '@iconify/react';

type SortField = 'title' | 'genre' | 'priority' | 'views' | 'likes' | 'rights' | 'perfect_for' | 'verified';
type SortDirection = 'asc' | 'desc';

type AuditFilter =
  | 'all'
  | 'missing_url'
  | 'missing_image'
  | 'missing_comps'
  | 'missing_format_fit'
  | 'name_mismatch'
  | 'image_unreachable'
  | 'never_audited';

interface AuditSummary {
  total: number;
  missing_url: number;
  missing_image: number;
  missing_comps: number;
  missing_format_fit: number;
  mismatches: number;
  audited: number;
}

export default function AdminTitles() {
  const { toast } = useToast();
  const [titles, setTitles] = useState<Title[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  // Unused but kept for future delete functionality
  // const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTitleId, setSelectedTitleId] = useState<string | null>(null);
  const [auditModalOpen, setAuditModalOpen] = useState(false);

  // Audit state
  const [auditSummary, setAuditSummary] = useState<AuditSummary | null>(null);
  const [auditFilter, setAuditFilter] = useState<AuditFilter>('all');
  const [auditFilterIds, setAuditFilterIds] = useState<Set<string> | null>(null);

  useEffect(() => {
    fetchTitles();
    fetchAuditSummary();
  }, []);

  // Re-resolve the filter id list whenever the filter chip changes
  useEffect(() => {
    if (auditFilter === 'all') {
      setAuditFilterIds(null);
      return;
    }
    let cancelled = false;
    titlesService
      .getTitleIdsByAuditFilter(auditFilter)
      .then((ids) => {
        if (!cancelled) setAuditFilterIds(new Set(ids));
      })
      .catch((err) => {
        console.error('Failed to load filter ids:', err);
        if (!cancelled) setAuditFilterIds(new Set());
      });
    return () => {
      cancelled = true;
    };
  }, [auditFilter]);

  const fetchAuditSummary = async () => {
    try {
      const summary = await titlesService.getAuditSummary();
      setAuditSummary(summary);
    } catch (err) {
      console.error('Failed to load audit summary:', err);
    }
  };

  // Filter and sort titles
  const filteredTitles = useMemo(() => {
    let result = [...titles];

    // Apply audit filter (id set comes from titlesService)
    if (auditFilterIds) {
      result = result.filter((t) => auditFilterIds.has(t.title_id));
    }

    // Filter by search query
    if (searchQuery) {
      result = result.filter(
        (title) =>
          title.title_name_en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          title.title_name_kr?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          title.title_id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort if a sort field is selected
    if (sortField) {
      result.sort((a, b) => {
        let aVal: string | number | null = null;
        let bVal: string | number | null = null;

        switch (sortField) {
          case 'title':
            aVal = a.title_name_en || a.title_name_kr || '';
            bVal = b.title_name_en || b.title_name_kr || '';
            break;
          case 'genre':
            aVal = Array.isArray(a.genre) ? a.genre[0] || '' : String(a.genre || '');
            bVal = Array.isArray(b.genre) ? b.genre[0] || '' : String(b.genre || '');
            break;
          case 'priority':
            aVal = a.priority || '3';
            bVal = b.priority || '3';
            break;
          case 'views':
            aVal = a.views || 0;
            bVal = b.views || 0;
            break;
          case 'likes':
            aVal = a.likes || 0;
            bVal = b.likes || 0;
            break;
          case 'rights':
            aVal = Array.isArray(a.rights_available) ? a.rights_available.length : 0;
            bVal = Array.isArray(b.rights_available) ? b.rights_available.length : 0;
            break;
          case 'perfect_for':
            aVal = a.perfect_for || '';
            bVal = b.perfect_for || '';
            break;
          case 'verified':
            aVal = a.verified ? 1 : 0;
            bVal = b.verified ? 1 : 0;
            break;
        }

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortDirection === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        return sortDirection === 'asc'
          ? (aVal as number) - (bVal as number)
          : (bVal as number) - (aVal as number);
      });
    }

    return result;
  }, [titles, searchQuery, sortField, sortDirection, auditFilterIds]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <Icon icon="solar:alt-arrow-up-bold-duotone" className="h-3 w-3 ml-1 opacity-50" />;
    }
    return sortDirection === 'asc'
      ? <Icon icon="solar:arrow-up-bold-duotone" className="h-3 w-3 ml-1" />
      : <Icon icon="solar:arrow-down-bold-duotone" className="h-3 w-3 ml-1" />;
  };

  const fetchTitles = async () => {
    setLoading(true);
    try {
      // Admin view must show every title regardless of priority — buyers see
      // only priority H/M; admin uses this page to set priority in the first place.
      const data = await titlesService.getTitles({ includeAllPriorities: true });
      setTitles(data);
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

  const handleEdit = (titleId: string) => {
    setSelectedTitleId(titleId);
    setEditModalOpen(true);
  };

  const handlePriorityChange = async (titleId: string, newPriority: string) => {
    try {
      await titlesService.updateTitle(titleId, { priority: newPriority });

      // Update local state
      setTitles((prev) =>
        prev.map((t) =>
          t.title_id === titleId ? { ...t, priority: newPriority } : t
        )
      );

      toast({
        title: 'Success',
        description: 'Priority updated',
      });
    } catch (error: any) {
      console.error('Error updating priority:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update priority',
        variant: 'destructive',
      });
    }
  };

  const handleVerifiedChange = async (titleId: string, verified: boolean) => {
    try {
      await titlesService.updateTitle(titleId, { verified });

      // Update local state
      setTitles((prev) =>
        prev.map((t) =>
          t.title_id === titleId ? { ...t, verified } : t
        )
      );

      toast({
        title: 'Success',
        description: `Title ${verified ? 'verified' : 'unverified'}`,
      });
    } catch (error: any) {
      console.error('Error updating verified status:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update verified status',
        variant: 'destructive',
      });
    }
  };

  // Unused but kept for future delete functionality
  // const handleDelete = async (titleId: string, titleName: string) => {
  //   if (!confirm(`Are you sure you want to delete "${titleName}"? This action cannot be undone.`)) {
  //     return;
  //   }

  //   setDeletingId(titleId);
  //   try {
  //     await titlesService.deleteTitle(titleId);

  //     // Remove from local state
  //     setTitles((prev) => prev.filter((t) => t.title_id !== titleId));

  //     toast({
  //       title: 'Success',
  //       description: 'Title deleted successfully',
  //     });
  //   } catch (error: any) {
  //     console.error('Error deleting title:', error);
  //     toast({
  //       title: 'Error',
  //       description: error.message || 'Failed to delete title',
  //       variant: 'destructive',
  //     });
  //   } finally {
  //     setDeletingId(null);
  //   }
  // };

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
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="border-gray-300"
              onClick={() => setAuditModalOpen(true)}
            >
              <Icon icon="solar:shield-check-bold-duotone" className="h-4 w-4 mr-2" />
              Run Audit
            </Button>
            <Button className="bg-hanok-teal hover:bg-hanok-teal/90">
              <Icon icon="solar:add-circle-bold-duotone" className="h-4 w-4 mr-2" />
              Add New Title
            </Button>
          </div>
        </div>

        {/* Audit Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <AuditCard
            label="Missing source URL"
            count={auditSummary?.missing_url ?? 0}
            tone="amber"
            active={auditFilter === 'missing_url'}
            onClick={() =>
              setAuditFilter(auditFilter === 'missing_url' ? 'all' : 'missing_url')
            }
          />
          <AuditCard
            label="Missing comps"
            count={auditSummary?.missing_comps ?? 0}
            tone="amber"
            active={auditFilter === 'missing_comps'}
            onClick={() =>
              setAuditFilter(auditFilter === 'missing_comps' ? 'all' : 'missing_comps')
            }
          />
          <AuditCard
            label="Missing format-fit"
            count={auditSummary?.missing_format_fit ?? 0}
            tone="amber"
            active={auditFilter === 'missing_format_fit'}
            onClick={() =>
              setAuditFilter(
                auditFilter === 'missing_format_fit' ? 'all' : 'missing_format_fit',
              )
            }
          />
          <AuditCard
            label="Mismatches"
            count={auditSummary?.mismatches ?? 0}
            tone="red"
            active={auditFilter === 'name_mismatch' || auditFilter === 'image_unreachable'}
            onClick={() =>
              setAuditFilter(auditFilter === 'name_mismatch' ? 'all' : 'name_mismatch')
            }
            hint={
              auditSummary && auditSummary.audited > 0
                ? `from ${auditSummary.audited} audited`
                : 'run audit to populate'
            }
          />
        </div>

        {/* Search & Filters */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Icon icon="solar:magnifer-bold-duotone" className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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
                onClick={() => {
                  fetchTitles();
                  fetchAuditSummary();
                }}
                className="border-gray-300"
              >
                Refresh
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-500 mr-1">Audit filters:</span>
              <FilterChip active={auditFilter === 'all'} onClick={() => setAuditFilter('all')}>
                All
              </FilterChip>
              <FilterChip
                active={auditFilter === 'missing_url'}
                onClick={() => setAuditFilter('missing_url')}
              >
                Missing URL
              </FilterChip>
              <FilterChip
                active={auditFilter === 'missing_image'}
                onClick={() => setAuditFilter('missing_image')}
              >
                Missing image
              </FilterChip>
              <FilterChip
                active={auditFilter === 'missing_comps'}
                onClick={() => setAuditFilter('missing_comps')}
              >
                Missing comps
              </FilterChip>
              <FilterChip
                active={auditFilter === 'missing_format_fit'}
                onClick={() => setAuditFilter('missing_format_fit')}
              >
                Missing format-fit
              </FilterChip>
              <FilterChip
                active={auditFilter === 'name_mismatch'}
                onClick={() => setAuditFilter('name_mismatch')}
              >
                Name mismatch
              </FilterChip>
              <FilterChip
                active={auditFilter === 'image_unreachable'}
                onClick={() => setAuditFilter('image_unreachable')}
              >
                Image unreachable
              </FilterChip>
              <FilterChip
                active={auditFilter === 'never_audited'}
                onClick={() => setAuditFilter('never_audited')}
              >
                Never audited
              </FilterChip>
              {auditFilter !== 'all' && (
                <span className="text-xs text-gray-500 ml-2">
                  Showing {filteredTitles.length} of {titles.length}
                </span>
              )}
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
                <Icon icon="solar:refresh-circle-bold-duotone" className="h-8 w-8 animate-spin text-gray-400" />
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
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('title')}
                      >
                        <div className="flex items-center">
                          Title
                          <SortIcon field="title" />
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('genre')}
                      >
                        <div className="flex items-center">
                          Genre
                          <SortIcon field="genre" />
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('priority')}
                      >
                        <div className="flex items-center">
                          Priority
                          <SortIcon field="priority" />
                        </div>
                        <div className="text-[10px] font-normal normal-case text-gray-400 mt-0.5">
                          L hidden from dashboard
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('views')}
                      >
                        <div className="flex items-center">
                          Views
                          <SortIcon field="views" />
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('likes')}
                      >
                        <div className="flex items-center">
                          Likes
                          <SortIcon field="likes" />
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('rights')}
                      >
                        <div className="flex items-center">
                          Rights
                          <SortIcon field="rights" />
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('perfect_for')}
                      >
                        <div className="flex items-center">
                          Perfect For
                          <SortIcon field="perfect_for" />
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('verified')}
                      >
                        <div className="flex items-center">
                          Verified
                          <SortIcon field="verified" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTitles.map((title) => (
                      <tr key={title.title_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleEdit(title.title_id)}
                            className="flex items-center text-left hover:bg-gray-100 rounded-lg p-1 -m-1 transition-colors"
                          >
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
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-medium text-black hover:text-hanok-teal">
                                  {title.title_name_en || title.title_name_kr}
                                </div>
                                <LowPriorityBadge priority={title.priority} />
                              </div>
                              {title.title_name_kr && title.title_name_en && (
                                <div className="text-xs text-gray-500">
                                  {title.title_name_kr}
                                </div>
                              )}
                            </div>
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {title.genre && Array.isArray(title.genre) ? (
                              title.genre.slice(0, 3).map((g, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700"
                                >
                                  {g}
                                </span>
                              ))
                            ) : title.genre ? (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
                                {String(title.genre)}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="radio"
                                name={`priority-${title.title_id}`}
                                value="1"
                                checked={title.priority === '1'}
                                onChange={() => handlePriorityChange(title.title_id, '1')}
                                className="sr-only"
                              />
                              <span
                                className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                                  title.priority === '1'
                                    ? 'bg-red-500 text-white'
                                    : 'bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600'
                                }`}
                              >
                                H
                              </span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="radio"
                                name={`priority-${title.title_id}`}
                                value="2"
                                checked={title.priority === '2'}
                                onChange={() => handlePriorityChange(title.title_id, '2')}
                                className="sr-only"
                              />
                              <span
                                className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                                  title.priority === '2'
                                    ? 'bg-orange-500 text-white'
                                    : 'bg-gray-100 text-gray-500 hover:bg-orange-100 hover:text-orange-600'
                                }`}
                              >
                                M
                              </span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="radio"
                                name={`priority-${title.title_id}`}
                                value="3"
                                checked={title.priority === '3' || !title.priority}
                                onChange={() => handlePriorityChange(title.title_id, '3')}
                                className="sr-only"
                              />
                              <span
                                className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                                  title.priority === '3' || !title.priority
                                    ? 'bg-gray-500 text-white'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                              >
                                L
                              </span>
                            </label>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {title.views ? titlesService.formatNumber(title.views) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {title.likes ? titlesService.formatNumber(title.likes) : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {title.rights_available && Array.isArray(title.rights_available) && title.rights_available.length > 0 ? (
                              title.rights_available.slice(0, 3).map((right, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700"
                                >
                                  {right}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                            {title.rights_available && Array.isArray(title.rights_available) && title.rights_available.length > 3 && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-500">
                                +{title.rights_available.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 max-w-[200px] truncate" title={title.perfect_for || ''}>
                          {title.perfect_for || <span className="text-gray-400">-</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="radio"
                                name={`verified-${title.title_id}`}
                                value="yes"
                                checked={title.verified === true}
                                onChange={() => handleVerifiedChange(title.title_id, true)}
                                className="sr-only"
                              />
                              <span
                                className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                                  title.verified === true
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-600'
                                }`}
                              >
                                Yes
                              </span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="radio"
                                name={`verified-${title.title_id}`}
                                value="no"
                                checked={title.verified !== true}
                                onChange={() => handleVerifiedChange(title.title_id, false)}
                                className="sr-only"
                              />
                              <span
                                className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                                  title.verified !== true
                                    ? 'bg-gray-500 text-white'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                              >
                                No
                              </span>
                            </label>
                          </div>
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
      <TitleEditModal
        titleId={selectedTitleId}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSaved={fetchTitles}
      />

      {/* Audit Run Modal */}
      <AuditRunModal
        open={auditModalOpen}
        onOpenChange={setAuditModalOpen}
        titles={titles}
        onCompleted={() => {
          fetchAuditSummary();
          // If a mismatch filter is active, refresh the id list
          if (auditFilter !== 'all') {
            titlesService
              .getTitleIdsByAuditFilter(auditFilter)
              .then((ids) => setAuditFilterIds(new Set(ids)))
              .catch((err) => console.error(err));
          }
        }}
      />
    </AdminLayout>
  );
}

// =====================================================================
// Small presentational helpers (kept local to avoid file proliferation)
// =====================================================================

interface AuditCardProps {
  label: string;
  count: number;
  tone: 'amber' | 'red';
  active: boolean;
  onClick: () => void;
  hint?: string;
}

function AuditCard({ label, count, tone, active, onClick, hint }: AuditCardProps) {
  const toneRing =
    tone === 'red'
      ? 'ring-red-300'
      : count > 0
      ? 'ring-amber-300'
      : 'ring-gray-200';
  const toneText =
    tone === 'red' && count > 0
      ? 'text-red-600'
      : count > 0
      ? 'text-amber-600'
      : 'text-gray-500';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-2xl bg-transparent border border-gray-300 p-4 transition-all hover:bg-gray-50 ${
        active ? `ring-2 ${toneRing}` : ''
      }`}
    >
      <div className="text-sm text-gray-600">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${toneText}`}>{count}</div>
      {hint && <div className="text-xs text-gray-400 mt-1">{hint}</div>}
    </button>
  );
}

interface FilterChipProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function FilterChip({ active, onClick, children }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 text-xs rounded-full border transition-colors ${
        active
          ? 'bg-hanok-teal text-white border-hanok-teal'
          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
      }`}
    >
      {children}
    </button>
  );
}
