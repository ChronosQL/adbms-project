import React, { useState, useEffect } from 'react';

const toDateInputValue = (value) => {
    if (!value) return '';

    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return value;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    return date.toISOString().slice(0, 10);
};

const getInsuranceEndDate = (startDate) => {
    const normalizedStartDate = toDateInputValue(startDate);
    if (!normalizedStartDate) return '';

    const [year, month, day] = normalizedStartDate.split('-').map((part) => Number(part));
    const oneYearLater = new Date(Date.UTC(year + 1, month - 1, day));

    if (
        oneYearLater.getUTCFullYear() !== year + 1 ||
        oneYearLater.getUTCMonth() !== month - 1 ||
        oneYearLater.getUTCDate() !== day
    ) {
        return '';
    }

    return oneYearLater.toISOString().slice(0, 10);
};

const initialFormData = {
    category_id: '',
    vehicle_name: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    license_plate: '',
    vehicle_license: '',
    seats: 4,
    fuel_type: 'Petrol',
    transmission: 'Automatic',
    air_conditioning: true,
    luggage_capacity: 2,
    price_per_day: '',
    insurance_provider: '',
    insurance_start_date: '',
    insurance_end_date: '',
    status: 'Available',
    mileage: '',
    engine_capacity: '',
    features: '',
};

