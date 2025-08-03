import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';

const PageHeader = () => {
  const navigate = useNavigate();

  return (
    <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
      <div className="flex items-center">
        <img 
          src="/logo-new-teal.png" 
          alt="KStoryBridge" 
          className="h-10 w-auto cursor-pointer"
          onClick={() => navigate('/')}
        />
      </div>
      
      <div className="hidden md:flex items-center space-x-8">
        <button 
          id="pageheader-nav-creators-btn"
          onClick={() => navigate('/creators')}
          className="text-midnight-ink font-medium hover:text-hanok-teal transition-colors"
        >
          CREATORS
        </button>
        <button 
          id="pageheader-nav-buyers-btn"
          onClick={() => navigate('/buyers')}
          className="text-midnight-ink font-medium hover:text-hanok-teal transition-colors"
        >
          BUYERS
        </button>
        <button 
          id="pageheader-nav-about-btn"
          onClick={() => navigate('/about')}
          className="text-midnight-ink font-medium hover:text-hanok-teal transition-colors"
        >
          ABOUT
        </button>
      </div>
      
      <div className="flex items-center space-x-4">
        <Button 
          id="pageheader-signin-btn"
          variant="outline"
          className="border-2 border-hanok-teal text-hanok-teal hover:bg-hanok-teal hover:text-white px-6 py-2 rounded-full font-medium transition-colors"
          onClick={() => navigate('/signin')}
        >
          SIGN IN
        </Button>
        <Button 
          id="pageheader-signup-btn"
          className="bg-sunrise-coral hover:bg-sunrise-coral-600 text-white px-6 py-2 rounded-full font-medium"
          onClick={() => navigate('/signup')}
        >
          SIGN UP
        </Button>
      </div>
    </nav>
  );
};

export default PageHeader;