
import { Link } from 'react-router-dom';

const Logo = () => {
  return (
    <Link to="/" className="flex items-center">
      <img 
        src="/lovable-uploads/b8a30438-0157-4985-bfd5-b81775215417.png" 
        alt="K Story Bridge" 
        className="h-10 w-auto"
      />
    </Link>
  );
};

export default Logo;
