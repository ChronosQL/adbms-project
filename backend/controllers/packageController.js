const db = require('../db/connection');
const cloudinary = require('cloudinary').v2;
const { parsePagination } = require('../utils/paginate');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const {
  PACKAGE_TYPE_LABEL_TO_ENUM,
  PACKAGE_TYPE_ENUM_TO_LABEL,
  toPackageTypeEnum,
  toPackageTypeLabel,
  toPackageDaysLabel,
  toPackageDaysNumber,
  normalizeAvailabilityStatus,
  buildAvailabilityPayload,
  extractAvailabilityStatus,
  parseDestinations,
  extractPackagePayload,
  mapAdminPackage,
  mapPublicPackage,
  mapRelatedPackage,
  mapPackagePlace,
} = require('../dto/packageDto');

const uploadBufferToCloudinary = (file, folder) => new Promise((resolve, reject) => {
  if (!file) {
    console.debug(`[Cloudinary] No file provided for folder: ${folder}`);
    return resolve(null);
  }

  const existingUrl = file.path || file.url || file.secure_url || file.location || file.filename || null;
  if (!file.buffer) {
    return existingUrl ? resolve(existingUrl) : reject(new Error('The selected file could not be read.'));
  }

  const hasCloudinaryConfig = Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
  if (!hasCloudinaryConfig) {
    return reject(new Error('Image upload is unavailable because file storage is not configured.'));
  }

  console.debug(`[Cloudinary] Starting upload to folder: ${folder}, file size: ${file.buffer.length} bytes, originalname: ${file.originalname}`);

  const uploadStream = cloudinary.uploader.upload_stream(
    {
      folder,
      resource_type: 'auto',
      use_filename: true,
      unique_filename: true,
    },
    (error, result) => {
      if (error) {
        console.error(`[Cloudinary] Upload failed for ${folder}:`, error.message || error);
        return reject(new Error('Image upload failed. Please try again.'));
      }
      const url = result?.secure_url || result?.url || result?.path || null;
      console.debug(`[Cloudinary] Upload successful for ${folder}: ${url}`);
      resolve(url);
    }
  );

  uploadStream.on('error', (err) => {
    console.error(`[Cloudinary] Stream error for ${folder}:`, err.message || err);
    reject(new Error('Image upload failed. Please try again.'));
  });

  uploadStream.end(file.buffer);
});

exports.createPackage = async (req, res) => {
  try {
    const { title, type, days, description } = req.body;
    if (!title || !type || !days) {
      return res.status(400).json({ error: 'title, type and days are required.' });
    }

    const packageType = toPackageTypeEnum(type);
    if (!packageType) {
      return res.status(400).json({ error: 'type must be a valid package type.' });
    }

    const availabilityStatus = extractAvailabilityStatus(req.body, 'AVAILABLE');

    const packageDaysLabel = toPackageDaysLabel(days);
    if (!packageDaysLabel) {
      return res.status(400).json({ error: 'days must be a valid duration value.' });
    }

    let destinations = [];
    try {
      destinations = req.body.destinations ? JSON.parse(req.body.destinations) : [];
      if (!Array.isArray(destinations)) destinations = [];
    } catch (e) {
      return res.status(400).json({ error: 'destinations must be a JSON array.' });
    }

    const packageImageFile = req.files && req.files.packageImage && req.files.packageImage[0];
    if (!packageImageFile) return res.status(400).json({ error: 'A package cover image file is required.' });
    const packageImage = await uploadBufferToCloudinary(packageImageFile, 'package_uploads');
    const destFiles = req.files && req.files.destImages ? req.files.destImages : [];

    const enrichedDestinations = [];
    for (let i = 0; i < destinations.length; i++) {
      const dest = destinations[i] || {};
      let fileForDest = null;
      if (dest.imageIndex !== undefined && dest.imageIndex !== null && destFiles[dest.imageIndex]) {
        fileForDest = destFiles[dest.imageIndex];
      } else if (destFiles.length === destinations.length) {
        fileForDest = destFiles[i];
      }
      const destImage = fileForDest ? await uploadBufferToCloudinary(fileForDest, 'package_uploads') : (dest.image || null);
      const lat = (dest.latitude !== undefined && dest.latitude !== null && dest.latitude !== '')
        ? parseFloat(dest.latitude)
        : ((dest.lat !== undefined && dest.lat !== null && dest.lat !== '') ? parseFloat(dest.lat) : null);
      const lng = (dest.longitude !== undefined && dest.longitude !== null && dest.longitude !== '')
        ? parseFloat(dest.longitude)
        : ((dest.lng !== undefined && dest.lng !== null && dest.lng !== '') ? parseFloat(dest.lng) : null);

      enrichedDestinations.push({
        name: dest.name || null,
        image: destImage,
        description: dest.description || null,
        latitude: lat,
        longitude: lng,
        dayNumber: dest.dayNumber || (i + 1),
        activities: Array.isArray(dest.activities) ? dest.activities : [],
      });
    }

    // sp_create_package_with_itinerary batch inserts dest.latitude and dest.longitude into package_place and activities
    const { rows } = await db.query(
      `SELECT * FROM sp_create_package_with_itinerary($1, $2, $3, $4, $5, $6, $7::jsonb)`,
      [
        title,
        packageType,
        packageDaysLabel,
        description || null,
        packageImage,
        availabilityStatus,
        JSON.stringify(enrichedDestinations),
      ]
    );

    const packageId = rows[0].package_id;

    res.status(201).json({
      package_id: packageId,
      title,
      type: toPackageTypeLabel(packageType),
      days: toPackageDaysNumber(packageDaysLabel),
      description: description || null,
      image_url: packageImage,
      availability_status: availabilityStatus,
    });
  } catch (error) {
    console.error('createPackage failed:', error);
    res.status(500).json({ error: 'Failed to create package or upload its images.' });
  }
};

exports.listAdminPackages = async (req, res) => {
  try {
    const { rows: packages } = await db.query(`
      SELECT
        p.package_id,
        p.title,
        p.type,
        p.days,
        p.description,
        p.image_url,
        p.availability_status
      FROM package p
      ORDER BY p.package_id DESC
    `);

    const packageIds = packages.map(p => p.package_id);
    let destinationsByPackage = {};

    if (packageIds.length > 0) {
      const { rows: places } = await db.query(`
        SELECT pp.package_id, pl.place_id, pl.place_name, pl.image_url, pl.description, pp.day_number,
               COALESCE(pp.latitude, pl.latitude) AS latitude,
               COALESCE(pp.longitude, pl.longitude) AS longitude
        FROM package_place pp
        INNER JOIN place pl ON pl.place_id = pp.place_id
        WHERE pp.package_id = ANY($1)
        ORDER BY pp.package_id, pp.day_number ASC, pp.id ASC
      `, [packageIds]);

      destinationsByPackage = places.reduce((acc, item) => {
        if (!acc[item.package_id]) acc[item.package_id] = [];
        acc[item.package_id].push({
          id: item.place_id,
          name: item.place_name,
          description: item.description,
          image: item.image_url,
          days: item.day_number,
          latitude: item.latitude !== null && item.latitude !== undefined ? parseFloat(item.latitude) : null,
          longitude: item.longitude !== null && item.longitude !== undefined ? parseFloat(item.longitude) : null,
        });
        return acc;
      }, {});
    }

    res.json(packages.map((r) => mapAdminPackage(r, destinationsByPackage)));
  } catch (error) {
    console.error('listAdminPackages failed:', error);
    res.status(500).json({ error: 'Failed to load packages.' });
  }
};

