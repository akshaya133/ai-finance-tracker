import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(c => {
  const t = localStorage.getItem('token');
  if (t) c.headers.Authorization = 'Bearer ' + t;
  return c;
});

api.interceptors.response.use(
  r => r,
  e => {
    if (e.response && e.response.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(e);
  }
);

export const authAPI = {
  register: (d) => api.post('/auth/register', d),
  login:    (d) => api.post('/auth/login', d),
  getMe:    ()  => api.get('/auth/me'),
};

export const transactionAPI = {
  create: (d)     => api.post('/transactions/', d),
  getAll: (p)     => api.get('/transactions/', { params: p }),
  update: (id, d) => api.put('/transactions/' + id, d),
  delete: (id)    => api.delete('/transactions/' + id),
};

export const dashboardAPI = {
  getSummary:           (p, month)    => api.get('/dashboard/summary',            { params: { period: p, month } }),
  getCategoryBreakdown: (p, t, month) => api.get('/dashboard/category-breakdown', { params: { period: p, transaction_type: t, month } }),
  getMonthlyTrend:      (m)           => api.get('/dashboard/monthly-trend',      { params: { months: m } }),
  getDailyTrend:        (month)       => api.get('/dashboard/daily-trend',        { params: { month } }),
  getYearlyTrend:       (year)        => api.get('/dashboard/yearly-trend',       { params: { year } }),
};

export const aiAPI = {
  getPredictions:  () => api.get('/ai/predict'),
  getInsights:     () => api.get('/ai/insights'),
  getAnomalies:    () => api.get('/ai/anomalies'),
  getBudgetAdvice: () => api.get('/ai/budget-advice'),
};

export const scannerAPI = {
  scanText: (t) => api.post('/scanner/text-scan?text=' + encodeURIComponent(t)),
};

export const exportAPI = {
  downloadCSV:  (p) => api.get('/export/csv/transactions',  { params: p, responseType: 'blob' }),
  downloadJSON: (p) => api.get('/export/json/transactions', { params: p, responseType: 'blob' }),
};

export const downloadFile = (b, f) => {
  const u = window.URL.createObjectURL(new Blob([b]));
  const a = document.createElement('a');
  a.href = u;
  a.download = f;
  document.body.appendChild(a);
  a.click();
  a.remove();
};

export default api;