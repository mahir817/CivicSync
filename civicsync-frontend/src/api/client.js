import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:8080/api',
});

// Donation API
export const donationApi = {
  getForCampaign: (campaignId) => api.get(`/campaigns/${campaignId}/donations`),
  create: (campaignId, data) => api.post(`/campaigns/${campaignId}/donations`, data),
};

// Civic Report API
export const civicReportApi = {
  getActive: () => api.get('/civic-reports'),
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
  create: (data) => api.post('/campaigns', data),
  verify: (id, approve) => api.put(`/campaigns/${id}/verify`, null, { params: { approve } }),

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
