const db = require('../db/connection');
const { parsePagination } = require('../utils/paginate');

const DEFAULT_CATEGORIES = [
  { name: 'Mini Car', description: 'Compact cars for city travel.' },
  { name: 'Normal Car', description: 'Standard cars for everyday trips.' },
  { name: 'Sedan Car', description: 'Comfortable sedans for longer rides.' },
  { name: 'MPV', description: 'Multi-purpose vehicles for groups.' },
  { name: 'SUV', description: 'Spacious vehicles for rougher roads.' },
  { name: 'Mini Van', description: 'Practical vans for families.' },
  { name: 'Van', description: 'Large vans for passenger transport.' },
  { name: 'Large Van', description: 'High-capacity vans for bigger groups.' },
];

const STATUS_LABELS = {
  AVAILABLE: 'Available',
  BOOKED: 'Booked',
  MAINTENANCE: 'Maintenance',
};

const normalizeStatus = (status) => {
  const normalized = String(status || 'AVAILABLE').trim().toUpperCase();
  return STATUS_LABELS[normalized] ? normalized : 'AVAILABLE';
};

const toStatusLabel = (status) => STATUS_LABELS[normalizeStatus(status)];

const safeNumber = (value) => {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const toDateOnly = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  const asString = String(value).trim();
  if (!asString) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(asString)) {
    return asString;
  }

  const parsed = new Date(asString);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toISOString().slice(0, 10);
};

const addOneYearToDate = (dateOnly) => {
  const normalizedDate = toDateOnly(dateOnly);
  if (!normalizedDate) return null;

  const [year, month, day] = normalizedDate.split('-').map((part) => Number(part));
  const nextYearDate = new Date(Date.UTC(year + 1, month - 1, day));

  if (
    nextYearDate.getUTCFullYear() !== year + 1 ||
    nextYearDate.getUTCMonth() !== month - 1 ||
    nextYearDate.getUTCDate() !== day
  ) {
    return null;
  }

  return nextYearDate.toISOString().slice(0, 10);
};

const validateInsurancePeriod = (startDate, endDate) => {
  const normalizedStartDate = toDateOnly(startDate);
  if (!normalizedStartDate) {
    return { valid: false, message: 'Valid insurance_start_date is required.' };
  }

  const requiredEndDate = addOneYearToDate(normalizedStartDate);
  if (!requiredEndDate) {
    return { valid: false, message: 'insurance_start_date is invalid for a one-year insurance period.' };
  }

  const normalizedEndDate = toDateOnly(endDate) || requiredEndDate;

  if (normalizedEndDate !== requiredEndDate) {
    return {
      valid: false,
      message: `insurance_end_date must be exactly 1 year after insurance_start_date (${requiredEndDate}).`,
    };
  }

  return {
    valid: true,
    normalizedStartDate,
    normalizedEndDate,
  };
};

const isInsuranceExpired = (startDate, endDate) => {
  const today = new Date().toISOString().slice(0, 10);

  const normalizedStartDate = toDateOnly(startDate);
  if (normalizedStartDate) {
    const oneYearEndDate = addOneYearToDate(normalizedStartDate);
    if (oneYearEndDate) {
      return today > oneYearEndDate;
    }
  }

  const normalizedEndDate = toDateOnly(endDate);
  if (!normalizedEndDate) return false;

  return today > normalizedEndDate;
};

const mapCategory = (row) => ({
  id: row.category_id,
  name: row.category_name,
  description: row.description || '',
  image_url: (() => {
    try {
      const parsed = JSON.parse(row.image_url);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : (row.image_url || null);
    } catch (e) {
      return row.image_url || null;
    }
  })(),
  images: (() => {
    if (!row.image_url) return [];
    try {
      const parsed = JSON.parse(row.image_url);
      return Array.isArray(parsed) ? parsed : [row.image_url];
    } catch (e) {
      return [row.image_url];
    }
  })(),
  passenger_capacity: row.passenger_capacity || '',
  luggage_capacity: row.luggage_capacity || '',
  best_for: row.best_for || '',
  comfort_level: row.comfort_level || '',
  ac_available: Boolean(row.ac_available),
  ideal_trip_types: row.ideal_trip_types || '',
  vehicle_count: Number(row.vehicle_count || 0),
});

