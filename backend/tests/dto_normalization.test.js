const test = require('node:test');
const assert = require('node:assert/strict');

const bookingDto = require('../dto/bookingDto');
const packageDto = require('../dto/packageDto');
const vehicleDto = require('../dto/vehicleDto');
const paymentDto = require('../dto/paymentDto');
const reviewDto = require('../dto/reviewDto');
const inquiryDto = require('../dto/inquiryDto');
const authDto = require('../dto/authDto');

// ==========================================
// 1. Booking DTO Tests
// ==========================================
test('Booking DTO: extractBookingPayload handles valid coordinates and defaults', () => {
  const input = {
    customerName: '  John Doe  ',
    contactNumber: '+94771234567',
    pickupLat: '6.9271',
    pickupLng: '79.8612',
    dropoffLat: '',
    dropoffLng: null,
    totalDays: '5',
    luggageCustomItems: [{ weight: 15 }, { weight: 20 }],
    tourThoughts: 'Wants scenic route',
  };

  const payload = bookingDto.extractBookingPayload(input);

  assert.equal(payload.customerName, 'John Doe');
  assert.equal(payload.contactNumber, '+94771234567');
  assert.equal(payload.pickupLat, 6.9271);
  assert.equal(payload.pickupLng, 79.8612);
  assert.equal(payload.dropoffLat, null);
  assert.equal(payload.dropoffLng, null);
  assert.equal(payload.totalDays, 5);
  assert.ok(payload.fullTourThoughts.includes('Custom Luggage: Item 1: 15kg, Item 2: 20kg'));
  assert.ok(payload.fullTourThoughts.includes('Wants scenic route'));
});

test('Booking DTO: validateBookingPayload enforces mandatory fields and rejects CUSTOM tours', () => {
  const customPayload = { tourType: 'CUSTOM' };
  assert.equal(bookingDto.validateBookingPayload(customPayload).valid, false);

  const missingFieldsPayload = bookingDto.extractBookingPayload({
    customerName: '',
    startDate: '2026-11-01',
  });
  assert.equal(bookingDto.validateBookingPayload(missingFieldsPayload, false).valid, false);

  const validP2P = bookingDto.extractBookingPayload({
    tourType: 'P2P',
    customerName: 'Jane Smith',
    contactNumber: '+94770000000',
    startDate: '2026-11-01',
    endDate: '2026-11-05',
    categoryId: 1,
    startLocation: 'Colombo',
    endLocation: 'Kandy',
  });
  assert.equal(bookingDto.validateBookingPayload(validP2P, false).valid, true);
});

test('Booking DTO: mapBooking transforms view rows correctly', () => {
  const mockRow = {
    booking_id: 101,
    user_id: 5,
    customer_name: 'Alice Johnson',
    tour_type: 'PACKAGE',
    start_date: new Date('2026-12-01'),
    end_date: new Date('2026-12-05'),
    booking_date: new Date('2026-11-01'),
    quoted_price: '450.00',
    booking_status: 'CONFIRMED',
  };
  const mapped = bookingDto.mapBooking(mockRow);
  assert.equal(mapped.id, 101);
  assert.equal(mapped.bookingRef, 'CBT-PKG-101');
  assert.equal(mapped.quotedPrice, 450);
  assert.equal(mapped.startDate, '2026-12-01');
});

// ==========================================
// 2. Package DTO Tests
// ==========================================
test('Package DTO: Enum mapping, days formatting, and destinations parser', () => {
  assert.equal(packageDto.toPackageTypeEnum('Cultural Heritage'), 'CULTURAL HERITAGE');
  assert.equal(packageDto.toPackageTypeEnum('CULTURAL HERITAGE'), 'CULTURAL HERITAGE');
  assert.equal(packageDto.toPackageTypeEnum('Unknown Type'), null);

  assert.equal(packageDto.toPackageDaysLabel('7'), '7 DAYS');
  assert.equal(packageDto.toPackageDaysLabel('14 DAYS'), '14 DAYS');
  assert.equal(packageDto.toPackageDaysNumber('21 DAYS'), 21);

  const parsedDests = packageDto.parseDestinations('[{"name":"Sigiriya"},{"name":"Ella"}]');
  assert.equal(parsedDests.length, 2);
  assert.equal(parsedDests[0].name, 'Sigiriya');

  assert.deepEqual(packageDto.parseDestinations('corrupt json string'), []);
});

