
import { Link } from 'react-router-dom';

const Logo = () => {
  return (
    <Link to="/" className="flex items-center">
      <img 
        src="/logo-new-teal.png" 
        alt="KStoryBridge" 
        className="h-10 w-auto"
      />
    </Link>
  );
};

export default Logo;