const mapVehicle = (row) => ({
  id: row.vehicle_id,
  category_id: row.category_id,
  category_name: row.category_name || '',
  vehicle_name: row.vehicle_name || row.name || '',
  brand: row.brand || '',
  model: row.model || '',
  year: row.manufactured_year || null,
  color: row.color || '',
  license_plate: row.vehicle_number || '',
  seats: row.adult_seats || 0,
  fuel_type: row.fuel_type || '',
  transmission: row.transmission || '',
  air_conditioning: Boolean(row.air_conditioning),
  luggage_capacity: row.luggage_capacity || 0,
  price_per_day: row.price_per_day != null ? Number(row.price_per_day) : null,
  vehicle_license: row.vehicle_license || '',
  insurance_provider: row.insurance_provider || '',
  insurance_start_date: toDateOnly(row.insurance_start_date),
  insurance_end_date: toDateOnly(row.insurance_end_date),
  insurance_expired: isInsuranceExpired(row.insurance_start_date, row.insurance_end_date),
  status: toStatusLabel(row.vehicle_status),
  image_url: (() => {
    try {
      const parsed = JSON.parse(row.image_url);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : (row.image_url || '');
    } catch (e) {
      return row.image_url || '';
    }
  })(),
  images: (() => {
    if (!row.image_url) return [];
    try {
      const parsed = JSON.parse(row.image_url);
      return Array.isArray(parsed) ? parsed : [row.image_url];
    } catch (e) {
      return [row.image_url];
    }
  })(),
  mileage: row.mileage || null,
  engine_capacity: row.engine_capacity || '',
  features: row.features || '',
});

const ensureDefaultCategories = async () => {
  const { rows: existingRows } = await db.query('SELECT category_name FROM vehicle_category');
  const existingNames = new Set(existingRows.map((row) => row.category_name));
  const missing = DEFAULT_CATEGORIES.filter((category) => !existingNames.has(category.name));

  if (missing.length === 0) return;

  for (const category of missing) {
    await db.query(
      'INSERT INTO vehicle_category (category_name, description) VALUES ($1, $2)',
      [category.name, category.description]
    );
  }
};