test('Package DTO: mapAdminPackage and mapPublicPackage format views accurately', () => {
  const adminRow = {
    package_id: 8,
    title: 'Hill Country Explorer',
    type: 'HILL COUNTRY',
    days: '5 DAYS',
    availability_status: 'AVAILABLE',
  };
  const adminMapped = packageDto.mapAdminPackage(adminRow, { 8: [{ name: 'Nuwara Eliya' }, { name: 'Ella' }] });
  assert.equal(adminMapped.places_count, 2);
  assert.equal(adminMapped.availability.status, 'AVAILABLE');

  const publicRow = {
    package_id: 8,
    title: 'Hill Country Explorer',
    type: 'HILL COUNTRY',
    days: '5 DAYS',
    total_places: 3,
    destinations: [{ name: 'Nuwara Eliya' }, { name: 'Ella' }, { name: 'Kandy' }],
    availability_status: 'AVAILABLE',
  };
  const publicMapped = packageDto.mapPublicPackage(publicRow);
  assert.equal(publicMapped.destinations.length, 2);
  assert.equal(publicMapped.hidden_dest_count, 1);
});

// ==========================================
// 3. Vehicle DTO Tests
// ==========================================
test('Vehicle DTO: Insurance period validation, images, and category normalization', () => {
  const validInsurance = vehicleDto.validateInsurancePeriod('2026-01-01', '2027-01-01');
  assert.equal(validInsurance.valid, true);

  const invalidInsurance = vehicleDto.validateInsurancePeriod('2026-01-01', '2026-06-01');
  assert.equal(invalidInsurance.valid, false);

  const categoryPayload = vehicleDto.extractCategoryPayload({
    name: ' Luxury SUV ',
    ac_available: 'true',
    passenger_capacity: '4-5 Adults',
  });
  assert.equal(categoryPayload.name, 'Luxury SUV');
  assert.equal(categoryPayload.ac_available, true);

  const imgInfo = vehicleDto.parseImageUrls('["http://img1.jpg"]', ['http://img2.jpg']);
  assert.equal(imgInfo.list.length, 2);
  assert.equal(imgInfo.primary, 'http://img1.jpg');
});

test('Vehicle DTO: extractVehiclePayload and mapVehicle consistency', () => {
  const rawVehicle = {
    category_id: '3',
    vehicle_name: 'Toyota Prius',
    license_plate: 'WP-CAB-1234',
    manufactured_year: '2020',
    seats: '4',
    price_per_day: '85.00',
    vehicle_license: 'LIC-999',
    insurance_provider: 'Sri Lanka Insurance',
    insurance_start_date: '2026-01-01',
    insurance_end_date: '2027-01-01',
  };

  const payload = vehicleDto.extractVehiclePayload(rawVehicle);
  assert.equal(payload.categoryId, 3);
  assert.equal(payload.vehicleName, 'Toyota Prius');
  assert.equal(payload.licensePlate, 'WP-CAB-1234');
  assert.equal(vehicleDto.validateVehiclePayload(payload).valid, true);

  const dbRow = {
    vehicle_id: 12,
    category_id: 3,
    category_name: 'Hybrid Sedan',
    vehicle_number: 'WP-CAB-1234',
    name: 'Toyota Prius',
    price_per_day: '85.00',
    adult_seats: 4,
    insurance_start_date: '2026-01-01',
    insurance_end_date: '2027-01-01',
    vehicle_status: 'AVAILABLE',
  };
  const mapped = vehicleDto.mapVehicle(dbRow);
  assert.equal(mapped.license_plate, 'WP-CAB-1234');
  assert.equal(mapped.vehicle_name, 'Toyota Prius');
  assert.equal(mapped.status, 'Available');
  assert.equal(mapped.price_per_day, 85);
});

// ==========================================
// 4. Payment DTO Tests
// ==========================================
test('Payment DTO: Reference formatting, amounts, and row mapping', () => {
  assert.equal(paymentDto.getBookingReference('PACKAGE', 42), 'CBT-PKG-42');
  assert.equal(paymentDto.getBookingReference('P2P', 108), 'CBT-P2P-108');
  assert.equal(paymentDto.formatLKR(15000), 'LKR 15,000.00');

  const paymentRow = {
    payment_id: 5,
    booking_id: 101,
    tour_type: 'PACKAGE',
    customer_name: 'Alice',
    installment: 'DEPOSIT',
    amount: '12000.00',
    status: 'APPROVED',
    payment_method: 'CASH',
  };
  const mapped = paymentDto.mapPaymentRow(paymentRow);
  assert.equal(mapped.id, 'PAY005');
  assert.equal(mapped.bookingId, 'CBT-PKG-101');
  assert.equal(mapped.type, 'Deposit');

  const txMapped = paymentDto.mapTransactionRow(paymentRow, 'CBT-PKG-101');
  assert.equal(txMapped.id, 'TX005');
  assert.equal(txMapped.status, 'VERIFIED');
  assert.equal(txMapped.method, 'Cash');
  assert.equal(paymentDto.mapTransactionRow({ ...paymentRow, payment_method: 'BANK_TRANSFER' }, 'CBT-PKG-101').method, 'Bank Transfer');
});

