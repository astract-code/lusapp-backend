const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  auth: {
    signup: `${API_URL}/api/auth/signup`,
    login: `${API_URL}/api/auth/login`,
    me: `${API_URL}/api/auth/me`,
  },
  races: {
    list: `${API_URL}/api/races`,
    detail: (id) => `${API_URL}/api/races/${id}`,
  },
};

export default API_URL;
