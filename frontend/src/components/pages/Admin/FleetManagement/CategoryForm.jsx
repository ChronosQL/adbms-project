import React, { useEffect, useState } from 'react';

const initialFormData = {
    name: '',
    description: '',
    passenger_capacity: '',
    luggage_capacity: '',
    best_for: '',
    comfort_level: '',
    ideal_trip_types: '',
    ac_available: false,
};

const CategoryForm = ({ isOpen, onClose, onSubmit, category, loading }) => {
    const [formData, setFormData] = useState(initialFormData);
    const [errors, setErrors] = useState({});
    const [imageFiles, setImageFiles] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);

    const isEditing = !!category;

    useEffect(() => {
        if (category) {
            setFormData({
                name: category.name || '',
                description: category.description || '',
                passenger_capacity: category.passenger_capacity || '',
                luggage_capacity: category.luggage_capacity || '',
                best_for: category.best_for || '',
                comfort_level: category.comfort_level || '',
                ideal_trip_types: category.ideal_trip_types || '',
                ac_available: category.ac_available || false,
            });
            setImageFiles([]);
            const initialImages = category.images || (category.image_url ? [category.image_url] : []);
            setImagePreviews(initialImages);
        } else {
            setFormData(initialFormData);
            setImageFiles([]);
            setImagePreviews([]);
        }
        setErrors({});
    }, [category, isOpen]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : value 
        }));

        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files || []);
        setImageFiles(files);

        if (files.length > 0) {
            const previews = files.map(file => URL.createObjectURL(file));
            setImagePreviews(previews);
        } else {
            const initialImages = category?.images || (category?.image_url ? [category.image_url] : []);
            setImagePreviews(initialImages);
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.name.trim()) newErrors.name = 'Category name is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (validate()) {
            onSubmit({ ...formData, imageFiles });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto no-scrollbar rounded-2xl bg-white shadow-2xl">
                <div className="sticky top-0 flex items-center justify-between rounded-t-2xl border-b border-gray-200 bg-white px-6 py-4">
                    <h2 className="text-xl font-bold text-gray-800">
                        {isEditing ? 'Edit Category' : 'Add Category'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 transition-colors hover:text-gray-600">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2">
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Category Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g., Luxury SUV"
                                className={`w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
                                    errors.name ? 'border-red-500' : 'border-gray-300'
                                }`}
                            />
                            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Passenger Capacity</label>
                            <input
                                type="text"
                                name="passenger_capacity"
                                value={formData.passenger_capacity}
                                onChange={handleChange}
                                placeholder="e.g., 2-3 passengers"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Luggage Capacity</label>
                            <input
                                type="text"
                                name="luggage_capacity"
                                value={formData.luggage_capacity}
                                onChange={handleChange}
                                placeholder="e.g., 2-3 luggages"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Best For</label>
                            <input
                                type="text"
                                name="best_for"
                                value={formData.best_for}
                                onChange={handleChange}
                                placeholder="e.g., Families, Couples"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Comfort Level</label>
                            <input
                                type="text"
                                name="comfort_level"
                                value={formData.comfort_level}
                                onChange={handleChange}
                                placeholder="e.g., Premium, Standard"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="mb-1 block text-sm font-medium text-gray-700">Ideal Trip Types</label>
                            <input
                                type="text"
                                name="ideal_trip_types"
                                value={formData.ideal_trip_types}
                                onChange={handleChange}
                                placeholder="e.g., City Tours, Airport Transfers"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="ac_available"
                                    checked={formData.ac_available}
                                    onChange={handleChange}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                                />
                                AC Available
                            </label>
                        </div>

                        <div className="md:col-span-2">
                            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="3"
                                placeholder="Short description about this category"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="mb-1 block text-sm font-medium text-gray-700">Category Images</label>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageChange}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="mt-1 text-xs text-gray-500">Choose images from your PC for this category.</p>
                            {imagePreviews.length > 0 && (
                                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {imagePreviews.map((preview, index) => (
                                        <div key={index} className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 h-24">
                                            <img src={preview} alt={`Preview ${index + 1}`} className="h-full w-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg bg-gray-100 px-6 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading && (
                                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                            )}
                            {isEditing ? 'Update Category' : 'Add Category'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CategoryForm;