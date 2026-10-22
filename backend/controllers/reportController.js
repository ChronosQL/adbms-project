const PDFDocument = require('pdfkit');
const db = require('../db/connection');

const COMPANY_NAME = 'Ceylon Best Tours';
const COMPANY_TAGLINE = 'Official Management Report';
const BRAND_PRIMARY = '#00b0a5';
const BRAND_DARK = '#0f172a';
const BRAND_MID = '#475569';
const BRAND_LIGHT = '#f8fafc';
const CONTENT_LEFT = 42;
const BODY_START_Y = 108;
const CONTENT_WIDTH = 511;

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatMoney = (value) => {
  const amount = Number(value || 0);
  return `LKR ${amount.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatNumber = (value) => Number(value || 0).toLocaleString('en-LK');

const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;

const resetCursor = (doc, y = null) => {
  doc.x = CONTENT_LEFT;
  if (y !== null) {
    doc.y = y;
  }
};

const drawPageChrome = (doc, title, subtitle) => {
  const width = doc.page.width;

  doc.rect(0, 0, width, 76).fill(BRAND_PRIMARY);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(20).text(COMPANY_NAME, 42, 20);
  doc.font('Helvetica').fontSize(9).text(COMPANY_TAGLINE, 42, 44);

  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(11).text(title, width - 300, 22, { width: 258, align: 'right' });
  doc.font('Helvetica').fontSize(8).text(subtitle, width - 300, 42, { width: 258, align: 'right' });
};

const drawFooter = (doc, pageNumber, totalPages) => {
  const footerY = doc.page.height - 36;
  doc.moveTo(42, footerY - 8).lineTo(doc.page.width - 42, footerY - 8).stroke('#e2e8f0');
  doc.fillColor(BRAND_MID).font('Helvetica').fontSize(8)
    .text(`${COMPANY_NAME} - Generated ${new Date().toISOString().slice(0, 10)}`, 42, footerY)
    .text(`Page ${pageNumber} of ${totalPages}`, 0, footerY, { align: 'right', width: doc.page.width - 84 });
};

const createPdf = (res, fileName, title, subtitle = 'Generated on demand from live system data') => {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

  const doc = new PDFDocument({ size: 'A4', margin: 42, bufferPages: true });
  doc.on('error', (error) => {
    console.error('report pdf error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to generate report PDF.' });
    }
  });

  doc.info.Title = title;
  doc.info.Author = COMPANY_NAME;
  doc.info.Subject = COMPANY_TAGLINE;
  doc.info.CreationDate = new Date();

  doc.pipe(res);

  doc.on('pageAdded', () => {
    drawPageChrome(doc, title, subtitle);
    resetCursor(doc, BODY_START_Y);
  });

  drawPageChrome(doc, title, subtitle);
  resetCursor(doc, BODY_START_Y);

  return doc;
};

const ensureSpace = (doc, height = 24) => {
  if (doc.y + height > doc.page.height - 54) {
    doc.addPage();
    resetCursor(doc, BODY_START_Y);
  }
};

const drawSectionHeading = (doc, title, note = '') => {
  resetCursor(doc);
  ensureSpace(doc, note ? 56 : 40);

  const y = doc.y;
  const height = note ? 56 : 40;

  doc.roundedRect(CONTENT_LEFT, y, CONTENT_WIDTH, height, 14).fillAndStroke('#ffffff', '#e2e8f0');
  doc.roundedRect(CONTENT_LEFT + 1, y + 1, 6, height - 2, 3).fill(BRAND_PRIMARY);
  doc.fillColor(BRAND_DARK).font('Helvetica-Bold').fontSize(13).text(title, CONTENT_LEFT + 16, y + 12, { width: CONTENT_WIDTH - 28 });

  if (note) {
    doc.fillColor(BRAND_MID).font('Helvetica').fontSize(9).text(note, CONTENT_LEFT + 16, y + 29, { width: CONTENT_WIDTH - 28 });
  }

  doc.y = y + height + 10;
  resetCursor(doc);
};

const addMetricGrid = (doc, metrics) => {
  const cardWidth = 160;
  const cardHeight = 76;
  const gap = 12;
  const startX = CONTENT_LEFT;
  const startY = doc.y;

  metrics.forEach((metric, index) => {
    const x = startX + (index % 3) * (cardWidth + gap);
    const y = startY + Math.floor(index / 3) * (cardHeight + gap);

    doc.roundedRect(x, y, cardWidth, cardHeight, 14).fillAndStroke('#ffffff', '#e2e8f0');
    doc.roundedRect(x + 1, y + 1, 6, cardHeight - 2, 3).fill(BRAND_PRIMARY);
    doc.fillColor(BRAND_MID).font('Helvetica-Bold').fontSize(8.5).text(metric.label.toUpperCase(), x + 16, y + 13, { width: cardWidth - 28 });
    doc.fillColor(BRAND_DARK).font('Helvetica-Bold').fontSize(18).text(metric.value, x + 16, y + 32, { width: cardWidth - 28 });
  });

  doc.y = startY + Math.ceil(metrics.length / 3) * (cardHeight + gap) - gap + 8;
  resetCursor(doc);
};

const addTable = (doc, headers, rows, columnWidths) => {
  ensureSpace(doc, 44);

  const startX = CONTENT_LEFT;
  let y = doc.y;

  doc.font('Helvetica-Bold').fontSize(10).fillColor(BRAND_DARK);
  headers.forEach((header, index) => {
    const x = startX + columnWidths.slice(0, index).reduce((sum, width) => sum + width, 0);
    doc.roundedRect(x, y, columnWidths[index], 26, 6).fillAndStroke('#e2e8f0', '#cbd5e1');
    doc.fillColor(BRAND_DARK).text(header, x + 8, y + 8, { width: columnWidths[index] - 16, align: 'left' });
  });

  y += 28;
  doc.font('Helvetica').fontSize(9);

  rows.forEach((row, rowIndex) => {
    ensureSpace(doc, 24);
    const rowY = y + rowIndex * 24;
    const isAlt = rowIndex % 2 === 0;

    headers.forEach((_, index) => {
      const x = startX + columnWidths.slice(0, index).reduce((sum, width) => sum + width, 0);
      doc.roundedRect(x, rowY, columnWidths[index], 24, 5).fillAndStroke(isAlt ? '#ffffff' : BRAND_LIGHT, '#e2e8f0');
      doc.fillColor('#334155').text(String(row[index] ?? ''), x + 8, rowY + 7, { width: columnWidths[index] - 16, ellipsis: true });
    });
  });

  doc.y = y + rows.length * 24 + 8;
  resetCursor(doc);
};

const addBarChart = (doc, title, items, valueFormatter = (value) => value, color = '#00b0a5') => {
  ensureSpace(doc, 248);

  const chartTitleY = doc.y;
  doc.font('Helvetica-Bold').fontSize(13).fillColor(BRAND_DARK).text(title);

  const chartX = CONTENT_LEFT;
  const chartY = chartTitleY + 24;
  const chartWidth = CONTENT_WIDTH;
  const chartHeight = 152;
  const barGap = 8;
  const barWidth = Math.max(18, Math.floor((chartWidth - 28 - barGap * (items.length - 1)) / items.length));
  const values = items.map((item) => Number(item.value || 0));
  const maxValue = Math.max(...values, 1);

  doc.roundedRect(chartX, chartY, chartWidth, chartHeight, 14).fillAndStroke('#ffffff', '#e2e8f0');

  for (let i = 0; i < 4; i += 1) {
    const gridY = chartY + 28 + i * 26;
    doc.moveTo(chartX + 14, gridY).lineTo(chartX + chartWidth - 14, gridY).stroke('#eef2f7');
  }

  items.forEach((item, index) => {
    const value = Number(item.value || 0);
    const barHeight = Math.max(4, Math.round((value / maxValue) * 96));
    const x = chartX + 14 + index * (barWidth + barGap);
    const baseY = chartY + chartHeight - 26;
    const barY = baseY - barHeight;

    doc.roundedRect(x, barY, barWidth, barHeight, 6).fill(color);
    doc.fillColor(BRAND_DARK).font('Helvetica').fontSize(7).text(item.label, x - 2, baseY + 4, { width: barWidth + 4, align: 'center' });
    doc.font('Helvetica-Bold').fontSize(7).text(valueFormatter(value), x - 2, barY - 12, { width: barWidth + 4, align: 'center' });
  });

  doc.y = chartY + chartHeight + 14;
  resetCursor(doc);
};

const queryOne = async (sql, params = []) => {
  const { rows } = await db.query(sql, params);
  return rows[0] || {};
};

const queryAll = async (sql, params = []) => {
  const { rows } = await db.query(sql, params);
  return rows;
};

const getBusinessOverviewData = async () => {
  const summary = await queryOne(`
    SELECT
      (SELECT COUNT(*) FROM booking) AS total_bookings,
      (SELECT COALESCE(SUM(amount), 0) FROM payment) AS total_earnings,
      (SELECT COUNT(*) FROM booking WHERE booking_status = 'COMPLETED') AS completed_tours,
      (SELECT COUNT(*) FROM booking WHERE booking_status = 'CANCELLED') AS cancelled_bookings,
      (SELECT COALESCE(ROUND(AVG(rating), 1), 0) FROM review) AS average_rating
  `);

  return {
    totalBookings: Number(summary.total_bookings || 0),
    totalEarnings: Number(summary.total_earnings || 0),
    completedTours: Number(summary.completed_tours || 0),
    cancelledBookings: Number(summary.cancelled_bookings || 0),
    averageRating: Number(summary.average_rating || 0),
  };
};

const getMonthlyEarningsData = async () => {
  const currentYear = new Date().getFullYear();
  const rows = await queryAll(`
    SELECT EXTRACT(MONTH FROM received_date) AS month, COALESCE(SUM(amount), 0) AS earnings
    FROM payment
    WHERE EXTRACT(YEAR FROM received_date) = $1
    GROUP BY EXTRACT(MONTH FROM received_date)
    ORDER BY EXTRACT(MONTH FROM received_date)
  `, [currentYear]);

  const months = Array.from({ length: 12 }, (_, index) => {
    const row = rows.find((item) => Number(item.month) === index + 1);
    return {
      label: monthLabels[index],
      value: Number(row?.earnings || 0),
    };
  });

  const yearlyRows = await queryAll(`
    SELECT EXTRACT(YEAR FROM received_date) AS year, COALESCE(SUM(amount), 0) AS earnings
    FROM payment
    GROUP BY EXTRACT(YEAR FROM received_date)
    ORDER BY EXTRACT(YEAR FROM received_date) DESC
  `);

  return { months, yearlyRows };
};

const getBookingAnalysisData = async () => {
  const statusSummary = await queryAll(`
    SELECT booking_status AS status, COUNT(*) AS total
    FROM booking
    GROUP BY booking_status
    ORDER BY total DESC, status ASC
  `);

  const tourSummary = await queryAll(`
    SELECT tour_type AS "tourType", COUNT(*) AS total
    FROM booking
    GROUP BY tour_type
    ORDER BY total DESC, "tourType" ASC
  `);

  const currentYear = new Date().getFullYear();
  const trendRows = await queryAll(`
    SELECT EXTRACT(MONTH FROM booking_date) AS month, COUNT(*) AS total
    FROM booking
    WHERE EXTRACT(YEAR FROM booking_date) = $1
    GROUP BY EXTRACT(MONTH FROM booking_date)
    ORDER BY EXTRACT(MONTH FROM booking_date)
  `, [currentYear]);

  const monthlyTrend = Array.from({ length: 12 }, (_, index) => {
    const row = trendRows.find((item) => Number(item.month) === index + 1);
    return {
      label: monthLabels[index],
      value: Number(row?.total || 0),
    };
  });

  return { statusSummary, tourSummary, monthlyTrend };
};

const getVehicleAnalysisData = async () => {
  const mostUsedCategories = await queryAll(`
    SELECT COALESCE(vc.category_name, 'Unknown') AS label, COUNT(*) AS total
    FROM booking b
    LEFT JOIN vehicle_category vc ON vc.category_id = b.category_id
    GROUP BY vc.category_id, vc.category_name
    ORDER BY total DESC, label ASC
    LIMIT 10
  `);

  const mostBookedVehicles = await queryAll(`
    SELECT COALESCE(v.name, v.vehicle_number, 'Unassigned') AS label, COUNT(*) AS total
    FROM booking b
    LEFT JOIN vehicle v ON v.vehicle_id = b.vehicle_id
    GROUP BY v.vehicle_id, v.name, v.vehicle_number
    ORDER BY total DESC, label ASC
    LIMIT 10
  `);

  const availability = await queryOne(`
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE vehicle_status = 'AVAILABLE') AS available,
      COUNT(*) FILTER (WHERE vehicle_status = 'BOOKED') AS booked,
      COUNT(*) FILTER (WHERE vehicle_status = 'MAINTENANCE') AS maintenance
    FROM vehicle
  `);

  return {
    mostUsedCategories,
    mostBookedVehicles,
    availability: {
      total: Number(availability.total || 0),
      available: Number(availability.available || 0),
      booked: Number(availability.booked || 0),
      maintenance: Number(availability.maintenance || 0),
    },
  };
};

const getCustomerReviewData = async () => {
  const customersByCountry = await queryAll(`
    SELECT COALESCE(NULLIF(country, ''), 'Unknown') AS label, COUNT(*) AS total
    FROM "user"
    GROUP BY COALESCE(NULLIF(country, ''), 'Unknown')
    ORDER BY total DESC, label ASC
    LIMIT 12
  `);

  const reviewStats = await queryOne(`
    SELECT
      COUNT(*) AS total_reviews,
      COALESCE(ROUND(AVG(rating), 1), 0) AS average_rating,
      SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) AS five_star_reviews,
      SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) AS four_star_reviews,
      SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) AS three_star_reviews,
      SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) AS two_star_reviews,
      SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) AS one_star_reviews
    FROM review
  `);

  return {
    customersByCountry,
    reviewStats: {
      totalReviews: Number(reviewStats.total_reviews || 0),
      averageRating: Number(reviewStats.average_rating || 0),
      breakdown: {
        5: Number(reviewStats.five_star_reviews || 0),
        4: Number(reviewStats.four_star_reviews || 0),
        3: Number(reviewStats.three_star_reviews || 0),
        2: Number(reviewStats.two_star_reviews || 0),
        1: Number(reviewStats.one_star_reviews || 0),
      },
    },
  };
};

const sendPdf = (doc) => {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    drawFooter(doc, i + 1, range.count);
  }
  doc.end();
};

const generateBusinessOverviewPdf = async (_req, res) => {
  try {
    const data = await getBusinessOverviewData();
    const doc = createPdf(res, 'business-overview-report.pdf', 'Page 1 - Business Overview', 'Company-wide performance snapshot');

    drawSectionHeading(doc, 'Business Overview', 'A concise view of bookings, revenue, completed tours, cancellations, and average rating.');
    addMetricGrid(doc, [
      { label: 'Total Bookings', value: formatNumber(data.totalBookings) },
      { label: 'Total Earnings', value: formatMoney(data.totalEarnings) },
      { label: 'Completed Tours', value: formatNumber(data.completedTours) },
      { label: 'Cancelled Bookings', value: formatNumber(data.cancelledBookings) },
      { label: 'Average Rating', value: data.averageRating.toFixed(1) },
    ]);

    doc.moveDown(0.4);
    doc.font('Helvetica').fontSize(10).fillColor(BRAND_MID).text(`This report summarizes the overall business activity and service performance for ${COMPANY_NAME}.`);
    sendPdf(doc);
  } catch (error) {
    console.error('generateBusinessOverviewPdf error:', error);
    res.status(500).json({ message: 'Failed to generate business overview PDF.' });
  }
};

const generateEarningsReportPdf = async (_req, res) => {
  try {
    const data = await getMonthlyEarningsData();
    const doc = createPdf(res, 'earnings-report.pdf', 'Page 2 - Earnings Report', 'Revenue trends and annual earnings');

    drawSectionHeading(doc, 'Earnings Report', 'Monthly revenue is shown as a chart, followed by a year-by-year earnings table.');
    addBarChart(doc, 'Monthly Earnings Chart', data.months, formatMoney, '#0f766e');

    drawSectionHeading(doc, 'Yearly Earnings Table', 'A compact annual view of total revenue by year.');
    addTable(doc, ['Year', 'Earnings'], data.yearlyRows.map((row) => [row.year, formatMoney(row.earnings)]), [90, 420]);

    sendPdf(doc);
  } catch (error) {
    console.error('generateEarningsReportPdf error:', error);
    res.status(500).json({ message: 'Failed to generate earnings report PDF.' });
  }
};

const generateBookingAnalysisPdf = async (_req, res) => {
  try {
    const data = await getBookingAnalysisData();
    const doc = createPdf(res, 'booking-analysis-report.pdf', 'Page 3 - Booking Analysis', 'Booking workflow and demand patterns');

    drawSectionHeading(doc, 'Booking Analysis', 'This page shows the distribution of booking statuses, tour types, and monthly booking trends.');
    drawSectionHeading(doc, 'Booking Status Summary');
    addTable(doc, ['Status', 'Count'], data.statusSummary.map((row) => [row.status, formatNumber(row.total)]), [220, 290]);

    drawSectionHeading(doc, 'Tour Type Summary');
    addTable(doc, ['Tour Type', 'Count'], data.tourSummary.map((row) => [row.tourType, formatNumber(row.total)]), [220, 290]);

    addBarChart(doc, 'Monthly Booking Trend', data.monthlyTrend, formatNumber, '#2563eb');

    sendPdf(doc);
  } catch (error) {
    console.error('generateBookingAnalysisPdf error:', error);
    res.status(500).json({ message: 'Failed to generate booking analysis PDF.' });
  }
};

const generateVehicleAnalysisPdf = async (_req, res) => {
  try {
    const data = await getVehicleAnalysisData();
    const doc = createPdf(res, 'vehicle-analysis-report.pdf', 'Page 4 - Vehicle Analysis', 'Fleet usage and availability overview');

    drawSectionHeading(doc, 'Vehicle Analysis', 'This page highlights the most-used categories, the most booked vehicles, and the current fleet availability.');
    drawSectionHeading(doc, 'Most Used Vehicle Categories');
    addTable(doc, ['Category', 'Bookings'], data.mostUsedCategories.map((row) => [row.label, formatNumber(row.total)]), [250, 260]);

    drawSectionHeading(doc, 'Most Booked Vehicles');
    addTable(doc, ['Vehicle', 'Bookings'], data.mostBookedVehicles.map((row) => [row.label, formatNumber(row.total)]), [250, 260]);

    drawSectionHeading(doc, 'Vehicle Availability', 'A quick snapshot of the fleet status distribution.');
    addMetricGrid(doc, [
      { label: 'Total Vehicles', value: formatNumber(data.availability.total) },
      { label: 'Available', value: formatNumber(data.availability.available) },
      { label: 'Booked', value: formatNumber(data.availability.booked) },
      { label: 'Maintenance', value: formatNumber(data.availability.maintenance) },
    ]);

    sendPdf(doc);
  } catch (error) {
    console.error('generateVehicleAnalysisPdf error:', error);
    res.status(500).json({ message: 'Failed to generate vehicle analysis PDF.' });
  }
};

const generateCustomerReviewAnalysisPdf = async (_req, res) => {
  try {
    const data = await getCustomerReviewData();
    const doc = createPdf(res, 'customer-review-analysis-report.pdf', 'Page 5 - Customer & Review Analysis', 'Customer location and review sentiment');

    drawSectionHeading(doc, 'Customer & Review Analysis', 'This page combines customer geography with overall review sentiment and star distribution.');
    drawSectionHeading(doc, 'Customers by Country');
    addTable(doc, ['Country', 'Customers'], data.customersByCountry.map((row) => [row.label, formatNumber(row.total)]), [250, 260]);

    drawSectionHeading(doc, 'Review Score Snapshot', 'Summary metrics for overall review quality.');
    addMetricGrid(doc, [
      { label: 'Average Rating', value: data.reviewStats.averageRating.toFixed(1) },
      { label: 'Total Reviews', value: formatNumber(data.reviewStats.totalReviews) },
      { label: 'Top Rating Share', value: formatPercent(data.reviewStats.totalReviews ? (data.reviewStats.breakdown[5] / data.reviewStats.totalReviews) * 100 : 0) },
    ]);

    drawSectionHeading(doc, 'Review Star Summary');
    addTable(
      doc,
      ['Stars', 'Count'],
      [5, 4, 3, 2, 1].map((stars) => [`${stars} Star`, formatNumber(data.reviewStats.breakdown[stars])]),
      [220, 290]
    );

    sendPdf(doc);
  } catch (error) {
    console.error('generateCustomerReviewAnalysisPdf error:', error);
    res.status(500).json({ message: 'Failed to generate customer and review analysis PDF.' });
  }
};

const getBusinessOverviewJSON = async (_req, res) => {
  try {
    const data = await getBusinessOverviewData();
    res.json(data);
  } catch (error) {
    console.error('getBusinessOverviewJSON error:', error);
    res.status(500).json({ message: 'Failed to fetch business overview data.' });
  }
};

const getEarningsReportJSON = async (_req, res) => {
  try {
    const data = await getMonthlyEarningsData();
    res.json(data);
  } catch (error) {
    console.error('getEarningsReportJSON error:', error);
    res.status(500).json({ message: 'Failed to fetch earnings report data.' });
  }
};

const getBookingAnalysisJSON = async (_req, res) => {
  try {
    const data = await getBookingAnalysisData();
    res.json(data);
  } catch (error) {
    console.error('getBookingAnalysisJSON error:', error);
    res.status(500).json({ message: 'Failed to fetch booking analysis data.' });
  }
};

const getVehicleAnalysisJSON = async (_req, res) => {
  try {
    const data = await getVehicleAnalysisData();
    res.json(data);
  } catch (error) {
    console.error('getVehicleAnalysisJSON error:', error);
    res.status(500).json({ message: 'Failed to fetch vehicle analysis data.' });
  }
};

const getCustomerReviewAnalysisJSON = async (_req, res) => {
  try {
    const data = await getCustomerReviewData();
    res.json(data);
  } catch (error) {
    console.error('getCustomerReviewAnalysisJSON error:', error);
    res.status(500).json({ message: 'Failed to fetch customer review analysis data.' });
  }
};

module.exports = {
  generateBusinessOverviewPdf,
  generateEarningsReportPdf,
  generateBookingAnalysisPdf,
  generateVehicleAnalysisPdf,
  generateCustomerReviewAnalysisPdf,
  getBusinessOverviewJSON,
  getEarningsReportJSON,
  getBookingAnalysisJSON,
  getVehicleAnalysisJSON,
  getCustomerReviewAnalysisJSON,
};
