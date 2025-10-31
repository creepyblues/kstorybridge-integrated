import SignupForm from '../components/SignupForm';

const CreatorSignupPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50">
      <main className="flex-1">
        <section className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-hanok-teal">
                  KStoryBridge for Creators
                </h1>
              </div>
              <SignupForm accountType="creator" />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default CreatorSignupPage;