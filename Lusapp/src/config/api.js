const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://lusapp-backend-1.onrender.com';

export const API_ENDPOINTS = {
  auth: {
    signup: `${API_URL}/api/auth/signup`,
    login: `${API_URL}/api/auth/login`,
    me: `${API_URL}/api/auth/me`,
    deleteAccount: `${API_URL}/api/auth/account`,
  },
  races: {
    list: `${API_URL}/api/races`,
    detail: (id) => `${API_URL}/api/races/${id}`,
  },
};

export default API_URL;
