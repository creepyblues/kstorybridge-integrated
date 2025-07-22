
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SignupPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to buyer signup by default
    navigate('/signup/buyer', { replace: true });
  }, [navigate]);

  return null;
};

export default SignupPage;
