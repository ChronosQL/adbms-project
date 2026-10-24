const test = require('node:test');
const assert = require('node:assert/strict');

const bookingDto = require('../dto/bookingDto');
const packageDto = require('../dto/packageDto');
const vehicleDto = require('../dto/vehicleDto');
const paymentDto = require('../dto/paymentDto');

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

  // Safe destinations parser
  const parsedDests = packageDto.parseDestinations('[{"name":"Sigiriya"},{"name":"Ella"}]');
  assert.equal(parsedDests.length, 2);
  assert.equal(parsedDests[0].name, 'Sigiriya');

  // Corrupted JSON returns empty array gracefully
  assert.deepEqual(packageDto.parseDestinations('corrupt json string'), []);
});

// ==========================================
// 3. Vehicle DTO Tests
// ==========================================
test('Vehicle DTO: Insurance period validation and category normalization', () => {
  // Insurance must be exactly 1 year
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
});

// ==========================================
// 4. Payment DTO Tests
// ==========================================
test('Payment DTO: Reference formatting and positive amount validation', () => {
  assert.equal(paymentDto.getBookingReference('PACKAGE', 42), 'CBT-PKG-42');
  assert.equal(paymentDto.getBookingReference('P2P', 108), 'CBT-P2P-108');

  assert.equal(paymentDto.formatLKR(15000), 'LKR 15,000.00');

  const validPayment = paymentDto.extractPaymentPayload({
    booking_id: 15,
    installment: 'DEPOSIT',
    amount: '7500.50',
  });
  assert.equal(validPayment.amount, 7500.50);
  assert.equal(paymentDto.validatePaymentPayload(validPayment).valid, true);

  const negativePayment = paymentDto.extractPaymentPayload({
    booking_id: 15,
    installment: 'DEPOSIT',
    amount: '-500',
  });
  assert.equal(paymentDto.validatePaymentPayload(negativePayment).valid, false);
});
