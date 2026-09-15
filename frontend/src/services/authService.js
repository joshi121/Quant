import api from './api.js';

export const login = async (loginData) => {
  const response = await api.post('/api/chatapp/user/login', loginData);
  return response;
};

export const signup = async (formData) => {
  const response = await api.post('/api/chatapp/user/register', formData);
  return response;
};

export const logout = async () => {
  const response = await api.get('/api/chatapp/user/logout');
  return response;
};
