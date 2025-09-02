import React, { useState } from 'react';
import { Button } from "@kstorybridge/ui";
import { ThumbsUp, ThumbsDown, Star, MessageSquare, X } from 'lucide-react';
import { useToast } from "@kstorybridge/ui";
import { chatHistoryService } from '@/services/chatHistoryService';

interface TitleFeedbackProps {
  title: any;
  messageId: string;
  userPrompt: string;
  onFeedbackSubmitted?: () => void;
}

interface TitleFeedbackData {
  title_id: string;
  title_name: string;
  overall_rating: number;
  relevance_rating: number;
  is_relevant: boolean;
  feedback_reason: string;
  improvement_suggestions: string;
}

export const TitleFeedback: React.FC<TitleFeedbackProps> = ({
  title,
  messageId,
  userPrompt,
  onFeedbackSubmitted
}) => {
  const { toast } = useToast();
  const [showFeedback, setShowFeedback] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<TitleFeedbackData>({
    title_id: title.title_id,
    title_name: title.title_name_en || title.title_name_kr || 'Unknown',
    overall_rating: 3,
    relevance_rating: 3,
    is_relevant: true,
    feedback_reason: '',
    improvement_suggestions: ''
  });

  const submitFeedback = async (feedbackData: TitleFeedbackData) => {
    setIsSubmitting(true);
    try {
      // Create a standardized feedback object for the database
      const standardizedFeedback = {
        overall_rating: feedbackData.overall_rating,
        response_quality: feedbackData.overall_rating >= 4 ? 'good' : feedbackData.overall_rating >= 3 ? 'fair' : 'poor',
        title_relevance: feedbackData.relevance_rating >= 4 ? 'excellent' : feedbackData.relevance_rating >= 3 ? 'good' : 'fair',
        title_feedback: [feedbackData], // Single title feedback
        general_feedback: feedbackData.feedback_reason,
        suggested_improvements: feedbackData.improvement_suggestions,
        user_prompt: userPrompt
      };

      const result = await chatHistoryService.submitMessageFeedback(messageId, standardizedFeedback);
      if (result) {
        toast({
          title: "Feedback Submitted",
          description: `Thank you for rating "${feedbackData.title_name}"!`,
          variant: "default"
        });
        setShowFeedback(false);
        onFeedbackSubmitted?.();
      } else {
        throw new Error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting title feedback:', error);
      toast({
        title: "Submission Failed",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFeedback = async (isPositive: boolean) => {
    const quickFeedback = {
      ...feedback,
      overall_rating: isPositive ? 4 : 2,
      relevance_rating: isPositive ? 4 : 2,
      is_relevant: isPositive,
      feedback_reason: isPositive ? 'Quick positive feedback' : 'Quick negative feedback'
    };
    
    await submitFeedback(quickFeedback);
  };

  const handleDetailedSubmit = async () => {
    await submitFeedback(feedback);
  };

  const QuickFeedbackButtons = () => (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleQuickFeedback(true)}
        disabled={isSubmitting}
        className="h-6 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
        title="This title is relevant and helpful"
      >
        <ThumbsUp className="w-3 h-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleQuickFeedback(false)}
        disabled={isSubmitting}
        className="h-6 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
        title="This title is not relevant"
      >
        <ThumbsDown className="w-3 h-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowFeedback(true)}
        disabled={isSubmitting}
        className="h-6 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        title="Detailed feedback"
      >
        <MessageSquare className="w-3 h-3" />
      </Button>
    </div>
  );

  const DetailedFeedbackForm = () => (
    <div className="absolute top-0 left-0 right-0 bg-white border-2 border-blue-200 rounded-lg p-4 shadow-lg z-10">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-medium text-sm">Feedback for "{feedback.title_name}"</h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFeedback(false)}
          className="h-6 w-6 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-3">
        {/* Overall Rating */}
        <div>
          <label className="block text-xs font-medium mb-1">Overall Rating</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setFeedback(prev => ({ ...prev, overall_rating: star }))}
                className={`p-1 ${star <= feedback.overall_rating ? 'text-yellow-500' : 'text-gray-300'} hover:text-yellow-500 transition-colors`}
              >
                <Star className="w-4 h-4" fill={star <= feedback.overall_rating ? 'currentColor' : 'none'} />
              </button>
            ))}
          </div>
        </div>

        {/* Relevance Rating */}
        <div>
          <label className="block text-xs font-medium mb-1">Relevance to Your Query</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setFeedback(prev => ({ ...prev, relevance_rating: star }))}
                className={`p-1 ${star <= feedback.relevance_rating ? 'text-blue-500' : 'text-gray-300'} hover:text-blue-500 transition-colors`}
              >
                <Star className="w-4 h-4" fill={star <= feedback.relevance_rating ? 'currentColor' : 'none'} />
              </button>
            ))}
          </div>
        </div>

        {/* Relevance Toggle */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium">Is this title relevant?</label>
          <Button
            variant={feedback.is_relevant ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFeedback(prev => ({ ...prev, is_relevant: true }))}
            className="h-6 text-xs"
          >
            Yes
          </Button>
          <Button
            variant={!feedback.is_relevant ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFeedback(prev => ({ ...prev, is_relevant: false }))}
            className="h-6 text-xs"
          >
            No
          </Button>
        </div>

        {/* Feedback Reason */}
        <div>
          <label className="block text-xs font-medium mb-1">Why did you rate it this way?</label>
          <textarea
            placeholder="What makes this title good or bad for your query?"
            className="w-full p-2 text-xs border rounded resize-none"
            rows={2}
            value={feedback.feedback_reason}
            onChange={(e) => setFeedback(prev => ({ ...prev, feedback_reason: e.target.value }))}
          />
        </div>

        {/* Improvement Suggestions */}
        <div>
          <label className="block text-xs font-medium mb-1">Suggestions for Better Recommendations</label>
          <textarea
            placeholder="What would make title recommendations better?"
            className="w-full p-2 text-xs border rounded resize-none"
            rows={2}
            value={feedback.improvement_suggestions}
            onChange={(e) => setFeedback(prev => ({ ...prev, improvement_suggestions: e.target.value }))}
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-2 pt-2">
          <Button 
            onClick={handleDetailedSubmit} 
            disabled={isSubmitting}
            size="sm"
            className="flex-1 text-xs"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowFeedback(false)}
            size="sm"
            className="flex-1 text-xs"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative group">
      <QuickFeedbackButtons />
      {showFeedback && <DetailedFeedbackForm />}
    </div>
  );
};