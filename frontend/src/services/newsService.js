import api from './api.js';

export const getNews = async (category) => {
  const url = category ? `/api/news?category=${encodeURIComponent(category)}` : '/api/news';
  const response = await api.get(url);
  return response;
};

export const getBlinkNews = async (category) => {
  const url = category ? `/api/news/blinknews?category=${encodeURIComponent(category)}` : '/api/news/blinknews';
  const response = await api.get(url);
  return response;
};

export const summarizeNews = async (newsId) => {
  const response = await api.post(`/api/news/summarize/${newsId}`, {});
  return response;
};

export const deleteSummary = async (newsId) => {
  const response = await api.delete(`/api/news/summary/${newsId}`);
  return response;
};

export const syncNews = async () => {
  const response = await api.post('/api/news/sync', {});
  return response;
};

