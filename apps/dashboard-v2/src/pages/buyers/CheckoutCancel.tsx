import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

export default function CheckoutCancel() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center space-y-6">
          {/* Cancel Icon */}
          <div className="flex justify-center">
            <div className="bg-gray-100 rounded-full p-4">
              <XCircle className="h-16 w-16 text-gray-500" />
            </div>
          </div>

          {/* Title */}
          <div>
            <h2 className="text-2xl font-bold text-black mb-2">Checkout Cancelled</h2>
            <p className="text-gray-600">No charges have been made to your account</p>
          </div>

          {/* Message */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              You can return to the plans page to choose a subscription anytime. If you
              encountered any issues, please contact our support team.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/buyers/plan')}
              className="w-full bg-black hover:bg-gray-800"
            >
              Back to Plans
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/buyers/titles')}
              className="w-full border-gray-300"
            >
              Continue Browsing
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
