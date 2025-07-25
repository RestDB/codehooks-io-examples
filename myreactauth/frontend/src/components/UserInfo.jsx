import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const UserInfo = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        console.log('fetching user info', import.meta.env.VITE_CODEHOOKS_API_URL);
        const response = await fetch(`${import.meta.env.VITE_CODEHOOKS_API_URL}/userinfo`, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data);
        } else {
          setUser(null); // No user logged in
        }
      } catch (error) {
        console.error('Failed to fetch user info:', error);
        setUser(null);
      }
    };

    fetchUserData();
  }, []);

  return (
    <div>
      <h2>User Information</h2>
      {user ? (
        <div>
          <pre>
            {JSON.stringify(user, null, '  ')}
          </pre>
        </div>
      ) : (
        <p><a href="/auth/login">Login</a> to see user info</p>
      )}
    </div>
  );
};

export default UserInfo;
