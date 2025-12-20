/**
 * Title Approval Detail Page (Admin)
 * Review and approve/reject a single title submission
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Icon } from '@iconify/react';
import AdminLayout from "@/components/layout/AdminLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { draftService, type DraftWithCreator } from "@/services/draftService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function TitleApprovalDetail() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { draftId } = useParams<{ draftId: string }>();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<DraftWithCreator | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (draftId) {
      loadDraft(draftId);
    }
  }, [draftId]);

  const loadDraft = async (id: string) => {
    try {
      setLoading(true);
      const data = await draftService.getDraftById(id);
      setDraft(data);
    } catch (error) {
      console.error("Error loading draft:", error);
      toast({
        title: "Error",
        description: "Failed to load submission"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!draft || !user?.id) return;

    try {
      setApproving(true);
      await draftService.approveDraft(draft.id, user.id);

      toast({
        title: "Success",
        description: "Submission has been approved"
      });

      // Reload draft to show updated status
      await loadDraft(draft.id);
      setShowApproveDialog(false);
    } catch (error) {
      console.error("Error approving submission:", error);
      toast({
        title: "Error",
        description: "Failed to approve submission"
      });
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!draft || !user?.id) return;

    if (!rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a rejection reason"
      });
      return;
    }

    try {
      setRejecting(true);
      await draftService.rejectDraft(draft.id, user.id, rejectionReason);

      toast({
        title: "Success",
        description: "Submission has been rejected"
      });

      // Reload draft to show updated status
      await loadDraft(draft.id);
      setShowRejectDialog(false);
      setRejectionReason('');
    } catch (error) {
      console.error("Error rejecting submission:", error);
      toast({
        title: "Error",
        description: "Failed to reject submission"
      });
    } finally {
      setRejecting(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      draft: "bg-gray-100 text-gray-700",
      submitted: "bg-blue-100 text-blue-700",
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700"
    };

    return (
      <Badge className={`${statusColors[status as keyof typeof statusColors]} border-0`}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const renderFieldValue = (value: any): React.ReactNode => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-gray-400 italic">Not provided</span>;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-gray-400 italic">None</span>;
      }
      return (
        <div className="flex flex-wrap gap-2">
          {value.map((item, index) => (
            <Badge key={index} variant="outline" className="border-gray-300">
              {typeof item === 'object' ? JSON.stringify(item) : String(item)}
            </Badge>
          ))}
        </div>
      );
    }

    if (typeof value === 'object') {
      return (
        <pre className="bg-gray-50 p-3 rounded-lg text-sm overflow-x-auto">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    return String(value);
  };

  const renderSection = (title: string, fields: { label: string; value: any }[]) => {
    return (
      <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field, index) => (
            <div key={index} className="border-b border-gray-100 pb-3 last:border-0">
              <dt className="text-sm font-medium text-gray-600 mb-1">{field.label}</dt>
              <dd className="text-sm text-gray-900">{renderFieldValue(field.value)}</dd>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <PageContainer>
          <div className="text-center text-gray-600 py-8">Loading submission...</div>
        </PageContainer>
      </AdminLayout>
    );
  }

  if (!draft) {
    return (
      <AdminLayout>
        <PageContainer>
          <div className="text-center text-gray-600 py-8">Submission not found</div>
        </PageContainer>
      </AdminLayout>
    );
  }

  const draftData = draft.draft_data || {};
  const canApproveOrReject = draft.status === 'submitted';

  return (
    <AdminLayout>
      <PageContainer>
        <div className="space-y-6">
          {/* Back Button */}
          <Button
            onClick={() => navigate('/admin/title-approval')}
            variant="ghost"
            className="text-gray-600 hover:text-gray-800"
          >
            <Icon icon="solar:arrow-left-bold-duotone" className="h-4 w-4 mr-2" />
            Back to Title Approval
          </Button>

          {/* Header Card */}
          <Card className="bg-white border-gray-300 shadow-sm rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Icon icon="solar:document-text-bold-duotone" className="w-6 h-6 text-gray-700" />
                    <h1 className="text-2xl font-bold text-gray-900">
                      {draftData.title_name_en || draftData.title_name_kr || 'Untitled Submission'}
                    </h1>
                  </div>
                  {draftData.title_name_kr && draftData.title_name_en && (
                    <p className="text-lg text-gray-600 mb-4">
                      {draftData.title_name_kr}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-4">
                    {getStatusBadge(draft.status)}
                    <span className="text-sm text-gray-500">
                      Step {draft.current_step} of 5
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Creator Info */}
          <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="solar:user-bold-duotone" className="w-5 h-5" />
                Creator Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-600">Name: </span>
                <span className="text-sm text-gray-900">{draft.user_creators?.full_name || 'Unknown'}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Email: </span>
                <span className="text-sm text-gray-900">{draft.user_creators?.email || 'Unknown'}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Pen Name: </span>
                <span className="text-sm text-gray-900">{draft.user_creators?.pen_name || '-'}</span>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <Icon icon="solar:calendar-bold-duotone" className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-500">
                  Submitted: {formatDate(draft.submitted_at)} | Last Updated: {formatDate(draft.updated_at)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Step 1: Basic Information */}
          {renderSection("Step 1: Basic Information", [
            { label: "English Title", value: draftData.title_name_en },
            { label: "Korean Title", value: draftData.title_name_kr },
            { label: "Is Official English Title", value: draftData.is_official_english_title },
            { label: "Tagline (English)", value: draftData.tagline },
            { label: "Tagline (Korean)", value: draftData.tagline_kr },
            { label: "Synopsis", value: draftData.synopsis },
            { label: "Synopsis (Korean)", value: draftData.synopsis_kr },
            { label: "Genre", value: draftData.genre },
            { label: "Genre (Korean)", value: draftData.genre_kr },
            { label: "Content Format", value: draftData.content_format },
            { label: "Tone", value: draftData.tone },
            { label: "Audience", value: draftData.audience },
            { label: "Age Rating", value: draftData.age_rating }
          ])}

          {/* Step 2: Authors & Credits */}
          {renderSection("Step 2: Authors & Credits", [
            { label: "Story Author", value: draftData.story_author },
            { label: "Story Author (Korean)", value: draftData.story_author_kr },
            { label: "Art Author", value: draftData.art_author },
            { label: "Art Author (Korean)", value: draftData.art_author_kr },
            { label: "Original Author", value: draftData.original_author },
            { label: "Original Author (Korean)", value: draftData.original_author_kr },
            { label: "Script Title (Korean)", value: draftData.script_title_kr },
            { label: "Script Title (English)", value: draftData.script_title_en },
            { label: "Art Title (Korean)", value: draftData.art_title_kr },
            { label: "Art Title (English)", value: draftData.art_title_en },
            { label: "Underlying Novel (Korean)", value: draftData.underlying_novel_kr },
            { label: "Underlying Novel (English)", value: draftData.underlying_novel_en }
          ])}

          {/* Step 3: Story Details */}
          {renderSection("Step 3: Story Details", [
            { label: "Inspiration", value: draftData.inspiration },
            { label: "Important Issues", value: draftData.important_issues },
            { label: "Setting Description", value: draftData.setting_description },
            { label: "World Lore", value: draftData.world_lore },
            { label: "Supernatural Concepts", value: draftData.supernatural_concepts },
            { label: "Character Details", value: draftData.character_details },
            { label: "Story Structure", value: draftData.story_structure },
            { label: "Planned Ending", value: draftData.planned_ending },
            { label: "Narrative Arc", value: draftData.narrative_arc }
          ])}

          {/* Step 4: Rights & Business */}
          {renderSection("Step 4: Rights & Business", [
            { label: "Rights", value: draftData.rights },
            { label: "Rights Holder Name", value: draftData.rights_holder_name },
            { label: "Rights Holder Company", value: draftData.rights_holder_company },
            { label: "CP", value: draftData.cp },
            { label: "Keywords", value: draftData.keywords },
            { label: "Comparable Titles", value: draftData.comps },
            { label: "Perfect For", value: draftData.perfect_for }
          ])}

          {/* Step 5: Achievements & Metrics */}
          {renderSection("Step 5: Achievements & Metrics", [
            { label: "Awards", value: draftData.awards },
            { label: "Sales Records", value: draftData.sales_records },
            { label: "Merchandise Deals", value: draftData.merchandise_deals },
            { label: "Print Editions", value: draftData.print_editions },
            { label: "Print Edition Details", value: draftData.print_edition_details },
            { label: "Media Coverage", value: draftData.media_coverage },
            { label: "Celebrity Endorsements", value: draftData.celebrity_endorsements },
            { label: "Creator Achievements", value: draftData.creator_achievements },
            { label: "Views", value: draftData.views },
            { label: "Likes", value: draftData.likes },
            { label: "Rating", value: draftData.rating },
            { label: "Rating Count", value: draftData.rating_count },
            { label: "Chapters", value: draftData.chapters },
            { label: "Completed", value: draftData.completed }
          ])}

          {/* Additional Fields */}
          {renderSection("Additional Information", [
            { label: "Title Image URL", value: draftData.title_image },
            { label: "Title URL", value: draftData.title_url },
            { label: "Note", value: draftData.note },
            { label: "Note (Korean)", value: draftData.note_kr },
            { label: "Priority", value: draftData.priority },
            { label: "Verified", value: draftData.verified }
          ])}

          {/* Review Information (if already reviewed) */}
          {(draft.approved_at || draft.rejected_at || draft.rejection_reason) && (
            <Card className="bg-gray-50 border-gray-300 shadow-none rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Review Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {draft.approved_at && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Approved At: </span>
                    <span className="text-sm text-gray-900">{formatDate(draft.approved_at)}</span>
                  </div>
                )}
                {draft.rejected_at && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Rejected At: </span>
                    <span className="text-sm text-gray-900">{formatDate(draft.rejected_at)}</span>
                  </div>
                )}
                {draft.approved_by && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Reviewed By: </span>
                    <span className="text-sm text-gray-900">{draft.approved_by}</span>
                  </div>
                )}
                {draft.rejection_reason && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Rejection Reason: </span>
                    <p className="text-sm text-gray-900 mt-1">{draft.rejection_reason}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          {canApproveOrReject && (
            <div className="sticky bottom-0 bg-white border-t border-gray-300 p-6 -mx-6 -mb-6 mt-8 flex gap-4 justify-end">
              <Button
                onClick={() => setShowRejectDialog(true)}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                <Icon icon="solar:close-circle-bold-duotone" className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={() => setShowApproveDialog(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Icon icon="solar:check-circle-bold-duotone" className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </div>
          )}
        </div>

        {/* Approve Dialog */}
        <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Submission</DialogTitle>
              <DialogDescription>
                Are you sure you want to approve this submission? This will change the status to approved.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowApproveDialog(false)}
                disabled={approving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleApprove}
                disabled={approving}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {approving ? 'Approving...' : 'Approve'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Submission</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this submission. The creator will see this feedback.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Rejection Reason (Required)
              </label>
              <Textarea
                value={rejectionReason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectionReason(e.target.value)}
                placeholder="Explain why this submission is being rejected..."
                rows={4}
                className="w-full"
                required
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowRejectDialog(false)}
                disabled={rejecting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleReject}
                disabled={rejecting || !rejectionReason.trim()}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {rejecting ? 'Rejecting...' : 'Reject'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </AdminLayout>
  );
}
