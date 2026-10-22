const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
 
export const buildApiUrl = (path) => {
  return `${API_BASE}${path}`;
};
 
const getHeaders = (isFormData = false) => {
  const token = localStorage.getItem('cbt_token');
  const headers = {};
  if (!isFormData) headers['Content-Type'] = 'application/json';
  if (token)        headers['Authorization'] = `Bearer ${token}`;
  return headers;
};
 
const handleResponse = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
};
 
export const api = {
  get:    (path)       => fetch(buildApiUrl(path), { headers: getHeaders() }).then(handleResponse),
  post:   (path, body) => fetch(buildApiUrl(path), { method: 'POST',   headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  put:    (path, body) => fetch(buildApiUrl(path), { method: 'PUT',    headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  patch:  (path, body) => fetch(buildApiUrl(path), { method: 'PATCH',  headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  delete: (path)       => fetch(buildApiUrl(path), { method: 'DELETE', headers: getHeaders() }).then(handleResponse),
  upload: (path, form) => fetch(buildApiUrl(path), { method: 'POST',   headers: getHeaders(true), body: form }).then(handleResponse),
};
 
