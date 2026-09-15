import api from './api.js';

export const analyzeStock = async (newsId) => {
  const response = await api.post(`/api/stock/analyze/${newsId}`, {});
  return response;
};

export const getStockIntelligence = async () => {
  const response = await api.get('/api/stock/intelligence');
  return response;
};

export const deleteStockAnalysis = async (newsId) => {
  const response = await api.delete(`/api/stock/analysis/${newsId}`);
  return response;
};
