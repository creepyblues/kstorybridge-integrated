import SignupForm from '../components/SignupForm';

const BuyerSignupPage = () => {
  console.log('📝 BUYER SIGNUP PAGE: Component rendering!', {
    currentUrl: window.location.href,
    pathname: window.location.pathname,
    search: window.location.search
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50">
      <main className="flex-1">
        <section className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-2xl mx-auto">
              <SignupForm accountType="buyer" />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default BuyerSignupPage;