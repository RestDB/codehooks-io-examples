import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Auth({ children }) {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if there's a hash in the URL
    if (window.location.hash) {
      // Extract the access token
      const hashParams = new URLSearchParams(
        window.location.hash.substring(1) // Remove the # character
      );
      const accessToken = hashParams.get('access_token');
      console.log('accessToken', accessToken);
      if (accessToken) {
        // Store the token in localStorage
        localStorage.setItem('access_token', accessToken);
        // Clean up the URL by removing the hash
        navigate(window.location.pathname, { replace: true });
      }
    }
  }, [navigate]);

  return children;
}

export default Auth;
