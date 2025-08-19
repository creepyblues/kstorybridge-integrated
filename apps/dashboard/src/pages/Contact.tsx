import { Mail, MessageSquare, Phone, MapPin } from 'lucide-react';
import { Button, Card, CardContent } from '@kstorybridge/ui';

const Contact = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl lg:text-6xl font-bold text-midnight-ink mb-6">
            Contact Us
          </h1>
          <p className="text-xl text-midnight-ink-600 max-w-3xl mx-auto">
            Have questions about our platform? We're here to help you discover and acquire amazing Korean content.
          </p>
        </div>

        {/* Contact Cards */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          <Card className="border-0 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-300 bg-white h-full">
            <CardContent className="p-8 text-center flex flex-col h-full">
              <div className="w-16 h-16 bg-hanok-teal/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-hanok-teal" />
              </div>
              <h3 className="text-2xl font-bold text-midnight-ink mb-4 h-8">Email</h3>
              <p className="text-midnight-ink-600 mb-6 h-12 flex items-center justify-center">
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
            <CardContent className="p-8 text-center flex flex-col h-full">
              <div className="w-16 h-16 bg-porcelain-blue/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-8 h-8 text-porcelain-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-midnight-ink mb-4 h-8">Sales</h3>
              <p className="text-midnight-ink-600 mb-6 h-12 flex items-center justify-center">
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
            <CardContent className="p-8 text-center flex flex-col h-full">
              <div className="w-16 h-16 bg-sunrise-coral/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Phone className="w-8 h-8 text-sunrise-coral" />
              </div>
              <h3 className="text-2xl font-bold text-midnight-ink mb-4 h-8">Support</h3>
              <p className="text-midnight-ink-600 mb-6 h-12 flex items-center justify-center">
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