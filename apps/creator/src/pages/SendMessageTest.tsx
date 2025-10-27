import { useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, Textarea } from "@kstorybridge/ui";
import { useToast } from "@/hooks/use-toast";import { Send, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { sendSlackNotification } from "@/utils/slack";

const SendMessageTest = () => {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Mock user for testing
  const mockUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    user_metadata: {
      full_name: 'Test User',
      account_type: 'buyer',
      buyer_company: 'Test Company'
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 TEST MODE: Form submitted!');
    
    if (!message.trim()) {
      console.log('❌ Empty message');
      toast({
        title: "Message required",
        description: "Please enter a message before sending.",
        variant: "destructive",
      });
      return;
    }

    console.log('✅ TEST MODE: Starting message send process...');
    setIsLoading(true);

    try {
      console.log('📝 TEST MODE: Message to be sent:', {
        user_id: mockUser.id,
        user_email: mockUser.email,
        message: message.trim()
      });

      // Try to insert into database
      console.log('💾 TEST MODE: Attempting to save to database...');
      try {
        const { data: dbData, error: dbError } = await supabase
          .from('feedback_buyer')
          .insert({
            user_id: null, // Use null for anonymous test
            text: `[TEST MODE] ${message.trim()}`
          })
          .select();

        if (dbError) {
          console.error('❌ Database error:', dbError);
          console.log('📌 Note: The feedback_buyer table may not exist yet.');
          console.log('📌 To create it, run the SQL in: setup-feedback-table.sql');
        } else {
          console.log('✅ Successfully saved to database:', dbData);
        }
      } catch (dbErr) {
        console.error('❌ Database operation failed:', dbErr);
      }

      // Try to send Slack notification
      console.log('📤 TEST MODE: Attempting to send Slack notification...');
      try {
        await sendSlackNotification({
          event: 'Test Message from Dashboard',
          userType: 'buyer',
          fullName: 'Test User (Local Test)',
          email: 'test@localhost',
          company: 'Local Test Environment',
          additionalInfo: {
            message: message.trim(),
            environment: 'localhost-test',
            timestamp: new Date().toISOString()
          }
        });
        console.log('✅ Slack notification sent successfully!');
      } catch (slackError) {
        console.error('❌ Slack notification failed:', slackError);
        console.log('📌 Note: Slack may be blocked in localhost or Edge Function not deployed');
      }
      
      console.log('✅ TEST MODE: Process completed!');
      
      toast({
        title: "Test Message Sent!",
        description: "Your test message was processed successfully.",
      });

      setMessage("");
    } catch (error) {
      console.error('❌ TEST MODE: Error:', error);
      toast({
        title: "Test Error",
        description: "There was a problem with the test.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-4 sm:py-6 lg:py-8 px-3 sm:px-6 lg:px-8">
        
        {/* Test Mode Banner */}
        <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚠️</span>
            <div>
              <h2 className="text-lg font-bold text-yellow-800">TEST MODE</h2>
              <p className="text-sm text-yellow-700">
                This is a test version that doesn't require authentication.
              </p>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-hanok-teal/10 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-hanok-teal" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-3xl font-bold text-midnight-ink">
                Send Message (Test)
              </h2>
              <p className="text-sm sm:text-base text-midnight-ink-600 mt-1">
                Test the message functionality without authentication
              </p>
            </div>
          </div>
        </div>

        {/* Message Form */}
        <Card className="border-0 shadow-lg rounded-2xl bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-midnight-ink">
              Your Test Message
            </CardTitle>
            <p className="text-sm text-midnight-ink-600">
              Type a message to test the functionality. Check the console for logs.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Textarea
                  placeholder="Type your test message here..."
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
                      Sending Test...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Test Message
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Test Info */}
        <Card className="mt-6 border border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">
              🧪 Test Information
            </h4>
            <div className="text-xs text-blue-700 space-y-1">
              <div><strong>Mock User ID:</strong> {mockUser.id}</div>
              <div><strong>Mock Email:</strong> {mockUser.email}</div>
              <div><strong>Mock Name:</strong> {mockUser.user_metadata.full_name}</div>
              <div><strong>Mock Company:</strong> {mockUser.user_metadata.buyer_company}</div>
              <div><strong>Environment:</strong> {import.meta.env.MODE}</div>
            </div>
            <div className="mt-3 p-2 bg-blue-100 rounded">
              <p className="text-xs text-blue-800 font-medium">
                ⚡ Open Developer Console (F12) to see detailed logs when you submit the form.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">How to Test:</h3>
          <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
            <li>Open Developer Console (F12) → Console tab</li>
            <li>Type a message in the text area above</li>
            <li>Click "Send Test Message"</li>
            <li>Watch the console for detailed logs showing the process</li>
            <li>You should see a success message when complete</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default SendMessageTest;