exports.listCategories = async (_req, res) => {
  try {
    await ensureDefaultCategories();

    const { rows } = await db.query(`
      SELECT
        vc.category_id,
        vc.category_name,
        vc.description,
        vc.image_url,
        vc.passenger_capacity,
        vc.luggage_capacity,
        vc.best_for,
        vc.comfort_level,
        vc.ac_available,
        vc.ideal_trip_types,
        COUNT(v.vehicle_id) AS vehicle_count
      FROM vehicle_category vc
      LEFT JOIN vehicle v ON v.category_id = vc.category_id
      GROUP BY vc.category_id, vc.category_name, vc.description, vc.image_url, vc.passenger_capacity, vc.luggage_capacity, vc.best_for, vc.comfort_level, vc.ac_available, vc.ideal_trip_types
      ORDER BY vc.category_id ASC
    `);

    res.json({ success: true, data: rows.map(mapCategory) });
  } catch (error) {
    console.error('listCategories error:', error);
    res.status(500).json({ success: false, message: 'Failed to load categories.' });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT
        vc.category_id,
        vc.category_name,
        vc.description,
        vc.image_url,
        vc.passenger_capacity,
        vc.luggage_capacity,
        vc.best_for,
        vc.comfort_level,
        vc.ac_available,
        vc.ideal_trip_types,
        COUNT(v.vehicle_id) AS vehicle_count
      FROM vehicle_category vc
      LEFT JOIN vehicle v ON v.category_id = vc.category_id
      WHERE vc.category_id = $1
      GROUP BY vc.category_id, vc.category_name, vc.description, vc.image_url, vc.passenger_capacity, vc.luggage_capacity, vc.best_for, vc.comfort_level, vc.ac_available, vc.ideal_trip_types
      LIMIT 1`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    res.json({ success: true, data: mapCategory(rows[0]) });
  } catch (error) {
    console.error('getCategoryById error:', error);
    res.status(500).json({ success: false, message: 'Failed to load category.' });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description = '', image_url, passenger_capacity, luggage_capacity, best_for, comfort_level, ac_available, ideal_trip_types } = req.body;
    const uploadedImageUrls = req.files ? req.files.map(file => file.path || file.url || file.secure_url || file.location || file.filename) : [];
    let existingUrls = [];
    if (image_url) {
      try {
        const parsed = JSON.parse(image_url);
        existingUrls = Array.isArray(parsed) ? parsed : [image_url];
      } catch(e) {
        existingUrls = [image_url];
      }
    }
    const allUrls = [...existingUrls, ...uploadedImageUrls].filter(Boolean);
    const resolvedImageUrl = allUrls.length > 0 ? JSON.stringify(allUrls) : null;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const { rows } = await db.query(
      `INSERT INTO vehicle_category (category_name, description, image_url, passenger_capacity, luggage_capacity, best_for, comfort_level, ac_available, ideal_trip_types)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING category_id`,
      [
        name,
        description || null,
        resolvedImageUrl,
        passenger_capacity || null,
        luggage_capacity || null,
        best_for || null,
        comfort_level || null,
        (ac_available === 'true' || ac_available === true) ? true : false,
        ideal_trip_types || null
      ]
    );

    res.status(201).json({
      success: true,
      data: {
        id: rows[0].category_id,
        name,
        description: description || '',
        image_url: resolvedImageUrl,
        passenger_capacity: passenger_capacity || '',
        luggage_capacity: luggage_capacity || '',
        best_for: best_for || '',
        comfort_level: comfort_level || '',
        ac_available: ac_available === 'true' || ac_available === true,
        ideal_trip_types: ideal_trip_types || '',
        vehicle_count: 0,
      },
    });
  } catch (error) {
    console.error('createCategory error:', error);
    res.status(500).json({ success: false, message: 'Failed to create category.' });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { name, description = '', image_url, passenger_capacity, luggage_capacity, best_for, comfort_level, ac_available, ideal_trip_types } = req.body;
    const uploadedImageUrls = req.files ? req.files.map(file => file.path || file.url || file.secure_url || file.location || file.filename) : [];

    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const { rows: existingRows } = await db.query(
      'SELECT image_url FROM vehicle_category WHERE category_id = $1 LIMIT 1',
      [req.params.id]
    );

    if (!existingRows.length) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    let newUrls = [];
    if (image_url) {
      try {
        const parsed = JSON.parse(image_url);
        newUrls = Array.isArray(parsed) ? parsed : [image_url];
      } catch(e) {
        newUrls = [image_url];
      }
    }
    const allUrls = [...newUrls, ...uploadedImageUrls].filter(Boolean);
    let resolvedImageUrl = allUrls.length > 0 ? JSON.stringify(allUrls) : null;
    if (!resolvedImageUrl && existingRows[0].image_url) {
        resolvedImageUrl = existingRows[0].image_url;
    }

    const { rowCount } = await db.query(
      `UPDATE vehicle_category SET category_name = $1, description = $2, image_url = $3, passenger_capacity = $4, luggage_capacity = $5, best_for = $6, comfort_level = $7, ac_available = $8, ideal_trip_types = $9 WHERE category_id = $10`,
      [
        name,
        description || null,
        resolvedImageUrl,
        passenger_capacity || null,
        luggage_capacity || null,
        best_for || null,
        comfort_level || null,
        (ac_available === 'true' || ac_available === true) ? true : false,
        ideal_trip_types || null,
        req.params.id
      ]
    );

    if (rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    res.json({ success: true, message: 'Category updated successfully.' });
  } catch (error) {
    console.error('updateCategory error:', error);
    res.status(500).json({ success: false, message: 'Failed to update category.' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { rowCount } = await db.query('DELETE FROM vehicle_category WHERE category_id = $1', [req.params.id]);

    if (rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    res.json({ success: true, message: 'Category deleted successfully.' });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(409).json({ success: false, message: 'Category is in use by existing vehicles.' });
    }

    console.error('deleteCategory error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete category.' });
  }
};

exports.listVehicles = async (req, res) => {
  const { page, limit, offset, buildPagination } = parsePagination(req.query, 12, 100);
  const isPaginated = req.query.page !== undefined || req.query.limit !== undefined;

  try {
    let sql = `
      SELECT
        v.vehicle_id,
        v.category_id,
        vc.category_name,
        v.vehicle_number,
        v.name AS vehicle_name,
        v.color,
        v.manufactured_year,
        v.adult_seats,
        v.baby_seats,
        v.luggage_capacity,
        v.price_per_day,
        v.vehicle_license,
        v.insurance_provider,
        v.insurance_start_date,
        v.insurance_end_date,
        v.image_url,
        v.vehicle_status,
        v.brand,
        v.model,
        v.fuel_type,
        v.transmission,
        v.air_conditioning,
        v.mileage,
        v.engine_capacity,
        v.features,
        COUNT(*) OVER()::integer AS total_count
      FROM vehicle v
      LEFT JOIN vehicle_category vc ON vc.category_id = v.category_id
      ORDER BY v.vehicle_id DESC
    `;
    const params = [];

    if (isPaginated) {
      sql += ` LIMIT $1 OFFSET $2`;
      params.push(limit, offset);
    }

    const { rows } = await db.query(sql, params);
    const totalCount = rows.length > 0 ? rows[0].total_count : 0;
    const pagination = buildPagination(totalCount);

    res.json({ success: true, data: rows.map(mapVehicle), pagination });
  } catch (error) {
    console.error('listVehicles error:', error);
    res.status(500).json({ success: false, message: 'Failed to load vehicles.' });
  }
};

exports.listVehiclesByCategory = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT
        v.vehicle_id,
        v.category_id,
        vc.category_name,
        v.vehicle_number,
        v.name AS vehicle_name,
        v.color,
        v.manufactured_year,
        v.adult_seats,
        v.baby_seats,
        v.luggage_capacity,
        v.price_per_day,
        v.vehicle_license,
        v.insurance_provider,
        v.insurance_start_date,
        v.insurance_end_date,
        v.image_url,
        v.vehicle_status,
        v.brand,
        v.model,
        v.fuel_type,
        v.transmission,
        v.air_conditioning,
        v.mileage,
        v.engine_capacity,
        v.features
      FROM vehicle v
      LEFT JOIN vehicle_category vc ON vc.category_id = v.category_id
      WHERE v.category_id = $1
      ORDER BY v.vehicle_id DESC`,
      [req.params.categoryId]
    );

    res.json({ success: true, data: rows.map(mapVehicle) });
  } catch (error) {
    console.error('listVehiclesByCategory error:', error);
    res.status(500).json({ success: false, message: 'Failed to load vehicles.' });
  }
};

