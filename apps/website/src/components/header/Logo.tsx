
import { Link } from 'react-router-dom';

const Logo = () => {
  return (
    <Link to="/" className="flex items-center">
      <span className="text-2xl font-bold tracking-tight">
        <span className="text-black">K</span>
        <span className="text-hanok-teal">Story</span>
        <span className="text-black">Bridge</span>
      </span>
    </Link>
  );
};

export default Logo;