test('Payment DTO: accepts cash and bank transfer payments with flexible amounts and two-decimal precision', () => {
  const payload = paymentDto.extractPaymentPayload({
    booking_id: '12', installment: 'PARTIAL', amount: '250.50', received_date: '2026-10-24', payment_method: 'cash',
  });
  assert.equal(paymentDto.validatePaymentPayload(payload).valid, true);
  const bankPayload = paymentDto.extractPaymentPayload({
    booking_id: '12', installment: 'PARTIAL', amount: '250.50', received_date: '2026-10-24', payment_method: 'BANK_TRANSFER',
  });
  assert.equal(paymentDto.validatePaymentPayload(bankPayload).valid, true);

  const invalidPrecision = paymentDto.extractPaymentPayload({
    booking_id: '12', installment: 'PARTIAL', amount: '250.501', received_date: '2026-10-24', payment_method: 'CASH',
  });
  assert.equal(paymentDto.validatePaymentPayload(invalidPrecision).valid, false);
  const invalidMethod = paymentDto.extractPaymentPayload({
    booking_id: '12', installment: 'PARTIAL', amount: '250.50', received_date: '2026-10-24', payment_method: 'CARD',
  });
  assert.equal(paymentDto.validatePaymentPayload(invalidMethod).valid, false);
});

// ==========================================
// 5. Review DTO Tests
// ==========================================
test('Review DTO: Country flags, row mapping, and payload validation', () => {
  assert.equal(reviewDto.getCountryFlag('Sri Lanka'), '🇱🇰');
  assert.equal(reviewDto.getCountryFlag('United Kingdom'), '🇬🇧');
  assert.equal(reviewDto.getCountryFlag('Unknown Nation'), '🌍');

  const reviewRow = {
    review_id: 7,
    booking_id: 55,
    customer_name: 'Bob',
    customer_country: 'Germany',
    rating: 5,
    feedback: 'Fantastic tour experience!',
    created_at: new Date('2026-10-15'),
  };
  const mapped = reviewDto.mapReviewRow(reviewRow);
  assert.equal(mapped.id, 'r-7');
  assert.equal(mapped.user.countryFlag, '🇩🇪');
  assert.equal(mapped.stars, 5);

  const payload = reviewDto.extractReviewPayload({
    customerEmail: 'bob@example.com',
    bookingId: '55',
    stars: '5',
    comment: 'Great guide!',
  });
  assert.equal(payload.bookingId, 55);
  assert.equal(payload.stars, 5);
  assert.equal(reviewDto.validateReviewPayload(payload).valid, true);
});

// ==========================================
// 6. Inquiry DTO Tests
// ==========================================
test('Inquiry DTO: Row mapping and validation', () => {
  const inquiryRow = {
    inquiry_id: 14,
    sender_name: 'Charlie',
    sender_email: 'charlie@example.com',
    message: 'Can I book a 10-day tour?',
    status: 'new',
    is_read: false,
    submitted_at: new Date('2026-10-20'),
  };
  const mapped = inquiryDto.mapInquiry(inquiryRow);
  assert.equal(mapped.id, 14);
  assert.equal(mapped.customerName, 'Charlie');
  assert.equal(mapped.isRead, false);

  const payload = inquiryDto.extractInquiryPayload({
    name: 'Charlie',
    email: 'charlie@example.com',
    message: 'Hello',
  });
  assert.equal(inquiryDto.validateInquiryPayload(payload).valid, true);
});

// ==========================================
// 7. Auth DTO Tests
// ==========================================
test('Auth DTO: User payload sanitization and payload extraction', () => {
  const rawUser = {
    user_id: 3,
    email: 'test@example.com',
    name: 'Test User',
    role: 'CUSTOMER',
    password_hash: 'secret_hash',
  };
  const userPayload = authDto.buildUserPayload(rawUser);
  assert.equal(userPayload.id, 3);
  assert.equal(userPayload.email, 'test@example.com');
  assert.equal(userPayload.password_hash, undefined);

  const loginPayload = authDto.extractLoginPayload({
    email: ' TEST@EXAMPLE.COM ',
    password: 'password123',
  });
  assert.equal(loginPayload.email, 'test@example.com');
  assert.equal(loginPayload.password, 'password123');
});
