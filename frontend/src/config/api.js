const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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

const handleBlobResponse = async (res) => {
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Request failed (${res.status})`);
  }

  const blob = await res.blob();
  const disposition = res.headers.get('content-disposition') || '';
  const fileNameMatch = disposition.match(/filename="?([^"]+)"?/i);

  return {
    blob,
    fileName: fileNameMatch?.[1] || 'download.pdf',
  };
};
 
export const api = {
  get:    (path)        => fetch(buildApiUrl(path), { headers: getHeaders() }).then(handleResponse),
  getBlob:(path)        => fetch(buildApiUrl(path), { headers: getHeaders() }).then(handleBlobResponse),
  post:   (path, body)  => fetch(buildApiUrl(path), { method: 'POST',   headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  put:    (path, body)  => fetch(buildApiUrl(path), { method: 'PUT',    headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  patch:  (path, body)  => fetch(buildApiUrl(path), { method: 'PATCH',  headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse),
  delete: (path)        => fetch(buildApiUrl(path), { method: 'DELETE', headers: getHeaders() }).then(handleResponse),
  upload: (path, form)  => fetch(buildApiUrl(path), { method: 'POST',   headers: getHeaders(true), body: form }).then(handleResponse),
};
 
export const buildApiUrl = (path) => {
  // Backend routes are mounted under /api (e.g. /api/gallery)
  return `${API_BASE}${path}`;
};