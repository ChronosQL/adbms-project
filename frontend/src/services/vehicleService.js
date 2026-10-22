import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: `${API_BASE_URL}/vehicles`,
    headers: {
        'Content-Type': 'application/json',
    },
});

const toVehiclePayload = (vehicleData) => {
    if (vehicleData instanceof FormData) {
        return vehicleData;
    }

    const imageFiles = vehicleData?.imageFiles || vehicleData?.images;
    const hasFiles = Array.isArray(imageFiles) ? imageFiles.some(f => f instanceof File) : (imageFiles instanceof File);
    const legacyImage = vehicleData?.imageFile || vehicleData?.image;
    const hasLegacy = legacyImage instanceof File;

    if (hasFiles || hasLegacy) {
        const formData = new FormData();
        Object.entries(vehicleData).forEach(([key, value]) => {
            if (value == null) return;
            if (key === 'imageFiles' || key === 'images') {
                if (Array.isArray(value)) {
                    value.forEach(file => {
                        if (file instanceof File) {
                            formData.append('images', file);
                        }
                    });
                } else if (value instanceof File) {
                    formData.append('images', value);
                }
                return;
            }
            if (key === 'imageFile' || key === 'image') {
                if (value instanceof File) {
                    formData.append('images', value); // append to images array for backend
                }
                return;
            }
            // Ignore pre-existing image strings if we don't want them overriding, or append them if they are strings
            if (key === 'image_url' && Array.isArray(value)) {
                formData.append('image_url', JSON.stringify(value));
                return;
            }
            if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof File)) {
                formData.append(key, JSON.stringify(value));
            } else {
                formData.append(key, value);
            }
        });
        return formData;
    }

    return vehicleData;
};

const toCategoryPayload = (categoryData) => {
    if (categoryData instanceof FormData) {
        return categoryData;
    }

    const imageFiles = categoryData?.imageFiles || categoryData?.images || categoryData?.imageFile;
    const hasFiles = Array.isArray(imageFiles) ? imageFiles.some(f => f instanceof File) : (imageFiles instanceof File);
    
    if (hasFiles) {
        const formData = new FormData();
        Object.entries(categoryData).forEach(([key, value]) => {
            if (value == null) return;
            if (key === 'imageFiles' || key === 'images' || key === 'imageFile') {
                if (Array.isArray(value)) {
                    value.forEach(file => {
                        if (file instanceof File) {
                            formData.append('images', file);
                        }
                    });
                } else if (value instanceof File) {
                    formData.append('images', value);
                }
                return;
            }
            if (key === 'image_url' && Array.isArray(value)) {
                formData.append('image_url', JSON.stringify(value));
                return;
            }
            if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof File)) {
                formData.append(key, JSON.stringify(value));
            } else {
                formData.append(key, value);
            }
        });
        return formData;
    }

    return categoryData;
};

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('cbt_token') || localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ==================== CATEGORY API ====================
export const categoryService = {
    getAll: async () => {
        const response = await api.get('/categories');
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/categories/${id}`);
        return response.data;
    },

    create: async (categoryData) => {
        const payload = toCategoryPayload(categoryData);
        const response = await api.post('/categories', payload, payload instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined);
        return response.data;
    },

    update: async (id, categoryData) => {
        const payload = toCategoryPayload(categoryData);
        const response = await api.put(`/categories/${id}`, payload, payload instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/categories/${id}`);
        return response.data;
    },
};

// ==================== VEHICLE API ====================
export const vehicleService = {
    getAll: async (params = {}) => {
        const response = await api.get('/', { params });
        return response.data;
    },

    getByCategory: async (categoryId) => {
        const response = await api.get(`/category/${categoryId}`);
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/${id}`);
        return response.data;
    },

    create: async (vehicleData) => {
        const payload = toVehiclePayload(vehicleData);
        const response = await api.post('/', payload, payload instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined);
        return response.data;
    },

    update: async (id, vehicleData) => {
        const payload = toVehiclePayload(vehicleData);
        const response = await api.put(`/${id}`, payload, payload instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/${id}`);
        return response.data;
    },

    getStats: async () => {
        const response = await api.get('/stats');
        return response.data;
    },
};