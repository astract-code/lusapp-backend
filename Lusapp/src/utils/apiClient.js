import { auth } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const fetchWithAuth = async (url, options = {}, retryCount = 0) => {
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    throw new Error('User not authenticated');
  }
  
  let token = await AsyncStorage.getItem('token');
  
  const fetchOptions = {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
  
  const response = await fetch(url, fetchOptions);
  
  if (response.status === 401 && retryCount < 1) {
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
