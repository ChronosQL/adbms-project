const test = require('node:test');
const assert = require('node:assert/strict');
const { toCents, fromCents } = require('../utils/money');

test('LKR amounts compare at cent precision without binary floating point drift', () => {
  assert.equal(toCents(19.83999999999999), 1984);
  assert.equal(toCents(1.839999999999982), 184);
  assert.equal(toCents(19.84), 1984);
  assert.equal(toCents(19.85) > toCents(19.84), true);
});

test('cent conversion preserves two decimal place currency values', () => {
  assert.equal(fromCents(toCents('593.67')), 593.67);
  assert.equal(fromCents(0), 0);
  assert.equal(fromCents(-1), -0.01);
});