exports.getVehicleById = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT
        v.vehicle_id,
        v.category_id,
        vc.category_name,
        v.vehicle_number,
        v.name AS vehicle_name,
        v.color,
        v.manufactured_year,
        v.adult_seats,
        v.baby_seats,
        v.luggage_capacity,
        v.price_per_day,
        v.vehicle_license,
        v.insurance_provider,
        v.insurance_start_date,
        v.insurance_end_date,
        v.image_url,
        v.vehicle_status,
        v.brand,
        v.model,
        v.fuel_type,
        v.transmission,
        v.air_conditioning,
        v.mileage,
        v.engine_capacity,
        v.features
      FROM vehicle v
      LEFT JOIN vehicle_category vc ON vc.category_id = v.category_id
      WHERE v.vehicle_id = $1
      LIMIT 1`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    res.json({ success: true, data: mapVehicle(rows[0]) });
  } catch (error) {
    console.error('getVehicleById error:', error);
    res.status(500).json({ success: false, message: 'Failed to load vehicle.' });
  }
};

exports.createVehicle = async (req, res) => {
  try {
    const {
      category_id,
      vehicle_name,
      name,
      license_plate,
      vehicle_number,
      color,
      year,
      manufactured_year,
      seats,
      adult_seats,
      luggage_capacity,
      price_per_day,
      vehicle_license,
      insurance_provider,
      insurance_start_date,
      insurance_end_date,
      image_url,
      status,
      brand,
      model,
      fuel_type,
      transmission,
      air_conditioning,
      mileage,
      engine_capacity,
      features,
    } = req.body;
    const uploadedImageUrls = req.files ? req.files.map(file => file.path || file.url || file.secure_url || file.location || file.filename) : [];
    let existingUrls = [];
    if (image_url) {
      try {
        const parsed = JSON.parse(image_url);
        existingUrls = Array.isArray(parsed) ? parsed : [image_url];
      } catch(e) {
        existingUrls = [image_url];
      }
    }
    const allUrls = [...existingUrls, ...uploadedImageUrls].filter(Boolean);
    const resolvedImageUrl = allUrls.length > 0 ? JSON.stringify(allUrls) : null;

    const resolvedCategoryId = safeNumber(category_id);
    if (!resolvedCategoryId) {
      return res.status(400).json({ success: false, message: 'category_id is required.' });
    }

    const vehicleLabel = vehicle_name || name || '';
    const plateNumber = license_plate || vehicle_number || '';
    const resolvedYear = safeNumber(year || manufactured_year);

    if (resolvedYear != null && resolvedYear < 1950) {
      return res.status(400).json({ success: false, message: 'manufactured_year must be 1950 or later.' });
    }

    if (!vehicleLabel || !plateNumber || !vehicle_license || !insurance_provider || !insurance_start_date) {
      return res.status(400).json({
        success: false,
        message: 'vehicle_name, license_plate, vehicle_license, insurance_provider, and insurance_start_date are required.',
      });
    }

    const insuranceValidation = validateInsurancePeriod(insurance_start_date, insurance_end_date);
    if (!insuranceValidation.valid) {
      return res.status(400).json({ success: false, message: insuranceValidation.message });
    }

    const { rows: categoryRows } = await db.query('SELECT category_id FROM vehicle_category WHERE category_id = $1 LIMIT 1', [resolvedCategoryId]);
    if (!categoryRows.length) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    const { rows } = await db.query(
      `INSERT INTO vehicle (
        category_id,
        vehicle_number,
        name,
        color,
        manufactured_year,
        adult_seats,
        baby_seats,
        luggage_capacity,
        price_per_day,
        vehicle_license,
        insurance_provider,
        insurance_start_date,
        insurance_end_date,
        image_url,
        vehicle_status,
        brand,
        model,
        fuel_type,
        transmission,
        air_conditioning,
        mileage,
        engine_capacity,
        features
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
      RETURNING vehicle_id`,
      [
        resolvedCategoryId,
        plateNumber,
        vehicleLabel,
        color || null,
        safeNumber(year || manufactured_year),
        safeNumber(seats || adult_seats) || 0,
        0,
        safeNumber(luggage_capacity) || 0,
        safeNumber(price_per_day),
        vehicle_license || null,
        insurance_provider || null,
        insuranceValidation.normalizedStartDate,
        insuranceValidation.normalizedEndDate,
        resolvedImageUrl,
        normalizeStatus(status),
        brand || null,
        model || null,
        fuel_type || null,
        transmission || null,
        Boolean(air_conditioning),
        safeNumber(mileage),
        engine_capacity || null,
        features || null,
      ]
    );

    const vehicleId = rows[0].vehicle_id;

    const { rows: createdRows } = await db.query(
      `SELECT
        v.vehicle_id,
        v.category_id,
        vc.category_name,
        v.vehicle_number,
        v.name AS vehicle_name,
        v.color,
        v.manufactured_year,
        v.adult_seats,
        v.baby_seats,
        v.luggage_capacity,
        v.price_per_day,
        v.vehicle_license,
        v.insurance_provider,
        v.insurance_start_date,
        v.insurance_end_date,
        v.image_url,
        v.vehicle_status,
        v.brand,
        v.model,
        v.fuel_type,
        v.transmission,
        v.air_conditioning,
        v.mileage,
        v.engine_capacity,
        v.features
      FROM vehicle v
      LEFT JOIN vehicle_category vc ON vc.category_id = v.category_id
      WHERE v.vehicle_id = $1
      LIMIT 1`,
      [vehicleId]
    );

    res.status(201).json({ success: true, data: mapVehicle(createdRows[0]) });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'Vehicle number already exists.' });
    }

    console.error('createVehicle error:', error);
    res.status(500).json({ success: false, message: 'Failed to create vehicle.' });
  }
};

exports.updateVehicle = async (req, res) => {
  try {
    const {
      category_id,
      vehicle_name,
      name,
      license_plate,
      vehicle_number,
      color,
      year,
      manufactured_year,
      seats,
      adult_seats,
      luggage_capacity,
      price_per_day,
      vehicle_license,
      insurance_provider,
      insurance_start_date,
      insurance_end_date,
      image_url,
      status,
      brand,
      model,
      fuel_type,
      transmission,
      air_conditioning,
      mileage,
      engine_capacity,
      features,
    } = req.body;
    const uploadedImageUrls = req.files ? req.files.map(file => file.path || file.url || file.secure_url || file.location || file.filename) : [];

    const resolvedCategoryId = safeNumber(category_id);
    const vehicleLabel = vehicle_name || name || '';
    const plateNumber = license_plate || vehicle_number || '';
    const resolvedYear = safeNumber(year || manufactured_year);
    if (resolvedYear != null && resolvedYear < 1950) {
      return res.status(400).json({ success: false, message: 'manufactured_year must be 1950 or later.' });
    }
    if (!vehicleLabel || !plateNumber || !vehicle_license || !insurance_provider || !insurance_start_date) {
      return res.status(400).json({
        success: false,
        message: 'vehicle_name, license_plate, vehicle_license, insurance_provider, and insurance_start_date are required.',
      });
    }

    const insuranceValidation = validateInsurancePeriod(insurance_start_date, insurance_end_date);
    if (!insuranceValidation.valid) {
      return res.status(400).json({ success: false, message: insuranceValidation.message });
    }

    const { rows: existingRows } = await db.query(
      'SELECT image_url FROM vehicle WHERE vehicle_id = $1 LIMIT 1',
      [req.params.id]
    );

    if (!existingRows.length) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    let newUrls = [];
    if (image_url) {
      try {
        const parsed = JSON.parse(image_url);
        newUrls = Array.isArray(parsed) ? parsed : [image_url];
      } catch(e) {
        newUrls = [image_url];
      }
    }
    const allUrls = [...newUrls, ...uploadedImageUrls].filter(Boolean);
    let resolvedImageUrl = allUrls.length > 0 ? JSON.stringify(allUrls) : null;
    if (!resolvedImageUrl && existingRows[0].image_url) {
        resolvedImageUrl = existingRows[0].image_url;
    }

    const { rowCount } = await db.query(
      `UPDATE vehicle SET
        category_id = COALESCE($1, category_id),
        vehicle_number = COALESCE(NULLIF($2, ''), vehicle_number),
        name = COALESCE(NULLIF($3, ''), name),
        color = $4,
        manufactured_year = $5,
        adult_seats = $6,
        luggage_capacity = $7,
        price_per_day = $8,
        vehicle_license = $9,
        insurance_provider = $10,
        insurance_start_date = $11,
        insurance_end_date = $12,
        image_url = $13,
        vehicle_status = $14,
        brand = $15,
        model = $16,
        fuel_type = $17,
        transmission = $18,
        air_conditioning = $19,
        mileage = $20,
        engine_capacity = $21,
        features = $22
      WHERE vehicle_id = $23`,
      [
        resolvedCategoryId,
        plateNumber,
        vehicleLabel,
        color || null,
        safeNumber(year || manufactured_year),
        safeNumber(seats || adult_seats),
        safeNumber(luggage_capacity),
        safeNumber(price_per_day),
        vehicle_license || null,
        insurance_provider || null,
        insuranceValidation.normalizedStartDate,
        insuranceValidation.normalizedEndDate,
        resolvedImageUrl,
        normalizeStatus(status),
        brand || null,
        model || null,
        fuel_type || null,
        transmission || null,
        Boolean(air_conditioning),
        safeNumber(mileage),
        engine_capacity || null,
        features || null,
        req.params.id,
      ]
    );

    if (rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    const { rows: updatedRows } = await db.query(
      `SELECT
        v.vehicle_id,
        v.category_id,
        vc.category_name,
        v.vehicle_number,
        v.name AS vehicle_name,
        v.color,
        v.manufactured_year,
        v.adult_seats,
        v.baby_seats,
        v.luggage_capacity,
        v.price_per_day,
        v.vehicle_license,
        v.insurance_provider,
        v.insurance_start_date,
        v.insurance_end_date,
        v.image_url,
        v.vehicle_status,
        v.brand,
        v.model,
        v.fuel_type,
        v.transmission,
        v.air_conditioning,
        v.mileage,
        v.engine_capacity,
        v.features
      FROM vehicle v
      LEFT JOIN vehicle_category vc ON vc.category_id = v.category_id
      WHERE v.vehicle_id = $1
      LIMIT 1`,
      [req.params.id]
    );

    res.json({ success: true, data: mapVehicle(updatedRows[0]) });
  } catch (error) {
    console.error('updateVehicle error:', error);
    res.status(500).json({ success: false, message: 'Failed to update vehicle.' });
  }
};

exports.deleteVehicle = async (req, res) => {
  try {
    const { rowCount } = await db.query('DELETE FROM vehicle WHERE vehicle_id = $1', [req.params.id]);

    if (rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    res.json({ success: true, message: 'Vehicle deleted successfully.' });
  } catch (error) {
    console.error('deleteVehicle error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete vehicle.' });
  }
};

exports.getStats = async (_req, res) => {
  try {
    const { rows: [vehicleStats] } = await db.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE vehicle_status = 'AVAILABLE') AS available,
        COUNT(*) FILTER (WHERE vehicle_status = 'BOOKED') AS booked,
        COUNT(*) FILTER (WHERE vehicle_status = 'MAINTENANCE') AS maintenance
      FROM vehicle
    `);

    res.json({
      success: true,
      data: {
        total: Number(vehicleStats.total || 0),
        available: Number(vehicleStats.available || 0),
        booked: Number(vehicleStats.booked || 0),
        maintenance: Number(vehicleStats.maintenance || 0),
      },
    });
  } catch (error) {
    console.error('getStats error:', error);
    res.status(500).json({ success: false, message: 'Failed to load vehicle statistics.' });
  }
};

exports.getAvailableVehicles = async (req, res) => {
  const { categoryId, startDate, endDate } = req.query;
  if (!startDate || !endDate) {
    return res.status(400).json({ success: false, message: 'startDate and endDate are required query parameters (YYYY-MM-DD).' });
  }

  try {
    const catId = categoryId ? parseInt(categoryId, 10) : null;
    const { rows } = await db.query(
      'SELECT * FROM fn_get_available_vehicles($1, $2::date, $3::date)',
      [isNaN(catId) ? null : catId, startDate, endDate]
    );

    res.json({
      success: true,
      vehicles: rows.map((r) => ({
        id: r.vehicle_id,
        vehicleId: r.vehicle_id,
        categoryName: r.category_name,
        name: r.model_name,
        modelName: r.model_name,
        plateNumber: r.plate_number,
        seats: r.adult_seats,
        adultSeats: r.adult_seats,
        pricePerDay: r.price_per_day ? parseFloat(r.price_per_day) : null,
        mainImageUrl: r.main_image_url,
      })),
    });
  } catch (error) {
    console.error('getAvailableVehicles error:', error);
    res.status(500).json({ success: false, message: 'Failed to load available vehicles.' });
  }
};

