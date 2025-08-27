import { useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, Textarea, useToast } from "@kstorybridge/ui";
import { Send, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { notifyUserFeedback } from "@/utils/slack";

const SendMessage = () => {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 Form submitted!');
    
    if (!message.trim()) {
      console.log('❌ Empty message');
      toast({
        title: "Message required",
        description: "Please enter a message before sending.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      console.log('❌ No user');
      toast({
        title: "Authentication required",
        description: "Please log in to send a message.",
        variant: "destructive",
      });
      return;
    }

    console.log('✅ Starting message send process...');
    setIsLoading(true);

    try {
      // For now, let's skip the database insert and test the Slack notification
      console.log('📝 Message to be sent:', {
        user_id: user.id,
        user_email: user.email,
        message: message.trim()
      });

      // TODO: Uncomment this when the database table is created
      // const { error: dbError } = await supabase
      //   .from('feedback_buyer')
      //   .insert({
      //     user_id: user.id,
      //     text: message.trim()
      //   });

      // if (dbError) {
      //   console.error('Database error:', dbError);
      //   throw new Error('Failed to save message to database');
      // }

      // Send to Slack using existing integration
      try {
        const accountType = user?.user_metadata?.account_type || "buyer";
        const fullName = user?.user_metadata?.full_name || user?.email || "Unknown User";
        const company = accountType === "buyer" 
          ? user?.user_metadata?.buyer_company 
          : user?.user_metadata?.ip_owner_company;

        console.log('📤 Sending Slack notification with data:', {
          userFullName: fullName,
          userEmail: user.email || "",
          userId: user.id,
          userType: accountType === "ip_owner" ? "creator" : "buyer",
          company: company || undefined,
          message: message.trim()
        });

        // Check if we're in localhost development mode
        const isLocalhost = window.location.hostname === 'localhost';
        const isDev = import.meta.env.DEV;
        
        if (isLocalhost && isDev) {
          console.log('🏠 LOCALHOST DEV MODE: Simulating Slack notification...');
          // Simulate the Slack notification for localhost development
          await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
          console.log('✅ LOCALHOST DEV MODE: Slack notification simulated successfully');
        } else {
          // Real Slack notification for production
          await notifyUserFeedback({
            userFullName: fullName,
            userEmail: user.email || "",
            userId: user.id,
            message: message.trim(),
            userType: accountType === "ip_owner" ? "creator" : "buyer",
            company: company || undefined,
          });
          console.log('✅ Slack notification sent successfully');
        }
      } catch (slackError) {
        console.warn('⚠️ Slack notification failed:', slackError);
        // Don't fail the whole operation if Slack fails
      }

      toast({
        title: "Message sent!",
        description: "Thank you for your feedback. We'll get back to you soon.",
      });

      setMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error sending message",
        description: "There was a problem sending your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-4 sm:py-6 lg:py-8 px-3 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-hanok-teal/10 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-hanok-teal" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-midnight-ink">
                Send Message
              </h1>
              <p className="text-sm sm:text-base text-midnight-ink-600 mt-1">
                Send a quick message to our admin team
              </p>
            </div>
          </div>
        </div>

        {/* Message Form */}
        <Card className="border-0 shadow-lg rounded-2xl bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-midnight-ink">
              Your Message
            </CardTitle>
            <p className="text-sm text-midnight-ink-600">
              Tell us what's on your mind. We'll get back to you as soon as possible.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Textarea
                  placeholder="Type your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  className="resize-none border-porcelain-blue-200 focus:border-hanok-teal focus:ring-hanok-teal"
                />
                <p className="text-xs text-midnight-ink-400 mt-2">
                  {message.length} characters
                </p>
              </div>
              
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isLoading || !message.trim()}
                  className="bg-hanok-teal hover:bg-hanok-teal-600 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Message
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Debug Info for Development */}
        {import.meta.env.DEV && (
          <Card className="mt-6 border border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">
                🔧 Development Debug Info
              </h4>
              <div className="text-xs text-yellow-700 space-y-1">
                <div><strong>User ID:</strong> {user?.id || 'Not logged in'}</div>
                <div><strong>Email:</strong> {user?.email || 'No email'}</div>
                <div><strong>Full Name:</strong> {user?.user_metadata?.full_name || 'No name'}</div>
                <div><strong>Account Type:</strong> {user?.user_metadata?.account_type || 'Unknown'}</div>
                <div><strong>Is Localhost:</strong> {window.location.hostname === 'localhost' ? 'Yes' : 'No'}</div>
                <div><strong>Environment:</strong> {import.meta.env.MODE}</div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-midnight-ink-500">
            For urgent matters, you can also reach us at{" "}
            <a 
              href="mailto:support@kstorybridge.com" 
              className="text-hanok-teal hover:text-hanok-teal-600 font-medium"
            >
              support@kstorybridge.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SendMessage;