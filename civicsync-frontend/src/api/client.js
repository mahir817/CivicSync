import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Donation API
export const donationApi = {
  getForCampaign: (campaignId) => api.get(`/campaigns/${campaignId}/donations`),
  create: (campaignId, data) => api.post(`/campaigns/${campaignId}/donations`, data),
  getPendingReceipts: () => api.get('/donations/pending-receipts'),
  confirmReceipt: (campaignId, donationId) => api.put(`/campaigns/${campaignId}/donations/${donationId}/confirm`),
};

// Civic Report API
export const civicReportApi = {
  getActive: () => api.get('/civic-reports'),
  getById: (id) => api.get(`/civic-reports/${id}`),
  create: (data) => api.post('/civic-reports', data),
  confirm: (id) => api.post(`/civic-reports/${id}/confirm`),
  resolve: (id) => api.put(`/civic-reports/${id}/resolve`),
};

// Health Alerts API
export const healthApi = {
  submitSymptom: (data) => api.post('/symptom-reports', data),
  getAlerts: () => api.get('/health-alerts'),
};

// Campaign API (including image upload)
export const campaignApi = {
  getAll: (category) =>
    api.get('/campaigns', { params: category ? { category } : {} }),
  getById: (id) => api.get(`/campaigns/${id}`),
  getPending: () => api.get('/campaigns/pending'),
  getPendingOutcomes: () => api.get('/campaigns/outcomes/pending'),
  create: (data) => api.post('/campaigns', data),
  verify: (id, approve) => api.put(`/campaigns/${id}/verify`, null, { params: { approve } }),
  submitOutcome: (id, data) => api.post(`/campaigns/${id}/outcome`, data),
  approveOutcome: (id) => api.put(`/campaigns/${id}/outcome/approve`),

  // NEW — creates a campaign AND uploads pictures/files in one request
  createWithImages: (campaignData, files) => {
    const formData = new FormData();

    // IMPORTANT: this JSON part needs an explicit Content-Type of application/json,
    // or Spring will fail to parse it. Passing a Blob (not a plain object) is what sets that.
    formData.append(
      'campaign',
      new Blob([JSON.stringify(campaignData)], { type: 'application/json' })
    );

    if (files && files.length > 0) {
      files.forEach((file) => formData.append('files', file));
    }

    return api.post('/campaigns/with-images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const profileApi = {
  get: () => api.get('/me'),
  update: (data) => api.patch('/me', data),
  recommendations: () => api.get('/me/recommendations'),
  notifications: () => api.get('/me/notifications'),
  markRead: (id) => api.patch(`/me/notifications/${id}/read`),
};

export const adminApi = {
  users: () => api.get('/admin/users'),
  updateUser: (id, data) => api.patch(`/admin/users/${id}`, data),
  disputes: () => api.get('/admin/disputes'),
  reviewDispute: (id, status, action = 'KEEP') => api.patch(`/admin/disputes/${id}`, null, { params: { status, action } }),
};

export const disputeApi = { create: (data) => api.post('/disputes', data) };
export const uploadApi = { image: (file) => {
  const form = new FormData(); form.append('file', file);
  return api.post('/uploads', form);
} };

campaignApi.getMine = () => api.get('/campaigns/mine');
donationApi.getMine = () => api.get('/donations/mine');

// Attachment API
export const attachmentApi = {
  getForCampaign: (campaignId) => api.get(`/campaigns/${campaignId}/attachments`),
};

// Comment API
export const commentApi = {
  getForCampaign: (campaignId) => api.get(`/campaigns/${campaignId}/comments`),
  addToCampaign: (campaignId, content) => api.post(`/campaigns/${campaignId}/comments`, { content }),

  getForCivicReport: (reportId) => api.get(`/civic-reports/${reportId}/comments`),
  addToCivicReport: (reportId, content) => api.post(`/civic-reports/${reportId}/comments`, { content }),
};

// Like API
export const likeApi = {
  getForCampaign: (campaignId) => api.get(`/campaigns/${campaignId}/likes`),
  toggleForCampaign: (campaignId) => api.post(`/campaigns/${campaignId}/likes`),

  getForCivicReport: (reportId) => api.get(`/civic-reports/${reportId}/likes`),
  toggleForCivicReport: (reportId) => api.post(`/civic-reports/${reportId}/likes`),
};


