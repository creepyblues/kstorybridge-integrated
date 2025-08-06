import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

const PaymentCancel = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-600">
            Payment Cancelled
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center space-y-4">
          <p className="text-gray-600">
            Your payment was cancelled. No charges have been made to your account.
          </p>
          
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link to="/pricing">
                View Pricing Plans
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/dashboard">
                Go to Dashboard
              </Link>
            </Button>
          </div>
          
          <p className="text-xs text-gray-500">
            Need help? Contact our support team.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCancel;