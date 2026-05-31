import axios from 'axios';
import { useAuthStore } from '../store/auth';

const BASE = process.env.EXPO_PUBLIC_API_URL || 'https://vcds-dorpwag.onrender.com/api';

export const api = axios.create({ baseURL: BASE, timeout: 15000 });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) useAuthStore.getState().logout();
    return Promise.reject(err);
  }
);

export const authAPI = {
  signup: (d: { email: string; password: string; name: string; townId?: string; phone?: string }) => api.post('/auth/signup', d),
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => api.post('/auth/reset-password', { token, password }),
  refresh: () => api.post('/auth/refresh'),
};

export const townsAPI = {
  list: () => api.get('/towns'),
  get: (id: string) => api.get(`/towns/${id}`),
  stats: (id: string) => api.get(`/towns/${id}/stats`),
  provinces: () => api.get('/towns/provinces'),
};

export const noticesAPI = {
  list: (p?: { page?: number; category?: string }) => api.get('/notices', { params: p }),
  get: (id: string) => api.get(`/notices/${id}`),
  create: (d: any) => api.post('/notices', d),
  update: (id: string, d: any) => api.put(`/notices/${id}`, d),
  delete: (id: string) => api.delete(`/notices/${id}`),
  react: (id: string) => api.post(`/notices/${id}/react`, {}),
  comments: (id: string) => api.get(`/notices/${id}/comments`),
  comment: (id: string, body: string) => api.post(`/notices/${id}/comments`, { body }),
};

export const listingsAPI = {
  list: (p?: any) => api.get('/listings', { params: p }),
  my: () => api.get('/listings/my'),
  get: (id: string) => api.get(`/listings/${id}`),
  create: (d: any) => api.post('/listings', d),
  update: (id: string, d: any) => api.put(`/listings/${id}`, d),
  delete: (id: string) => api.delete(`/listings/${id}`),
};

export const eventsAPI = {
  list: (p?: any) => api.get('/events', { params: p }),
  get: (id: string) => api.get(`/events/${id}`),
  create: (d: any) => api.post('/events', d),
  rsvp: (id: string, status = 'going') => api.post(`/events/${id}/rsvp`, { status }),
  unrsvp: (id: string) => api.delete(`/events/${id}/rsvp`),
  delete: (id: string) => api.delete(`/events/${id}`),
};

export const topicsAPI = {
  list: (p?: any) => api.get('/topics', { params: p }),
  get: (id: string) => api.get(`/topics/${id}`),
  create: (d: any) => api.post('/topics', d),
  replies: (id: string) => api.get(`/topics/${id}/replies`),
  reply: (id: string, body: string) => api.post(`/topics/${id}/replies`, { body }),
  react: (id: string) => api.post(`/topics/${id}/react`, {}),
};

export const businessesAPI = {
  list: (p?: any) => api.get('/businesses', { params: p }),
  get: (id: string) => api.get(`/businesses/${id}`),
  create: (d: any) => api.post('/businesses', d),
  reviews: (id: string) => api.get(`/businesses/${id}/reviews`),
  review: (id: string, d: any) => api.post(`/businesses/${id}/reviews`, d),
  getClaim: (id: string) => api.get(`/businesses/${id}/claim`),
  submitClaim: (id: string, data: { proof_document_url: string; proof_type: string }) => api.post(`/businesses/${id}/claim`, data),
};

export const messagesAPI = {
  threads: () => api.get('/message-threads'),
  start: (recipientId: string) => api.post('/message-threads/start', { recipientId }),
  messages: (threadId: string, p?: any) => api.get(`/message-threads/${threadId}/messages`, { params: p }),
  send: (threadId: string, body: string) => api.post(`/message-threads/${threadId}/messages`, { body }),
};

export const incidentsAPI = {
  list: (p?: any) => api.get('/incidents', { params: p }),
  get: (id: string) => api.get(`/incidents/${id}`),
  create: (d: any) => api.post('/incidents', d),
  resolve: (id: string) => api.put(`/incidents/${id}/resolve`, {}),
};

export const patrols = {
  list: () => api.get('/patrols'),
  create: (d: any) => api.post('/patrols', d),
  join: (id: string) => api.post(`/patrols/${id}/join`, {}),
  leave: (id: string) => api.delete(`/patrols/${id}/leave`),
  members: (id: string) => api.get(`/patrols/${id}/members`),
};

export const emergencyAlertsAPI = {
  list: () => api.get('/emergency-alerts'),
  create: (d: any) => api.post('/emergency-alerts', d),
  deactivate: (id: string) => api.delete(`/emergency-alerts/${id}`),
};

export const sosAPI = {
  trigger: (d: any) => api.post('/sos/trigger', d),
  silent: (d: any) => api.post('/sos/silent', d),
  gpsUpdate: (sosId: string, d: any) => api.post(`/sos/${sosId}/gps-update`, d),
  trail: (sosId: string) => api.get(`/sos/${sosId}/trail`),
  resolve: (sosId: string) => api.post(`/sos/${sosId}/resolve`, {}),
  acknowledge: (sosId: string) => api.post(`/sos/${sosId}/acknowledge`, {}),
};

export const guardianAPI = {
  contacts: () => api.get('/guardian/contacts'),
  addContact: (d: any) => api.post('/guardian/contacts', d),
  deleteContact: (id: string) => api.delete(`/guardian/contacts/${id}`),
  startSession: () => api.post('/guardian/session/start', {}),
  ping: () => api.post('/guardian/session/ping', {}),
  endSession: () => api.post('/guardian/session/end', {}),
  sessionStatus: () => api.get('/guardian/session/status'),
};

export const movementAPI = {
  checkin: (d: any) => api.post('/movement/checkin', d),
  history: () => api.get('/movement/history'),
};

export const heatmapAPI = {
  get: (p?: any) => api.get('/heatmap', { params: p }),
};

export const profileAPI = {
  get: () => api.get('/profile'),
  update: (d: any) => api.put('/profile', d),
  notifications: () => api.get('/profile/notifications'),
  updateNotifications: (d: any) => api.put('/profile/notifications', d),
  trustedContacts: () => api.get('/profile/trusted-contacts'),
  addTrustedContact: (d: any) => api.post('/profile/trusted-contacts', d),
  deleteTrustedContact: (id: string) => api.delete(`/profile/trusted-contacts/${id}`),
};

export const paymentsAPI = {
  subscribe: (d?: any) => api.post('/payments/subscribe', d || {}),
  status: () => api.get('/payments/status'),
  history: () => api.get('/subscriptions/history'),
  cancel: () => api.post('/subscriptions/cancel', {}),
};

export const safetyAPI = {
  stats: () => api.get('/safety/stats'),
  escalate: (sosEventId: string, reason?: string) => api.post('/safety/escalate', { sosEventId, reason }),
};

export const pushAPI = {
  register: (token: string, deviceType?: string) => api.post('/push-tokens', { token, deviceType }),
  unregister: (token: string) => api.delete('/push-tokens', { data: { token } }),
};

export const reportsAPI = {
  list: () => api.get('/reports'),
  create: (d: any) => api.post('/reports', d),
};

export const adminAPI = {
  stats: () => api.get('/admin/stats'),
  users: (p?: any) => api.get('/admin/users', { params: p }),
  setRole: (id: string, role: string) => api.put(`/admin/users/${id}/role`, { role }),
  ban: (id: string) => api.put(`/admin/users/${id}/ban`, {}),
  reports: () => api.get('/admin/reports'),
};

export const subscriptionsAPI = {
  history: () => api.get('/subscriptions/history'),
  status: () => api.get('/subscriptions/status'),
  cancel: () => api.post('/subscriptions/cancel', {}),
};

export const uploadAPI = {
  presign: (fileName: string, mimeType: string) =>
    api.post('/upload/presign', { fileName, mimeType }),
  confirm: (fileId: string) =>
    api.post('/upload/confirm', { fileId }),
};

export const lprAPI = {
  feed: (limit = 50) => api.get('/lpr/feed', { params: { limit } }),
  watchlist: () => api.get('/lpr/watchlist'),
  addToWatchlist: (plate: string, reason: string) => api.post('/lpr/watchlist', { plate, reason }),
  report: (plate: string, reportedBy: string) => api.post('/lpr/report', { plate, reportedBy }),
};

export const aiCrimeAPI = {
  predictions: (params?: any) => api.get('/ai-crime/prediction', { params }),
  hotspots: () => api.get('/ai-crime/hotspots'),
  stats: () => api.get('/ai-crime/stats'),
};

export const analyticsAPI = {
  admin: () => api.get('/admin/analytics'),
};

// ─── SOS Contacts (user-managed emergency contacts) ───────────
export const sosContactsAPI = {
  list: () => api.get('/sos/contacts'),
  add: (d: { name: string; phone: string; email?: string; isPrimary?: boolean }) => api.post('/sos/contacts', d),
  update: (id: string, d: any) => api.put(`/sos/contacts/${id}`, d),
  delete: (id: string) => api.delete(`/sos/contacts/${id}`),
};

// ─── Movement Brain™ (pattern learning + dead man) ────────────
export const movementBrainAPI = {
  checkin: (lat: number, lng: number, status: string) => api.post('/movement/checkin', { lat, lng, status }),
  history: () => api.get('/movement/history'),
  patterns: () => api.get('/movement/patterns'),
  deadmanPing: () => api.post('/movement/deadman', {}),
  deadmanStart: (intervalMinutes: number) => api.post('/movement/deadman/start', { intervalMinutes }),
  deadmanEnd: () => api.post('/movement/deadman/end', {}),
};
