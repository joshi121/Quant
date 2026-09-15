import api from './api.js';

export const getAllMessages = async () => {
  const response = await api.get('/api/messages/allmessages');
  return response;
};

export const getAllLoggedin = async () => {
  const response = await api.get('/api/messages/allloggedin');
  return response;
};

export const getTodayMessages = async () => {
  const response = await api.get('/api/messages/today');
  return response;
};

export const sendMessage = async (recipientId, messagePayload) => {
  const response = await api.post(`/api/messages/sendmessage/${recipientId}`, messagePayload);
  return response;
};

