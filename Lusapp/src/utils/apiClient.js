import { auth } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../config/api';

export const fetchWithAuth = async (url, options = {}, retryCount = 0) => {
  const currentUser = auth.currentUser;
  let token = await AsyncStorage.getItem('token');
  
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
  
  if (response.status === 401 && retryCount < 1) {
    if (currentUser) {
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
    } else if (token) {
      try {
        const refreshResponse = await fetch(API_ENDPOINTS.auth.refreshToken, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          await AsyncStorage.setItem('token', refreshData.token);
          await AsyncStorage.setItem('user', JSON.stringify(refreshData.user));
          
          const retryOptions = {
            ...options,
            headers: {
              ...options.headers,
              'Authorization': `Bearer ${refreshData.token}`,
              'Content-Type': 'application/json',
            },
          };
          
          return fetch(url, retryOptions);
        }
      } catch (refreshError) {
        console.log('[API] Social token refresh failed:', refreshError.message);
      }
    }
  }
  
  return response;
};
