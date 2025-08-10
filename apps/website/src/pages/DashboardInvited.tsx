
import PageHeader from '../components/PageHeader';
import Footer from '../components/Footer';

const DashboardInvited = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <PageHeader />
      
      <main className="flex-1 py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-8">
              Thank you so much for your interest. We're currently reviewing your information and will get back to you shortly.
            </h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
              <p className="text-blue-800">
                Your application is under review. You'll receive an email notification once your account is approved.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DashboardInvited;
