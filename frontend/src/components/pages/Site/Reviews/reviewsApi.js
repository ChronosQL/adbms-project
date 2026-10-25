import { buildApiUrl } from '../../../../config/api';

const getJson = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.message || 'Request failed.';
    throw new Error(message);
  }
  return data;
};

export const fetchPublishedReviews = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.stars && filters.stars !== 'All') params.set('stars', String(filters.stars));
  if (filters.tourType) params.set('tourType', String(filters.tourType));
  if (filters.sort) params.set('sort', String(filters.sort));
  if (filters.email) params.set('email', String(filters.email));
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));

  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(buildApiUrl(`/reviews${query}`));
  const data = await getJson(res);
  const reviews = Array.isArray(data.reviews) ? data.reviews : [];
  reviews.pagination = data.pagination || null;
  return reviews;
};

export const fetchMyReviews = async (token, params = {}) => {
  const q = new URLSearchParams();
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));
  const query = q.toString() ? `?${q.toString()}` : '';

  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(buildApiUrl(`/reviews/my${query}`), { credentials: 'include', headers });
  const data = await getJson(res);
  const reviews = Array.isArray(data.reviews) ? data.reviews : [];
  reviews.pagination = data.pagination || null;
  return reviews;
};

export const fetchReviewStats = async () => {
  const res = await fetch(buildApiUrl('/reviews/stats'));
  const data = await getJson(res);
  return data || { avg: 0, average: 0, total: 0, ratingSum: 0, breakdown: {} };
};

export const fetchReviewableTours = async (email) => {
  const res = await fetch(buildApiUrl(`/reviews/reviewable-tours?email=${encodeURIComponent(email)}`));
  const data = await getJson(res);
  return data.tours || [];
};

export const createReview = async (payload) => {
  const formData = new FormData();

  formData.append('customerEmail', payload.customerEmail || '');
  formData.append('bookingId', payload.bookingId || '');
  formData.append('stars', String(payload.stars || ''));
  formData.append('driverName', payload.driverName || '');
  formData.append('title', payload.title || '');
  formData.append('comment', payload.comment || '');
  formData.append('tourTitle', payload.tourTitle || '');
  formData.append('tourType', payload.tourType || '');

  (payload.images || []).forEach((image) => {
    if (image instanceof File) {
      formData.append('images', image);
    }
  });

  const res = await fetch(buildApiUrl('/reviews'), {
    method: 'POST',
    body: formData,
  });
  return getJson(res);
};
