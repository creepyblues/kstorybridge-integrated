import { useNavigate } from 'react-router-dom';
import { Button } from '@kstorybridge/ui';

const SigninPageSimple = () => {
  const navigate = useNavigate();

  const handleCreatorLogin = () => {
    navigate('/signin/creator');
  };

  const handleBuyerLogin = () => {
    navigate('/signin/buyer');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold text-midnight-ink mb-6">
            Welcome Back
          </h1>
          <p className="text-xl text-midnight-ink-600">
            Choose your account type to sign in
          </p>
        </div>

        <div className="space-y-6">
          {/* Creator Login Button */}
          <Button
            onClick={handleCreatorLogin}
            className="w-full h-16 text-lg font-medium bg-hanok-teal hover:bg-hanok-teal/90 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <div className="flex items-center justify-center">
              <div className="font-semibold">Creator Login</div>
            </div>
          </Button>

          {/* Buyer Login Button */}
          <Button
            onClick={handleBuyerLogin}
            className="w-full h-16 text-lg font-medium bg-hanok-teal hover:bg-hanok-teal/90 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <div className="flex items-center justify-center">
              <div className="font-semibold">Buyer Login</div>
            </div>
          </Button>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-midnight-ink-600 mb-4">
            Don't have an account?
          </p>
          <div className="space-y-2">
            <Button
              variant="outline"
              onClick={() => navigate('/signup/creator')}
              className="w-full border-midnight-ink-200 text-midnight-ink hover:bg-midnight-ink-50"
            >
              Sign up as Creator
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/signup/buyer')}
              className="w-full border-midnight-ink-200 text-midnight-ink hover:bg-midnight-ink-50"
            >
              Sign up as Buyer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SigninPageSimple;