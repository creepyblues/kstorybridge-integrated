import React, { useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from "@kstorybridge/ui";
import { ThumbsUp, ThumbsDown, MessageSquare, Star } from 'lucide-react';
import { useToast } from "@kstorybridge/ui";
import { chatHistoryService } from '@/services/chatHistoryService';

interface ChatbotFeedbackProps {
  messageId: string;
  userPrompt: string;
  aiResponse: string;
  recommendedTitles: any[];
  onFeedbackSubmitted?: () => void;
}

interface FeedbackData {
  overall_rating: number;
  response_quality: 'excellent' | 'good' | 'fair' | 'poor';
  title_relevance: 'excellent' | 'good' | 'fair' | 'poor';
  title_feedback: {
    title_id: string;
    title_name: string;
    is_relevant: boolean;
    relevance_score: number;
    feedback_note?: string;
  }[];
  general_feedback?: string;
  suggested_improvements?: string;
}

export const ChatbotFeedback: React.FC<ChatbotFeedbackProps> = ({
  messageId,
  userPrompt,
  aiResponse,
  recommendedTitles,
  onFeedbackSubmitted
}) => {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackData>({
    overall_rating: 3, // Default to 3 instead of 0 (which violates DB constraint)
    response_quality: 'good',
    title_relevance: 'good',
    title_feedback: recommendedTitles.map(title => ({
      title_id: title.title_id,
      title_name: title.title_name_en || title.title_name_kr || 'Unknown',
      is_relevant: true,
      relevance_score: 3
    })),
    general_feedback: '',
    suggested_improvements: ''
  });

  const handleOverallRating = (rating: number) => {
    setFeedback(prev => ({ ...prev, overall_rating: rating }));
  };

  const handleTitleFeedback = (titleId: string, updates: Partial<FeedbackData['title_feedback'][0]>) => {
    setFeedback(prev => ({
      ...prev,
      title_feedback: prev.title_feedback.map(tf => 
        tf.title_id === titleId ? { ...tf, ...updates } : tf
      )
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Validate rating before submitting
      const validatedFeedback = {
        ...feedback,
        overall_rating: Math.max(1, Math.min(5, feedback.overall_rating)), // Ensure 1-5 range
        title_feedback: feedback.title_feedback.map(tf => ({
          ...tf,
          relevance_score: Math.max(1, Math.min(5, tf.relevance_score)) // Ensure 1-5 range
        }))
      };

      const result = await chatHistoryService.submitMessageFeedback(messageId, validatedFeedback);
      if (result) {
        toast({
          title: "Feedback Submitted",
          description: "Thank you for helping us improve the chatbot!",
          variant: "default"
        });
        setIsExpanded(false);
        onFeedbackSubmitted?.();
      } else {
        throw new Error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Submission Failed",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const QuickFeedback = () => (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-600">Was this helpful?</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={async () => {
          // Set positive feedback and submit immediately
          const positiveFeedback = {
            ...feedback,
            overall_rating: 4,
            response_quality: 'good' as const,
            title_relevance: 'good' as const
          };
          setFeedback(positiveFeedback);
          
          // Submit after state update
          setTimeout(async () => {
            setIsSubmitting(true);
            try {
              const result = await chatHistoryService.submitMessageFeedback(messageId, positiveFeedback);
              if (result) {
                toast({
                  title: "Feedback Submitted",
                  description: "Thank you for the positive feedback!",
                  variant: "default"
                });
                onFeedbackSubmitted?.();
              }
            } catch (error) {
              console.error('Error submitting quick feedback:', error);
              toast({
                title: "Submission Failed",
                description: "Please try again later.",
                variant: "destructive"
              });
            } finally {
              setIsSubmitting(false);
            }
          }, 100);
        }}
        className="text-green-600 hover:text-green-700 hover:bg-green-50"
      >
        <ThumbsUp className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(true)}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <ThumbsDown className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(true)}
        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
      >
        <MessageSquare className="w-4 h-4" />
        Detailed
      </Button>
    </div>
  );

  const DetailedFeedback = () => (
    <Card className="mt-3 border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          Detailed Feedback
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Rating */}
        <div>
          <label className="block text-sm font-medium mb-2">Overall Rating</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleOverallRating(star)}
                className={`p-1 ${star <= feedback.overall_rating ? 'text-yellow-500' : 'text-gray-300'} hover:text-yellow-500 transition-colors`}
              >
                <Star className="w-6 h-6" fill={star <= feedback.overall_rating ? 'currentColor' : 'none'} />
              </button>
            ))}
          </div>
        </div>

        {/* Response Quality */}
        <div>
          <label className="block text-sm font-medium mb-2">Response Quality</label>
          <div className="grid grid-cols-4 gap-2">
            {['excellent', 'good', 'fair', 'poor'].map((quality) => (
              <Button
                key={quality}
                variant={feedback.response_quality === quality ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFeedback(prev => ({ ...prev, response_quality: quality as any }))}
                className="capitalize"
              >
                {quality}
              </Button>
            ))}
          </div>
        </div>

        {/* Title Relevance */}
        <div>
          <label className="block text-sm font-medium mb-2">Title Recommendations Relevance</label>
          <div className="grid grid-cols-4 gap-2">
            {['excellent', 'good', 'fair', 'poor'].map((relevance) => (
              <Button
                key={relevance}
                variant={feedback.title_relevance === relevance ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFeedback(prev => ({ ...prev, title_relevance: relevance as any }))}
                className="capitalize"
              >
                {relevance}
              </Button>
            ))}
          </div>
        </div>

        {/* Individual Title Feedback */}
        {recommendedTitles.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-3">Individual Title Feedback</label>
            <div className="space-y-3">
              {feedback.title_feedback.map((titleFeedback, index) => (
                <div key={titleFeedback.title_id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm truncate max-w-xs" title={titleFeedback.title_name}>
                      {titleFeedback.title_name}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={titleFeedback.is_relevant ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleTitleFeedback(titleFeedback.title_id, { is_relevant: true, relevance_score: 4 })}
                        className="text-xs"
                      >
                        Relevant
                      </Button>
                      <Button
                        variant={!titleFeedback.is_relevant ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleTitleFeedback(titleFeedback.title_id, { is_relevant: false, relevance_score: 1 })}
                        className="text-xs"
                      >
                        Not Relevant
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">Score:</span>
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        onClick={() => handleTitleFeedback(titleFeedback.title_id, { relevance_score: score })}
                        className={`w-4 h-4 rounded-full border-2 ${score <= titleFeedback.relevance_score 
                          ? 'bg-blue-500 border-blue-500' 
                          : 'border-gray-300'} hover:border-blue-400 transition-colors`}
                      />
                    ))}
                  </div>
                  <textarea
                    placeholder="Optional feedback for this title..."
                    className="w-full mt-2 p-2 text-xs border rounded resize-none"
                    rows={2}
                    value={titleFeedback.feedback_note || ''}
                    onChange={(e) => handleTitleFeedback(titleFeedback.title_id, { feedback_note: e.target.value })}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* General Feedback */}
        <div>
          <label className="block text-sm font-medium mb-2">General Feedback</label>
          <textarea
            placeholder="What did you like or dislike about this response?"
            className="w-full p-3 border rounded-md resize-none"
            rows={3}
            value={feedback.general_feedback}
            onChange={(e) => setFeedback(prev => ({ ...prev, general_feedback: e.target.value }))}
          />
        </div>

        {/* Suggested Improvements */}
        <div>
          <label className="block text-sm font-medium mb-2">Suggested Improvements</label>
          <textarea
            placeholder="How could we improve this response or recommendation?"
            className="w-full p-3 border rounded-md resize-none"
            rows={3}
            value={feedback.suggested_improvements}
            onChange={(e) => setFeedback(prev => ({ ...prev, suggested_improvements: e.target.value }))}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-3">
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setIsExpanded(false)}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="mt-2">
      {!isExpanded ? <QuickFeedback /> : <DetailedFeedback />}
    </div>
  );
};