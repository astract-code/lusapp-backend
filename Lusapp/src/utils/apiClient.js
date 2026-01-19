import { auth } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const fetchWithAuth = async (url, options = {}, retryCount = 0) => {
  const currentUser = auth.currentUser;
  let token = await AsyncStorage.getItem('token');
  
  // Support both Firebase users and social auth users (Apple/Google Sign-In)
  // Social auth users have a backend JWT token but no Firebase currentUser
  if (!currentUser && !token) {
    throw new Error('User not authenticated');
  }
  
  const fetchOptions = {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
  
  const response = await fetch(url, fetchOptions);
  
  // Token refresh only works for Firebase users
  // Social auth users with expired tokens need to re-login
  if (response.status === 401 && retryCount < 1 && currentUser) {
    try {
      const newToken = await currentUser.getIdToken(true);
      await AsyncStorage.setItem('token', newToken);
      
      const retryOptions = {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${newToken}`,
          'Content-Type': 'application/json',
        },
      };
      
      return fetch(url, retryOptions);
    } catch (refreshError) {
      throw new Error('Session expired. Please log in again.');
    }
  }
  
  return response;
};
