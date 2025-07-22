
import PageLayout from '../components/PageLayout';
import SignupForm from '../components/SignupForm';

const BuyerSignupPage = () => {
  return (
    <PageLayout>
      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <SignupForm accountType="buyer" />
        </div>
      </main>
    </PageLayout>
  );
};

export default BuyerSignupPage;
