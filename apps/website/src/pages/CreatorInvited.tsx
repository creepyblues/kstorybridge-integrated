import PageHeader from '../components/PageHeader';
import Footer from '../components/Footer';

const CreatorInvited = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <PageHeader />
      
      <main className="flex-1 py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <div className="w-24 h-24 bg-hanok-teal/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-hanok-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-bold text-midnight-ink mb-6 leading-tight">
                Welcome to <span className="text-hanok-teal">KStoryBridge!</span>
              </h1>
              
              <h2 className="text-2xl font-semibold text-midnight-ink-600 mb-8">
                Your Creator Account is Under Review
              </h2>
            </div>
            
            <div className="bg-gradient-to-r from-hanok-teal/5 to-porcelain-blue/5 border border-hanok-teal/20 rounded-2xl p-8 mb-8">
              <div className="space-y-4">
                <p className="text-lg text-midnight-ink-700 leading-relaxed">
                  Thank you for joining KStoryBridge as a content creator! We're excited to have you as part of our community connecting Korean creators with global media buyers.
                </p>
                
                <p className="text-lg text-midnight-ink-700 leading-relaxed">
                  <strong>Next Steps:</strong> Our team is currently reviewing your creator profile to ensure the best experience for you and our buyer community.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white border border-porcelain-blue-200 rounded-xl p-6 shadow-sm">
                <div className="w-12 h-12 bg-sunrise-coral/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-sunrise-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-midnight-ink mb-2">Email Notification</h3>
                <p className="text-midnight-ink-600 text-sm">
                  You'll receive an email notification once your creator account is approved and ready to use.
                </p>
              </div>

              <div className="bg-white border border-porcelain-blue-200 rounded-xl p-6 shadow-sm">
                <div className="w-12 h-12 bg-hanok-teal/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-hanok-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-midnight-ink mb-2">Review Timeline</h3>
                <p className="text-midnight-ink-600 text-sm">
                  We typically review creator applications within 1-2 business days.
                </p>
              </div>
            </div>

            <div className="bg-porcelain-blue-50 border border-porcelain-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-midnight-ink mb-3">What Happens Next?</h3>
              <div className="space-y-2 text-left">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-hanok-teal text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">1</div>
                  <p className="text-midnight-ink-600">Our team reviews your creator profile and content information</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-hanok-teal text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">2</div>
                  <p className="text-midnight-ink-600">You'll receive an email confirmation once approved</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-hanok-teal text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">3</div>
                  <p className="text-midnight-ink-600">Access your creator dashboard to showcase your Korean IP content</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-hanok-teal text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">4</div>
                  <p className="text-midnight-ink-600">Start connecting with global media buyers interested in your content</p>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-midnight-ink-500">
                Have questions? Contact us at{' '}
                <a href="mailto:support@kstorybridge.com" className="text-hanok-teal hover:text-hanok-teal-600 font-medium">
                  support@kstorybridge.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CreatorInvited;