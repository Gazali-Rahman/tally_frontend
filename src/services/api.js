import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('tally_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('tally_token');
      localStorage.removeItem('tally_user');
      // If we are not already on login or checking auth, we could dispatch an event
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email, password) => {
    const res = await api.post('/login', { email, password });
    return res.data;
  },
  register: async (name, email, password) => {
    const res = await api.post('/register', { name, email, password });
    return res.data;
  },
  getUser: async () => {
    const res = await api.get('/user');
    return res.data;
  },
};

export const themeService = {
  getThemes: async () => {
    const res = await api.get('/themes');
    return res.data;
  },
  updateTheme: async (themeId) => {
    const res = await api.put('/user/theme', { theme_id: themeId });
    return res.data;
  },
};

export const groupService = {
  getGroups: async () => {
    const res = await api.get('/groups');
    return res.data;
  },
  createGroup: async (name) => {
    const res = await api.post('/groups', { name });
    return res.data;
  },
  updateGroup: async (groupId, name) => {
    const res = await api.put(`/groups/${groupId}`, { name });
    return res.data;
  },
  inviteMember: async (groupId, email) => {
    const res = await api.post(`/groups/${groupId}/invite`, { email });
    return res.data;
  },
  removeMember: async (groupId, userId) => {
    const res = await api.delete(`/groups/${groupId}/remove-member/${userId}`);
    return res.data;
  },
};

export const transactionService = {
  getTransactions: async (groupId, params = {}) => {
    const res = await api.get(`/groups/${groupId}/transactions`, { params });
    return res.data;
  },
  createTransaction: async (groupId, data) => {
    const res = await api.post(`/groups/${groupId}/transactions`, data);
    return res.data;
  },
  updateTransaction: async (id, data) => {
    const res = await api.put(`/transactions/${id}`, data);
    return res.data;
  },
  deleteTransaction: async (id) => {
    const res = await api.delete(`/transactions/${id}`);
    return res.data;
  },
  getSummary: async (groupId) => {
    const res = await api.get(`/groups/${groupId}/transactions/summary`);
    return res.data;
  },
  getAnalytics: async (groupId, params = {}) => {
    const res = await api.get(`/groups/${groupId}/analytics`, { params });
    return res.data;
  },
};

export default api;
