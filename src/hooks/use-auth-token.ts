import { useState, useEffect } from 'react';
import axios from 'axios';

const useAuthToken = () => {
  const [token, setToken] = useState(null);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await axios.get('/api/auth');
        setToken(response.data.token);
      } catch (error) {
        console.error('Error fetching token:', error);
      }
    };

    fetchToken();
  }, []);

  return token;
};

export default useAuthToken;
