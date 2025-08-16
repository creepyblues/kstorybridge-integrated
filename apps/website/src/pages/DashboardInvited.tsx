
import PageHeader from '../components/PageHeader';
import Footer from '../components/Footer';
import { CheckCircle, Clock, Mail, ArrowRight } from 'lucide-react';
import { Button } from '@kstorybridge/ui';
import KoreanPattern from '../components/KoreanPattern';

const DashboardInvited = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-hanok-teal/5">
      <PageHeader />
      
      <main className="flex-1 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <KoreanPattern />
        </div>
        
        {/* Main Content */}
        <div className="relative z-10 py-16 md:py-24">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl mx-auto">
              
              {/* Success Icon & Header */}
              <div className="text-center mb-12">
                <div className="relative inline-flex items-center justify-center w-24 h-24 mb-8">
                  <div className="absolute inset-0 bg-gradient-to-r from-hanok-teal to-emerald-500 rounded-full opacity-20 animate-pulse"></div>
                  <div className="relative w-16 h-16 bg-gradient-to-r from-hanok-teal to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                </div>
                
                <h1 className="text-4xl md:text-5xl font-bold text-midnight-ink mb-6 tracking-tight">
                  Application Submitted
                </h1>
                
                <p className="text-xl md:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
                  Thank you for your interest in <span className="text-hanok-teal font-semibold">K Story Bridge</span>. 
                  We're currently reviewing your information and will get back to you shortly.
                </p>
              </div>

              {/* Status Cards */}
              <div className="grid md:grid-cols-3 gap-6 mb-12">
                
                {/* Step 1 - Completed */}
                <div className="relative group">
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:border-hanok-teal/30">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-hanok-teal to-emerald-500 rounded-full flex items-center justify-center mr-3">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-midnight-ink">Application Received</h3>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Your application has been successfully submitted and is now in our system.
                    </p>
                  </div>
                </div>

                {/* Step 2 - In Progress */}
                <div className="relative group">
                  <div className="bg-white rounded-2xl border border-porcelain-blue p-6 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:border-hanok-teal/30">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-porcelain-blue to-hanok-teal rounded-full flex items-center justify-center mr-3 relative">
                        <Clock className="w-5 h-5 text-white" />
                        <div className="absolute inset-0 rounded-full bg-porcelain-blue/30 animate-ping"></div>
                      </div>
                      <h3 className="text-lg font-semibold text-midnight-ink">Under Review</h3>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Our team is carefully reviewing your profile and qualifications.
                    </p>
                  </div>
                </div>

                {/* Step 3 - Pending */}
                <div className="relative group">
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:border-hanok-teal/30 opacity-60">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                        <Mail className="w-5 h-5 text-gray-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-500">Notification</h3>
                    </div>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      You'll receive an email notification once your account is approved.
                    </p>
                  </div>
                </div>
              </div>

              {/* Information Card */}
              <div className="bg-gradient-to-r from-hanok-teal/10 via-porcelain-blue/10 to-hanok-teal/10 rounded-2xl border border-hanok-teal/20 p-8 mb-12">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-hanok-teal/20 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-hanok-teal" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-midnight-ink mb-3">
                      What happens next?
                    </h3>
                    <div className="space-y-3 text-gray-700">
                      <div className="flex items-center">
                        <ArrowRight className="w-4 h-4 text-hanok-teal mr-3 flex-shrink-0" />
                        <span>Our team will review your application within 1-2 business days</span>
                      </div>
                      <div className="flex items-center">
                        <ArrowRight className="w-4 h-4 text-hanok-teal mr-3 flex-shrink-0" />
                        <span>You'll receive an email notification with your account status</span>
                      </div>
                      <div className="flex items-center">
                        <ArrowRight className="w-4 h-4 text-hanok-teal mr-3 flex-shrink-0" />
                        <span>Once approved, you can access your personalized dashboard</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="text-center space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button 
                    onClick={() => window.location.href = '/'}
                    className="bg-gradient-to-r from-hanok-teal to-emerald-500 hover:from-hanok-teal/90 hover:to-emerald-500/90 text-white px-8 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Return to Homepage
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => window.location.href = '/about'}
                    className="border-hanok-teal text-hanok-teal hover:bg-hanok-teal hover:text-white px-8 py-3 rounded-xl font-medium transition-all duration-300"
                  >
                    Learn More About Us
                  </Button>
                </div>
                
                <p className="text-sm text-gray-500 mt-6">
                  Questions? Contact us at{' '}
                  <a href="mailto:support@kstorybridge.com" className="text-hanok-teal hover:text-hanok-teal/80 font-medium">
                    support@kstorybridge.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 right-10 w-32 h-32 bg-gradient-to-br from-hanok-teal/10 to-porcelain-blue/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 left-10 w-40 h-40 bg-gradient-to-br from-porcelain-blue/10 to-hanok-teal/10 rounded-full blur-2xl"></div>
      </main>

      <Footer />
    </div>
  );
};

export default DashboardInvited;