exports.listPublicPackages = async (req, res) => {
  try {
    const qType = req.query.type || null;
    const qDays = req.query.days || null;
    const { page, limit, offset, buildPagination } = parsePagination(req.query, 9, 60);
    const isPaginated = req.query.page !== undefined || req.query.limit !== undefined;

    const where = [];
    const params = [];

    if (qType) {
      const typeEnum = toPackageTypeEnum(qType);
      if (typeEnum) {
        where.push(`p.type = $${params.length + 1}`);
        params.push(typeEnum);
      }
    }

    if (qDays) {
      const daysLabel = toPackageDaysLabel(qDays);
      if (daysLabel) {
        where.push(`p.days = $${params.length + 1}`);
        params.push(daysLabel);
      }
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    let querySql = `
      SELECT
        p.package_id,
        p.title,
        p.type,
        p.days,
        p.description,
        p.image_url,
        p.availability_status,
        p.destinations,
        p.total_places,
        COALESCE(r.avg_rating, 0) AS avg_rating,
        COALESCE(r.reviews_count, 0) AS reviews_count,
        COALESCE(b.bookings_count, 0) AS bookings_count,
        COUNT(*) OVER()::integer AS total_count
      FROM v_package_catalog p
      LEFT JOIN (
        SELECT bp.package_id,
               ROUND(AVG(rv.rating), 2) AS avg_rating,
               COUNT(rv.review_id)::integer AS reviews_count
        FROM booking_package bp
        JOIN review rv ON rv.booking_id = bp.booking_id
        GROUP BY bp.package_id
      ) r ON r.package_id = p.package_id
      LEFT JOIN (
        SELECT package_id, COUNT(*)::integer AS bookings_count
        FROM booking_package
        GROUP BY package_id
      ) b ON b.package_id = p.package_id
      ${whereSql}
      ORDER BY p.package_id DESC
    `;

    if (isPaginated) {
      params.push(limit, offset);
      querySql += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;
    }

    const { rows: packages } = await db.query(querySql, params);
    const totalCount = packages.length > 0 ? packages[0].total_count : 0;
    const pagination = buildPagination(totalCount);

    const result = packages.map(mapPublicPackage);

    if (isPaginated) {
      res.json({ packages: result, pagination });
    } else {
      result.pagination = pagination;
      res.json(result);
    }
  } catch (error) {
    console.error('listPublicPackages failed:', error);
    res.status(500).json({ error: 'Failed to load packages.' });
  }
};

exports.getPackageDetail = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await db.query(`
      SELECT
        p.package_id,
        p.title,
        p.type,
        p.days,
        p.description,
        p.image_url,
        p.availability_status
      FROM package p
      WHERE p.package_id = $1
    `, [id]);
    if (!rows.length) return res.status(404).json({ error: 'Package not found.' });

    const pkgRow = rows[0];

    const { rows: places } = await db.query(`
      SELECT pl.place_id, pl.place_name, pl.image_url, pl.description, pp.day_number,
             COALESCE(pp.latitude, pl.latitude) AS latitude,
             COALESCE(pp.longitude, pl.longitude) AS longitude
      FROM package_place pp
      INNER JOIN place pl ON pl.place_id = pp.place_id
      WHERE pp.package_id = $1
      ORDER BY pp.day_number ASC`,
      [id]
    );

    const placeIds = places.map(p => p.place_id);
    let activities = [];
    if (placeIds.length > 0) {
      const result = await db.query(`
        SELECT pa.place_id, a.activity_id, a.activity_name, a.phone, a.description
        FROM place_activity pa
        INNER JOIN activity a ON a.activity_id = pa.activity_id
        WHERE pa.place_id = ANY($1)
      `, [placeIds]);
      activities = result.rows;
    }

    const activitiesByPlace = activities.reduce((acc, a) => {
      if (!acc[a.place_id]) acc[a.place_id] = [];
      acc[a.place_id].push({ id: a.activity_id, name: a.activity_name, phone: a.phone, description: a.description });
      return acc;
    }, {});

    const detailedPlaces = places.map(p => ({
      id: p.place_id,
      name: p.place_name,
      image: p.image_url,
      description: p.description,
      dayNumber: p.day_number,
      latitude: p.latitude !== null && p.latitude !== undefined ? parseFloat(p.latitude) : null,
      longitude: p.longitude !== null && p.longitude !== undefined ? parseFloat(p.longitude) : null,
      activities: activitiesByPlace[p.place_id] || []
    }));

    res.json({
      id: pkgRow.package_id,
      title: pkgRow.title,
      type: toPackageTypeLabel(pkgRow.type),
      days: toPackageDaysNumber(pkgRow.days),
      description: pkgRow.description,
      image: pkgRow.image_url,
      destinations: detailedPlaces,
      availability: buildAvailabilityPayload(pkgRow.availability_status),
    });
  } catch (error) {
    console.error('getPackageDetail failed:', error);
    res.status(500).json({ error: 'Failed to load package.' });
  }
};

exports.getRecommendations = async (req, res) => {
  const { id } = req.params;
  const limit = Number(req.query.limit) || 6;
  try {
    const { rows: pkgRows } = await db.query(
      `SELECT package_id, title, type, days FROM package WHERE package_id = $1`, [id]);
    if (!pkgRows.length) return res.status(404).json({ error: 'Package not found.' });

    const pkgRow = pkgRows[0];
    const pkgType = pkgRow.type;
    const pkgDays = pkgRow.days;

    const avgRatingSubquery = `(SELECT AVG(r2.rating) FROM review r2 INNER JOIN booking_package bp2 ON bp2.booking_id = r2.booking_id WHERE bp2.package_id = p.package_id)`;

    let similarByType = { rows: [] };
    if (pkgType) {
      similarByType = await db.query(
        `SELECT package_id AS id, title, type, days, image_url AS image, description,
                ${avgRatingSubquery} AS avg_rating
         FROM package p
         WHERE package_id != $1 AND type = $2
         ORDER BY package_id DESC
         LIMIT $3`,
        [id, pkgType, Number(limit)]
      );
    }

    let similarByDays = { rows: [] };
    if (pkgDays) {
      similarByDays = await db.query(
        `SELECT package_id AS id, title, type, days, image_url AS image, description,
                ${avgRatingSubquery} AS avg_rating
         FROM package p
         WHERE package_id != $1 AND days = $2
         ORDER BY package_id DESC
         LIMIT $3`,
        [id, pkgDays, Number(limit)]
      );
    }

    const { rows: topRated } = await db.query(
      `SELECT p.package_id AS id, p.title, p.type, p.days, p.image_url AS image, p.description,
              AVG(r.rating) AS avg_rating, COUNT(DISTINCT r.review_id) AS reviews_count
       FROM package p
       LEFT JOIN booking_package bp ON bp.package_id = p.package_id
       LEFT JOIN review r ON r.booking_id = bp.booking_id
       WHERE p.package_id != $1
       GROUP BY p.package_id, p.title, p.type, p.days, p.image_url, p.description
       ORDER BY avg_rating DESC, reviews_count DESC, p.package_id DESC
       LIMIT $2`,
      [id, Number(limit)]
    );

    const { rows: mostBooked } = await db.query(
      `SELECT p.package_id AS id, p.title, p.type, p.days, p.image_url AS image, p.description,
              COUNT(DISTINCT bp.booking_id) AS bookings_count, AVG(r.rating) AS avg_rating
       FROM package p
       LEFT JOIN booking_package bp ON bp.package_id = p.package_id
       LEFT JOIN review r ON r.booking_id = bp.booking_id
       WHERE p.package_id != $1
       GROUP BY p.package_id, p.title, p.type, p.days, p.image_url, p.description
       ORDER BY bookings_count DESC, p.package_id DESC
       LIMIT $2`,
      [id, Number(limit)]
    );

    const normalize = (rows) => (Array.isArray(rows) ? rows.map(mapRelatedPackage) : []);

    res.json({
      similarByType: normalize(similarByType.rows),
      similarByDays: normalize(similarByDays.rows),
      topRated: normalize(topRated),
      mostBooked: normalize(mostBooked),
    });
  } catch (error) {
    console.error('getRecommendations failed:', error);
    res.status(500).json({ error: 'Failed to compute recommendations.' });
  }
};

exports.updatePackage = async (req, res) => {
  const { id } = req.params;
  try {
    const { title, type, days, description } = req.body;
    const packageType = type ? toPackageTypeEnum(type) : null;
    const availabilityStatus = extractAvailabilityStatus(req.body);

    const packageImageFile = req.files && req.files.packageImage && req.files.packageImage[0];
    const uploadedPackageImage = packageImageFile ? await uploadBufferToCloudinary(packageImageFile, 'package_uploads') : null;
    const packageImage = uploadedPackageImage;
    const destFiles = req.files && req.files.destImages ? req.files.destImages : [];

    let destinations = [];
    try {
      destinations = req.body.destinations ? JSON.parse(req.body.destinations) : [];
      if (!Array.isArray(destinations)) destinations = [];
    } catch (e) {
      return res.status(400).json({ error: 'destinations must be a JSON array.' });
    }

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const { rows: existing } = await client.query(
        'SELECT package_id, image_url FROM package WHERE package_id = $1',
        [id]
      );
      if (!existing.length) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Package not found.' });
      }

      const updateCols = [];
      const updateVals = [];
      if (title != null) { updateCols.push(`title = $${updateVals.length + 1}`); updateVals.push(title); }
      if (packageType) { updateCols.push(`type = $${updateVals.length + 1}`); updateVals.push(packageType); }
      if (days != null) {
        const daysLabel = toPackageDaysLabel(days);
        updateCols.push(`days = $${updateVals.length + 1}`);
        updateVals.push(daysLabel);
      }
      if (description != null) { updateCols.push(`description = $${updateVals.length + 1}`); updateVals.push(description || null); }
      if (packageImage) { updateCols.push(`image_url = $${updateVals.length + 1}`); updateVals.push(packageImage); }
      if (availabilityStatus) { updateCols.push(`availability_status = $${updateVals.length + 1}`); updateVals.push(availabilityStatus); }

      if (updateCols.length > 0) {
        updateVals.push(id);
        const sql = `UPDATE package SET ${updateCols.join(', ')} WHERE package_id = $${updateVals.length}`;
        await client.query(sql, updateVals);
      }

      const { rows: places } = await client.query(
        `SELECT pp.place_id FROM package_place pp WHERE pp.package_id = $1`, [id]
      );
      const placeIds = places.map(p => p.place_id);
      if (placeIds.length > 0) {
        const { rows: paRows } = await client.query(
          `SELECT activity_id FROM place_activity WHERE place_id = ANY($1)`, [placeIds]
        );
        const activityIds = paRows.map(r => r.activity_id);
        if (activityIds.length > 0) {
          await client.query(`DELETE FROM place_activity WHERE place_id = ANY($1)`, [placeIds]);
          await client.query(`DELETE FROM activity WHERE activity_id = ANY($1)`, [activityIds]);
        }
        await client.query(`DELETE FROM package_place WHERE package_id = $1`, [id]);
        await client.query(`DELETE FROM place WHERE place_id = ANY($1)`, [placeIds]);
      }

      for (let i = 0; i < destinations.length; i++) {
        const dest = destinations[i] || {};
        let fileForDest = null;
        if (dest.imageIndex !== undefined && dest.imageIndex !== null && destFiles[dest.imageIndex]) {
          fileForDest = destFiles[dest.imageIndex];
        } else if (destFiles.length === destinations.length) {
          fileForDest = destFiles[i];
        }
        const destImage = fileForDest ? await uploadBufferToCloudinary(fileForDest, 'package_uploads') : (dest.image || null);
        const lat = (dest.latitude !== undefined && dest.latitude !== null && dest.latitude !== '')
          ? parseFloat(dest.latitude)
          : ((dest.lat !== undefined && dest.lat !== null && dest.lat !== '') ? parseFloat(dest.lat) : null);
        const lng = (dest.longitude !== undefined && dest.longitude !== null && dest.longitude !== '')
          ? parseFloat(dest.longitude)
          : ((dest.lng !== undefined && dest.lng !== null && dest.lng !== '') ? parseFloat(dest.lng) : null);

        const { rows: placeRows } = await client.query(
          `INSERT INTO place (place_name, image_url, description, latitude, longitude) VALUES ($1, $2, $3, $4, $5) RETURNING place_id`,
          [dest.name || null, destImage, dest.description || null, lat, lng]
        );
        const placeId = placeRows[0].place_id;

        const dayNumber = dest.dayNumber || (i + 1);
        await client.query(
          `INSERT INTO package_place (package_id, place_id, day_number, latitude, longitude) VALUES ($1, $2, $3, $4, $5)`,
          [id, placeId, dayNumber, lat, lng]
        );

        const activities = Array.isArray(dest.activities) ? dest.activities : [];
        for (const act of activities) {
          if (!act.name) continue;
          const { rows: actRows } = await client.query(
            `INSERT INTO activity (activity_name, phone, description) VALUES ($1, $2, $3) RETURNING activity_id`,
            [act.name, act.phone || null, act.description || null]
          );
          const activityId = actRows[0].activity_id;
          await client.query(
            `INSERT INTO place_activity (place_id, activity_id) VALUES ($1, $2)`,
            [placeId, activityId]
          );
        }
      }

      await client.query('COMMIT');

      res.json({ success: true, package_id: Number(id) });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('updatePackage failed:', error);
    res.status(500).json({ error: 'Failed to update package or upload its images.' });
  }
};

