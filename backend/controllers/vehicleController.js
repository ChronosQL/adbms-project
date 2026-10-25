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

const {
  STATUS_LABELS,
  normalizeStatus,
  toStatusLabel,
  safeNumber,
  toDateOnly,
  addOneYearToDate,
  isInsuranceExpired,
  validateInsurancePeriod,
  parseImageUrls,
  mapCategory,
  mapVehicle,
  extractCategoryPayload,
  extractVehiclePayload,
  validateVehiclePayload,
} = require('../dto/vehicleDto');


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
    const payload = extractCategoryPayload(req.body, req.files);

    if (!payload.name) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const { rows } = await db.query(
      `INSERT INTO vehicle_category (category_name, description, image_url, passenger_capacity, luggage_capacity, best_for, comfort_level, ac_available, ideal_trip_types)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING category_id`,
      [
        payload.name,
        payload.description || null,
        payload.imageUrl,
        payload.passenger_capacity || null,
        payload.luggage_capacity || null,
        payload.best_for || null,
        payload.comfort_level || null,
        payload.ac_available,
        payload.ideal_trip_types || null,
      ]
    );

    res.status(201).json({
      success: true,
      data: {
        id: rows[0].category_id,
        name: payload.name,
        description: payload.description,
        image_url: payload.imageUrl,
        passenger_capacity: payload.passenger_capacity,
        luggage_capacity: payload.luggage_capacity,
        best_for: payload.best_for,
        comfort_level: payload.comfort_level,
        ac_available: payload.ac_available,
        ideal_trip_types: payload.ideal_trip_types,
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
    const payload = extractCategoryPayload(req.body, req.files);

    if (!payload.name) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const { rows: existingRows } = await db.query(
      'SELECT image_url FROM vehicle_category WHERE category_id = $1 LIMIT 1',
      [req.params.id]
    );

    if (!existingRows.length) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    const resolvedImageUrl = payload.imageUrl || existingRows[0].image_url;

    const { rowCount } = await db.query(
      `UPDATE vehicle_category SET category_name = $1, description = $2, image_url = $3, passenger_capacity = $4, luggage_capacity = $5, best_for = $6, comfort_level = $7, ac_available = $8, ideal_trip_types = $9 WHERE category_id = $10`,
      [
        payload.name,
        payload.description || null,
        resolvedImageUrl,
        payload.passenger_capacity || null,
        payload.luggage_capacity || null,
        payload.best_for || null,
        payload.comfort_level || null,
        payload.ac_available,
        payload.ideal_trip_types || null,
        req.params.id,
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
    const payload = extractVehiclePayload(req.body, req.files);
    const validation = validateVehiclePayload(payload);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const { rows: categoryRows } = await db.query(
      'SELECT category_id FROM vehicle_category WHERE category_id = $1 LIMIT 1',
      [payload.categoryId]
    );
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
        payload.categoryId,
        payload.licensePlate,
        payload.vehicleName,
        payload.color || null,
        payload.manufacturedYear,
        payload.adultSeats,
        0,
        payload.luggageCapacity,
        payload.pricePerDay,
        payload.vehicleLicense || null,
        payload.insuranceProvider || null,
        payload.insuranceStartDate,
        payload.insuranceEndDate,
        payload.imageUrl,
        payload.vehicleStatus,
        payload.brand || null,
        payload.model || null,
        payload.fuelType || null,
        payload.transmission || null,
        payload.airConditioning,
        payload.mileage,
        payload.engineCapacity || null,
        payload.features || null,
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
    const payload = extractVehiclePayload(req.body, req.files);
    const validation = validateVehiclePayload(payload);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const { rows: existingRows } = await db.query(
      'SELECT image_url FROM vehicle WHERE vehicle_id = $1 LIMIT 1',
      [req.params.id]
    );

    if (!existingRows.length) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    const resolvedImageUrl = payload.imageUrl || existingRows[0].image_url;

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
        payload.categoryId,
        payload.licensePlate,
        payload.vehicleName,
        payload.color || null,
        payload.manufacturedYear,
        payload.adultSeats,
        payload.luggageCapacity,
        payload.pricePerDay,
        payload.vehicleLicense || null,
        payload.insuranceProvider || null,
        payload.insuranceStartDate,
        payload.insuranceEndDate,
        resolvedImageUrl,
        payload.vehicleStatus,
        payload.brand || null,
        payload.model || null,
        payload.fuelType || null,
        payload.transmission || null,
        payload.airConditioning,
        payload.mileage,
        payload.engineCapacity || null,
        payload.features || null,
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

