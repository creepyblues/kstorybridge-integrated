import React, { useState } from 'react';
import { Button } from "@kstorybridge/ui";
import { ThumbsUp, ThumbsDown, Star, MessageSquare, X } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { chatHistoryService } from '@/services/chatHistoryService';

interface TitleFeedbackProps {
  title: { title_id: string; title_name_en: string; title_name_kr?: string };
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
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 md:opacity-100 transition-opacity">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleQuickFeedback(true)}
        disabled={isSubmitting}
        className="h-8 px-3 text-green-600 hover:text-green-700 hover:bg-green-50 border border-green-200 hover:border-green-300 transition-all"
        title="This title is relevant and helpful"
      >
        <ThumbsUp className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleQuickFeedback(false)}
        disabled={isSubmitting}
        className="h-8 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 hover:border-red-300 transition-all"
        title="This title is not relevant"
      >
        <ThumbsDown className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowFeedback(true)}
        disabled={isSubmitting}
        className="h-8 px-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-200 hover:border-blue-300 transition-all"
        title="Detailed feedback"
      >
        <MessageSquare className="w-4 h-4" />
      </Button>
    </div>
  );

  const DetailedFeedbackForm = () => (
    <>
      {/* Backdrop for mobile */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
        onClick={() => setShowFeedback(false)}
      />
      
      {/* Feedback Form */}
      <div className="fixed md:absolute 
                      top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                      md:top-auto md:left-auto md:right-0 md:bottom-full md:mb-2 md:transform-none
                      w-[90vw] max-w-md md:w-96
                      max-h-[90vh] md:max-h-[80vh]
                      bg-white border-2 border-blue-200 rounded-lg p-4 shadow-xl z-50 overflow-hidden">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-semibold text-sm text-gray-800">
            Feedback for "{feedback.title_name}"
          </h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFeedback(false)}
            className="h-7 w-7 p-0 hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Overall Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Overall Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setFeedback(prev => ({ ...prev, overall_rating: star }))}
                  className={`p-1.5 rounded-md transition-all ${
                    star <= feedback.overall_rating 
                      ? 'text-yellow-500 bg-yellow-50' 
                      : 'text-gray-300 hover:text-yellow-400'
                  }`}
                  type="button"
                >
                  <Star className="w-5 h-5" fill={star <= feedback.overall_rating ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          </div>

          {/* Relevance Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Relevance to Your Query</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setFeedback(prev => ({ ...prev, relevance_rating: star }))}
                  className={`p-1.5 rounded-md transition-all ${
                    star <= feedback.relevance_rating 
                      ? 'text-blue-500 bg-blue-50' 
                      : 'text-gray-300 hover:text-blue-400'
                  }`}
                  type="button"
                >
                  <Star className="w-5 h-5" fill={star <= feedback.relevance_rating ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          </div>

          {/* Relevance Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Is this title relevant?</label>
            <div className="flex gap-3">
              <Button
                variant={feedback.is_relevant ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFeedback(prev => ({ ...prev, is_relevant: true }))}
                className={`px-6 py-2 font-medium transition-all ${
                  feedback.is_relevant 
                    ? 'bg-green-600 text-white border-green-600 shadow-md hover:bg-green-700' 
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-green-500 hover:text-green-600'
                }`}
                type="button"
              >
                Yes
              </Button>
              <Button
                variant={!feedback.is_relevant ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFeedback(prev => ({ ...prev, is_relevant: false }))}
                className={`px-6 py-2 font-medium transition-all ${
                  !feedback.is_relevant 
                    ? 'bg-red-600 text-white border-red-600 shadow-md hover:bg-red-700' 
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-red-500 hover:text-red-600'
                }`}
                type="button"
              >
                No
              </Button>
            </div>
          </div>

          {/* Feedback Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Why did you rate it this way?
            </label>
            <textarea
              placeholder="What makes this title good or bad for your query?"
              className="w-full p-3 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
              value={feedback.feedback_reason}
              onChange={(e) => setFeedback(prev => ({ ...prev, feedback_reason: e.target.value }))}
            />
          </div>

          {/* Improvement Suggestions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Suggestions for Better Recommendations
            </label>
            <textarea
              placeholder="What would make title recommendations better?"
              className="w-full p-3 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
              value={feedback.improvement_suggestions}
              onChange={(e) => setFeedback(prev => ({ ...prev, improvement_suggestions: e.target.value }))}
            />
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4 border-t mt-4">
          <Button 
            onClick={handleDetailedSubmit} 
            disabled={isSubmitting}
            className="flex-1 py-2"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowFeedback(false)}
            className="flex-1 py-2"
          >
            Cancel
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <div className="relative group">
      <QuickFeedbackButtons />
      {showFeedback && <DetailedFeedbackForm />}
    </div>
  );
};