const VehicleForm = ({ isOpen, onClose, onSubmit, vehicle, categories, loading }) => {
    const [formData, setFormData] = useState(initialFormData);
    const [errors, setErrors] = useState({});
    const [imageFiles, setImageFiles] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);

    const isEditing = !!vehicle;

    useEffect(() => {
        if (vehicle) {
            setFormData({
                category_id: vehicle.category_id || '',
                vehicle_name: vehicle.vehicle_name || '',
                brand: vehicle.brand || '',
                model: vehicle.model || '',
                year: vehicle.year || new Date().getFullYear(),
                color: vehicle.color || '',
                license_plate: vehicle.license_plate || '',
                vehicle_license: vehicle.vehicle_license || '',
                seats: vehicle.seats || 4,
                fuel_type: vehicle.fuel_type || 'Petrol',
                transmission: vehicle.transmission || 'Automatic',
                air_conditioning: vehicle.air_conditioning !== false,
                luggage_capacity: vehicle.luggage_capacity || 2,
                price_per_day: vehicle.price_per_day || '',
                insurance_provider: vehicle.insurance_provider || '',
                insurance_start_date: toDateInputValue(vehicle.insurance_start_date),
                insurance_end_date: toDateInputValue(vehicle.insurance_end_date),
                status: vehicle.status || 'Available',
                mileage: vehicle.mileage || '',
                engine_capacity: vehicle.engine_capacity || '',
                features: vehicle.features || '',
            });
            setImageFiles([]);
            setImagePreviews(Array.isArray(vehicle.images) && vehicle.images.length > 0 ? vehicle.images : (vehicle.image_url ? [vehicle.image_url] : []));
        } else {
            setFormData(initialFormData);
            setImageFiles([]);
            setImagePreviews([]);
        }
        setErrors({});
    }, [vehicle, isOpen]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const nextValue = type === 'checkbox' ? checked : value;

        setFormData((prev) => {
            const nextState = {
                ...prev,
                [name]: nextValue,
            };

            if (name === 'insurance_start_date') {
                nextState.insurance_end_date = getInsuranceEndDate(nextValue);
            }

            return nextState;
        });

        // Clear error when user types
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }

        if (name === 'insurance_start_date' && errors.insurance_end_date) {
            setErrors((prev) => ({ ...prev, insurance_end_date: '' }));
        }
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files || []);
        setImageFiles(files);

        if (files.length > 0) {
            setImagePreviews(files.map((file) => URL.createObjectURL(file)));
        } else {
            setImagePreviews(Array.isArray(vehicle?.images) && vehicle.images.length > 0 ? vehicle.images : (vehicle?.image_url ? [vehicle.image_url] : []));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.category_id) newErrors.category_id = 'Category is required';
        if (!formData.vehicle_name.trim()) newErrors.vehicle_name = 'Vehicle name is required';
        if (!formData.brand.trim()) newErrors.brand = 'Brand is required';
        if (!formData.model.trim()) newErrors.model = 'Model is required';
        if (!formData.license_plate.trim()) newErrors.license_plate = 'License plate is required';
        if (!formData.vehicle_license.trim()) newErrors.vehicle_license = 'Vehicle license is required';
        if (!formData.seats || formData.seats < 1) newErrors.seats = 'Valid seat count is required';
        if (!formData.price_per_day || formData.price_per_day <= 0) newErrors.price_per_day = 'Valid price is required';
        if (!formData.insurance_provider.trim()) newErrors.insurance_provider = 'Insurance is required';
        if (!formData.insurance_start_date) newErrors.insurance_start_date = 'Insurance start date is required';
        if (!formData.insurance_end_date) newErrors.insurance_end_date = 'Insurance end date is required';

        if (formData.insurance_start_date && formData.insurance_end_date) {
            const requiredEndDate = getInsuranceEndDate(formData.insurance_start_date);
            if (!requiredEndDate) {
                newErrors.insurance_start_date = 'Insurance start date is not valid for a one-year period';
            } else if (formData.insurance_end_date !== requiredEndDate) {
                newErrors.insurance_end_date = `Insurance end date must be exactly ${requiredEndDate}`;
            }
        }

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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">
                        {isEditing ? 'Edit Vehicle' : 'Add New Vehicle'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} autoComplete="off" className="p-6 space-y-6">
                    {/* Basic Info Section */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#4F5D75] mb-3">
                            Basic Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Category */}
                            <div>
                                <label className="block text-sm font-semibold text-[#2D3142] mb-1.5">
                                    Category <span className="text-[#E0483B]">*</span>
                                </label>
                                <select
                                    name="category_id"
                                    value={formData.category_id}
                                    onChange={handleChange}
                                    className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-[#2D3142] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#EF8354]/20 focus:border-[#EF8354] transition-all ${
                                        errors.category_id ? 'border-[#E0483B]' : 'border-gray-300 hover:border-gray-400'
                                    }`}
                                >
                                    <option value="">Select Category</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.category_id && (
                                    <p className="text-[#E0483B] text-xs mt-1">{errors.category_id}</p>
                                )}
                            </div>

                            {/* Vehicle Name */}
                            <div>
                                <label className="block text-sm font-semibold text-[#2D3142] mb-1.5">
                                    Vehicle Name <span className="text-[#E0483B]">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="vehicle_name"
                                    value={formData.vehicle_name}
                                    onChange={handleChange}
                                    placeholder="e.g., Toyota Corolla 2024"
                                    className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-[#2D3142] placeholder:text-gray-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#EF8354]/20 focus:border-[#EF8354] transition-all ${
                                        errors.vehicle_name ? 'border-[#E0483B]' : 'border-gray-300 hover:border-gray-400'
                                    }`}
                                />
                                {errors.vehicle_name && (
                                    <p className="text-[#E0483B] text-xs mt-1">{errors.vehicle_name}</p>
                                )}
                            </div>

                            {/* Brand */}
                            <div>
                                <label className="block text-sm font-semibold text-[#2D3142] mb-1.5">
                                    Brand <span className="text-[#E0483B]">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="brand"
                                    value={formData.brand}
                                    onChange={handleChange}
                                    placeholder="e.g., Toyota"
                                    className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-[#2D3142] placeholder:text-gray-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#EF8354]/20 focus:border-[#EF8354] transition-all ${
                                        errors.brand ? 'border-[#E0483B]' : 'border-gray-300 hover:border-gray-400'
                                    }`}
                                />
                                {errors.brand && (
                                    <p className="text-[#E0483B] text-xs mt-1">{errors.brand}</p>
                                )}
                            </div>

                            {/* Model */}
                            <div>
                                <label className="block text-sm font-semibold text-[#2D3142] mb-1.5">
                                    Model <span className="text-[#E0483B]">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="model"
                                    value={formData.model}
                                    onChange={handleChange}
                                    placeholder="e.g., Corolla"
                                    className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-[#2D3142] placeholder:text-gray-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#EF8354]/20 focus:border-[#EF8354] transition-all ${
                                        errors.model ? 'border-[#E0483B]' : 'border-gray-300 hover:border-gray-400'
                                    }`}
                                />
                                {errors.model && (
                                    <p className="text-[#E0483B] text-xs mt-1">{errors.model}</p>
                                )}
                            </div>

                            {/* Year */}
                            <div>
                                <label className="block text-sm font-semibold text-[#2D3142] mb-1.5">Year</label>
                                <input
                                    type="number"
                                    name="year"
                                    value={formData.year}
                                    onChange={handleChange}
                                    min="1950"
                                    max={new Date().getFullYear()}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 hover:border-gray-400 bg-white text-[#2D3142] placeholder:text-gray-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#EF8354]/20 focus:border-[#EF8354] transition-all"
                                />
                            </div>

                            {/* Color */}
                            <div>
                                <label className="block text-sm font-semibold text-[#2D3142] mb-1.5">Color</label>
                                <input
                                    type="text"
                                    name="color"
                                    value={formData.color}
                                    onChange={handleChange}
                                    placeholder="e.g., White"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 hover:border-gray-400 bg-white text-[#2D3142] placeholder:text-gray-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#EF8354]/20 focus:border-[#EF8354] transition-all"
                                />
                            </div>

                            {/* License Plate */}
                            <div>
                                <label className="block text-sm font-semibold text-[#2D3142] mb-1.5">
                                    License Plate <span className="text-[#E0483B]">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="license_plate"
                                    value={formData.license_plate}
                                    onChange={handleChange}
                                    placeholder="e.g., ABC-1234"
                                    className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-[#2D3142] placeholder:text-gray-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#EF8354]/20 focus:border-[#EF8354] transition-all ${
                                        errors.license_plate ? 'border-[#E0483B]' : 'border-gray-300 hover:border-gray-400'
                                    }`}
                                />
                                {errors.license_plate && (
                                    <p className="text-[#E0483B] text-xs mt-1">{errors.license_plate}</p>
                                )}
                            </div>

                            {/* Vehicle License */}
                            <div>
                                <label className="block text-sm font-semibold text-[#2D3142] mb-1.5">
                                    Vehicle License <span className="text-[#E0483B]">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="vehicle_license"
                                    value={formData.vehicle_license}
                                    onChange={handleChange}
                                    placeholder="e.g., VH-2024-001"
                                    className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-[#2D3142] placeholder:text-gray-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#EF8354]/20 focus:border-[#EF8354] transition-all ${
                                        errors.vehicle_license ? 'border-[#E0483B]' : 'border-gray-300 hover:border-gray-400'
                                    }`}
                                />
                                {errors.vehicle_license && (
                                    <p className="text-[#E0483B] text-xs mt-1">{errors.vehicle_license}</p>
                                )}
                            </div>

                            {/* Price Per Day */}
                            <div>
                                <label className="block text-sm font-semibold text-[#2D3142] mb-1.5">
                                    Price Per Day (LKR) <span className="text-[#E0483B]">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="price_per_day"
                                    value={formData.price_per_day}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                    placeholder="e.g., 50.00"
                                    className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-[#2D3142] placeholder:text-gray-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#EF8354]/20 focus:border-[#EF8354] transition-all ${
                                        errors.price_per_day ? 'border-[#E0483B]' : 'border-gray-300 hover:border-gray-400'
                                    }`}
                                />
                                {errors.price_per_day && (
                                    <p className="text-[#E0483B] text-xs mt-1">{errors.price_per_day}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Vehicle Specs Section */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#4F5D75] mb-3">
                            Specifications
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Seats */}
                            <div>
                                <label className="block text-sm font-semibold text-[#2D3142] mb-1.5">
                                    Seats <span className="text-[#E0483B]">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="seats"
                                    value={formData.seats}
                                    onChange={handleChange}
                                    min="1"
                                    max="50"
                                    className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-[#2D3142] placeholder:text-gray-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#EF8354]/20 focus:border-[#EF8354] transition-all ${
                                        errors.seats ? 'border-[#E0483B]' : 'border-gray-300 hover:border-gray-400'
                                    }`}
                                />
                                {errors.seats && (
                                    <p className="text-[#E0483B] text-xs mt-1">{errors.seats}</p>
                                )}
                            </div>

                            {/* Fuel Type */}
                            <div>
                                <label className="block text-sm font-semibold text-[#2D3142] mb-1.5">Fuel Type</label>
                                <select
                                    name="fuel_type"
                                    value={formData.fuel_type}
                                    onChange={handleChange}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 hover:border-gray-400 bg-white text-[#2D3142] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#EF8354]/20 focus:border-[#EF8354] transition-all"
                                >
                                    <option value="Petrol">Petrol</option>
                                    <option value="Diesel">Diesel</option>
                                    <option value="Electric">Electric</option>
                                    <option value="Hybrid">Hybrid</option>
                                </select>
                            </div>

                            {/* Transmission */}
                            <div>
                                <label className="block text-sm font-semibold text-[#2D3142] mb-1.5">Transmission</label>
                                <select
                                    name="transmission"
                                    value={formData.transmission}
                                    onChange={handleChange}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 hover:border-gray-400 bg-white text-[#2D3142] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#EF8354]/20 focus:border-[#EF8354] transition-all"
                                >
                                    <option value="Automatic">Automatic</option>
                                    <option value="Manual">Manual</option>
                                </select>
                            </div>

                            {/* Luggage Capacity */}
                            <div>
                                <label className="block text-sm font-semibold text-[#2D3142] mb-1.5">Luggage Capacity</label>
                                <input
                                    type="number"
                                    name="luggage_capacity"
                                    value={formData.luggage_capacity}
                                    onChange={handleChange}
                                    min="0"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 hover:border-gray-400 bg-white text-[#2D3142] placeholder:text-gray-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#EF8354]/20 focus:border-[#EF8354] transition-all"
                                />
                            </div>

                            {/* Mileage */}
                            <div>
                                <label className="block text-sm font-semibold text-[#2D3142] mb-1.5">Mileage</label>
                                <input
                                    type="text"
                                    name="mileage"
                                    value={formData.mileage}
                                    onChange={handleChange}
                                    placeholder="e.g., 15 km/l"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 hover:border-gray-400 bg-white text-[#2D3142] placeholder:text-gray-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#EF8354]/20 focus:border-[#EF8354] transition-all"
                                />
                            </div>

                            {/* Engine Capacity */}
                            <div>
                                <label className="block text-sm font-semibold text-[#2D3142] mb-1.5">Engine Capacity</label>
                                <input
                                    type="text"
                                    name="engine_capacity"
                                    value={formData.engine_capacity}
                                    onChange={handleChange}
                                    placeholder="e.g., 1500cc"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 hover:border-gray-400 bg-white text-[#2D3142] placeholder:text-gray-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#EF8354]/20 focus:border-[#EF8354] transition-all"
                                />
                            </div>

                            {/* Insurance Provider */}
                            <div>
                                <label className="block text-sm font-semibold text-[#2D3142] mb-1.5">
                                    Insurance <span className="text-[#E0483B]">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="insurance_provider"
                                    value={formData.insurance_provider}
                                    onChange={handleChange}
                                    placeholder="e.g., Sri Lanka Insurance"
                                    className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-[#2D3142] placeholder:text-gray-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#EF8354]/20 focus:border-[#EF8354] transition-all ${
                                        errors.insurance_provider ? 'border-[#E0483B]' : 'border-gray-300 hover:border-gray-400'
                                    }`}
                                />
                                {errors.insurance_provider && (
                                    <p className="text-[#E0483B] text-xs mt-1">{errors.insurance_provider}</p>
                                )}
                            </div>

                            {/* Insurance Dates */}
                            <div>
                                <label className="block text-sm font-semibold text-[#2D3142] mb-1.5">
                                    Insurance Start Date <span className="text-[#E0483B]">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="insurance_start_date"
                                    value={formData.insurance_start_date}
                                    onChange={handleChange}
                                    style={{ colorScheme: 'light', backgroundColor: '#FFFFFF', color: '#2D3142' }}
                                    className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-[#2D3142] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#EF8354]/20 focus:border-[#EF8354] transition-all cursor-pointer ${
                                        errors.insurance_start_date ? 'border-[#E0483B]' : 'border-gray-300 hover:border-gray-400'
                                    }`}
                                />
                                {errors.insurance_start_date && (
                                    <p className="text-[#E0483B] text-xs mt-1">{errors.insurance_start_date}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-[#2D3142] mb-1.5">
                                    Insurance End Date <span className="text-[#E0483B]">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="insurance_end_date"
                                    value={formData.insurance_end_date}
                                    onChange={handleChange}
                                    min={formData.insurance_start_date ? getInsuranceEndDate(formData.insurance_start_date) : undefined}
                                    max={formData.insurance_start_date ? getInsuranceEndDate(formData.insurance_start_date) : undefined}
                                    style={{ colorScheme: 'light', backgroundColor: '#FFFFFF', color: '#2D3142' }}
                                    className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-[#2D3142] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#EF8354]/20 focus:border-[#EF8354] transition-all cursor-pointer ${
                                        errors.insurance_end_date ? 'border-[#E0483B]' : 'border-gray-300 hover:border-gray-400'
                                    }`}
                                />
                                {formData.insurance_start_date && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Insurance must end exactly 1 year later ({getInsuranceEndDate(formData.insurance_start_date)}).
                                    </p>
                                )}
                                {errors.insurance_end_date && (
                                    <p className="text-[#E0483B] text-xs mt-1">{errors.insurance_end_date}</p>
                                )}
                            </div>
                        </div>

                        {/* Air Conditioning & Status */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="air_conditioning"
                                    checked={formData.air_conditioning}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-[#EF8354] border-gray-300 rounded focus:ring-[#EF8354] cursor-pointer"
                                />
                                <label className="ml-2 text-sm font-semibold text-[#2D3142] cursor-pointer">
                                    Air Conditioning
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-[#2D3142] mb-1.5">Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 hover:border-gray-400 bg-white text-[#2D3142] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#EF8354]/20 focus:border-[#EF8354] transition-all"
                                >
                                    <option value="Available">Available</option>
                                    <option value="Booked">Booked</option>
                                    <option value="Maintenance">Maintenance</option>
                                    <option value="Retired">Retired</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Additional Info Section */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#4F5D75] mb-3">
                            Additional Information
                        </h3>
                        <div className="space-y-4">
                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-semibold text-[#2D3142] mb-1.5">Vehicle Images</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageChange}
                                    className="w-full rounded-xl border border-gray-300 hover:border-gray-400 bg-white text-[#2D3142] px-3.5 py-2.5 text-sm file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#EF8354]/10 file:text-[#EF8354] hover:file:bg-[#EF8354]/20 focus:outline-none focus:border-[#EF8354] focus:ring-2 focus:ring-[#EF8354]/20"
                                />
                                <p className="text-xs text-gray-500 mt-1">Choose one or more images from your PC. They will be uploaded to Cloudinary.</p>
                                {imagePreviews.length > 0 && (
                                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {imagePreviews.map((preview, index) => (
                                            <div key={index} className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50 h-28">
                                                <img src={preview} alt={`Vehicle preview ${index + 1}`} className="h-full w-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Features */}
                            <div>
                                <label className="block text-sm font-semibold text-[#2D3142] mb-1.5">
                                    Features (comma separated)
                                </label>
                                <textarea
                                    name="features"
                                    value={formData.features}
                                    onChange={handleChange}
                                    rows="3"
                                    placeholder="e.g., GPS Navigation, Bluetooth, Backup Camera, USB Charging"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 hover:border-gray-400 bg-white text-[#2D3142] placeholder:text-gray-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#EF8354]/20 focus:border-[#EF8354] transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-[#4F5D75] font-semibold text-sm rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 bg-[#EF8354] hover:bg-[#d96e41] text-white font-bold text-sm rounded-xl transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading && (
                                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                            )}
                            {isEditing ? 'Update Vehicle' : 'Add Vehicle'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VehicleForm;