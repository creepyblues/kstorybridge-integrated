
import PageHeader from '../components/PageHeader';
import SignupForm from '../components/SignupForm';
import Footer from '../components/Footer';

const BuyerSignupPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50">
      <PageHeader />
      
      <main className="flex-1">
        <section className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-2xl mx-auto">
              <SignupForm accountType="buyer" />
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default BuyerSignupPage;