exports.getPackageAvailability = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows: packageRows } = await db.query(
      'SELECT package_id, availability_status FROM package WHERE package_id = $1 LIMIT 1', [id]);
    if (!packageRows.length) {
      return res.status(404).json({ error: 'Package not found.' });
    }

    res.json({
      packageId: Number(id),
      ...buildAvailabilityPayload(packageRows[0].availability_status),
    });
  } catch (error) {
    console.error('getPackageAvailability failed:', error);
    res.status(500).json({ error: 'Failed to load package availability.' });
  }
};

exports.updatePackageAvailability = async (req, res) => {
  const { id } = req.params;
  const availabilityStatus = extractAvailabilityStatus(req.body, 'AVAILABLE');

  try {
    const { rows: packageRows } = await db.query(
      'SELECT package_id FROM package WHERE package_id = $1 LIMIT 1', [id]);
    if (!packageRows.length) {
      return res.status(404).json({ error: 'Package not found.' });
    }

    await db.query(
      'UPDATE package SET availability_status = $1 WHERE package_id = $2',
      [availabilityStatus, id]
    );

    res.json({
      packageId: Number(id),
      ...buildAvailabilityPayload(availabilityStatus),
    });
  } catch (error) {
    console.error('updatePackageAvailability failed:', error);
    res.status(500).json({ error: 'Failed to update package availability.' });
  }
};

exports.deletePackage = async (req, res) => {
  const { id } = req.params;
  try {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const { rows: existing } = await client.query(
        'SELECT package_id FROM package WHERE package_id = $1',
        [id]
      );
      if (!existing.length) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Package not found.' });
      }

      const { rows: places } = await client.query(
        `SELECT pp.place_id FROM package_place pp WHERE pp.package_id = $1`, [id]
      );
      const placeIds = places.map(p => p.place_id);
      if (placeIds.length > 0) {
        const { rows: paRows } = await client.query(
          `SELECT activity_id FROM place_activity WHERE place_id = ANY($1)`, [placeIds]
        );
        const activityIds = paRows.map(r => r.activity_id);
        if (activityIds.length > 0) {
          await client.query(`DELETE FROM place_activity WHERE place_id = ANY($1)`, [placeIds]);
          await client.query(`DELETE FROM activity WHERE activity_id = ANY($1)`, [activityIds]);
        }
        await client.query(`DELETE FROM package_place WHERE package_id = $1`, [id]);
        await client.query(`DELETE FROM place WHERE place_id = ANY($1)`, [placeIds]);
      }

      await client.query(`DELETE FROM package WHERE package_id = $1`, [id]);

      await client.query('COMMIT');
      res.json({ success: true });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('deletePackage failed:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getNearbyPlaces = async (req, res) => {
  const { lat, lng, radius } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng query parameters are required.' });
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  const radiusKm = radius ? parseFloat(radius) : 50;

  if (isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({ error: 'Invalid lat or lng parameters.' });
  }

  try {
    const { rows } = await db.query(
      'SELECT * FROM fn_get_places_nearby($1, $2, $3)',
      [latitude, longitude, radiusKm]
    );

    res.json({
      places: rows.map((r) => ({
        id: r.place_id,
        name: r.place_name,
        description: r.description,
        image: r.image_url,
        latitude: r.latitude ? parseFloat(r.latitude) : null,
        longitude: r.longitude ? parseFloat(r.longitude) : null,
        distanceKm: r.distance_km ? parseFloat(r.distance_km) : null,
      })),
    });
  } catch (error) {
    console.error('getNearbyPlaces error:', error);
    res.status(500).json({ error: 'Failed to find nearby places.' });
  }
};

