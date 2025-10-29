import { Mail, MessageSquare, Phone, MapPin } from 'lucide-react';
import { Button, Card, CardContent } from '@kstorybridge/ui';

const Contact = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-4 sm:py-6 lg:py-8 px-3 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-3xl font-bold text-midnight-ink mb-4 sm:mb-6">
            Contact Us
          </h2>
          <p className="text-sm sm:text-base lg:text-xl text-midnight-ink-600 max-w-3xl mx-auto">
            Have questions about our platform? We're here to help you discover and acquire amazing Korean content.
          </p>
        </div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12 lg:mb-16">
          <Card className="border-0 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-300 bg-white h-full">
            <CardContent className="p-4 sm:p-6 lg:p-8 text-center flex flex-col h-full">
              <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-hanok-teal/10 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Mail className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-hanok-teal" />
              </div>
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-midnight-ink mb-3 sm:mb-4">Email</h3>
              <p className="text-sm sm:text-base text-midnight-ink-600 mb-4 sm:mb-6 flex items-center justify-center">
                For general inquiries and support
              </p>
              <a 
                href="mailto:contact@kstorybridge.com"
                className="text-hanok-teal font-medium hover:text-hanok-teal-600 transition-colors mt-auto"
              >
                contact@kstorybridge.com
              </a>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-300 bg-white h-full">
            <CardContent className="p-4 sm:p-6 lg:p-8 text-center flex flex-col h-full">
              <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-porcelain-blue/20 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-porcelain-blue-600" />
              </div>
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-midnight-ink mb-3 sm:mb-4">Sales</h3>
              <p className="text-sm sm:text-base text-midnight-ink-600 mb-4 sm:mb-6 flex items-center justify-center">
                Ready to upgrade or have pricing questions?
              </p>
              <a 
                href="mailto:sales@kstorybridge.com"
                className="text-hanok-teal font-medium hover:text-hanok-teal-600 transition-colors mt-auto"
              >
                sales@kstorybridge.com
              </a>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-300 bg-white h-full">
            <CardContent className="p-4 sm:p-6 lg:p-8 text-center flex flex-col h-full">
              <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-sunrise-coral/10 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Phone className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-sunrise-coral" />
              </div>
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-midnight-ink mb-3 sm:mb-4">Support</h3>
              <p className="text-sm sm:text-base text-midnight-ink-600 mb-4 sm:mb-6 flex items-center justify-center">
                Need help with your account or titles?
              </p>
              <a 
                href="mailto:support@kstorybridge.com"
                className="text-hanok-teal font-medium hover:text-hanok-teal-600 transition-colors mt-auto"
              >
                support@kstorybridge.com
              </a>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default Contact;