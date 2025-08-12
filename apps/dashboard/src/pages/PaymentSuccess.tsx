import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Button, Card, CardContent, CardHeader, CardTitle } from "@kstorybridge/ui";

import { CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      verifySession();
    }
  }, [sessionId]);

  const verifySession = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-session', {
        body: { sessionId },
      });

      if (error) {
        console.error('Session verification error:', error);
      } else {
        setSubscription(data);
      }
    } catch (error) {
      console.error('Verification error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <p>Verifying your payment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-600">
            Payment Successful!
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center space-y-4">
          <p className="text-gray-600">
            Thank you for your subscription. Your payment has been processed successfully.
          </p>
          
          {subscription && (
            <div className="bg-gray-50 p-4 rounded-lg text-left">
              <h3 className="font-semibold mb-2">Subscription Details:</h3>
              <p className="text-sm text-gray-600">
                Plan: {subscription.plan_type?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
              </p>
              <p className="text-sm text-gray-600">
                Status: {subscription.status}
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link to="/dashboard">
                Go to Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/settings">
                Manage Subscription
              </Link>
            </Button>
          </div>
          
          <p className="text-xs text-gray-500">
            You will receive an email confirmation shortly.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;