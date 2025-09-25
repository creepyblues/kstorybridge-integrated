import { Link } from 'react-router-dom';
import { Button, Card, CardContent } from '@kstorybridge/ui';
import { XCircle, ArrowLeft, CreditCard, HelpCircle } from 'lucide-react';

const PaymentCancel = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full bg-white shadow-2xl rounded-3xl overflow-hidden">
        <CardContent className="p-0">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-red-500 to-orange-500 p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-white/20 p-6 rounded-full backdrop-blur-sm">
                <XCircle className="w-16 h-16 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Payment Cancelled
            </h2>
            <p className="text-xl text-white/90">
              Your payment was cancelled and no charges were made
            </p>
          </div>

          {/* Content Section */}
          <div className="p-8 space-y-8">
            {/* Message */}
            <div className="text-center space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-blue-800">
                    No Payment Processed
                  </h2>
                </div>
                <p className="text-blue-600">
                  Your payment was cancelled before completion. No charges have been made to your account.
                </p>
              </div>
            </div>

            {/* What You Can Do */}
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-midnight-ink text-center">
                What would you like to do?
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-hanok-teal/5 to-emerald-50 border border-hanok-teal/20 rounded-xl p-6 text-center">
                  <div className="bg-hanok-teal p-3 rounded-full w-fit mx-auto mb-4">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-semibold text-hanok-teal mb-2">Try Again</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Ready to upgrade to Pro? Try the payment process again.
                  </p>
                  <Link to="/buyers/plan">
                    <Button className="w-full bg-hanok-teal hover:bg-hanok-teal/90 text-white">
                      Back to Pricing
                    </Button>
                  </Link>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 text-center">
                  <div className="bg-blue-500 p-3 rounded-full w-fit mx-auto mb-4">
                    <HelpCircle className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-semibold text-blue-800 mb-2">Need Help?</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Have questions about our Pro plan or payment process?
                  </p>
                  <Link to="/contact">
                    <Button variant="outline" className="w-full border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white">
                      Contact Support
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Continue Browsing */}
            <div className="text-center pt-6 border-t border-gray-200">
              <p className="text-gray-600 mb-4">
                You can continue using KStoryBridge with your current plan.
              </p>
              <Link to="/buyers/titles">
                <Button
                  variant="ghost"
                  className="text-hanok-teal hover:text-hanok-teal hover:bg-hanok-teal/10"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Continue Browsing Titles
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCancel;