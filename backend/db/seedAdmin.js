require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./connection');

const seedAdmin = async () => {
  const adminEmail = 'admin@ceylon.com';
  const adminPassword = 'admin1234';
  const adminName = 'Super Admin';
  const adminCountry = 'Sri Lanka';

  try {
    console.log('Checking for existing admin user...');
    const { rows: existing } = await db.query(
      'SELECT user_id FROM "user" WHERE email = $1 LIMIT 1',
      [adminEmail]
    );

    if (existing.length > 0) {
      console.log('Admin user already exists!');
      process.exit(0);
    }

    console.log('Hashing password...');
    const saltRounds = 10;
    const hash = await bcrypt.hash(adminPassword, saltRounds);

    console.log('Inserting admin user...');
    await db.query(
      'INSERT INTO "user" (name, email, password_hash, role, country) VALUES ($1, $2, $3, $4, $5)',
      [adminName, adminEmail, hash, 'ADMIN', adminCountry]
    );

    console.log('Admin user successfully created!');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
  } catch (error) {
    console.error('Error seeding admin user:', error);
  } finally {
    process.exit();
  }
};

seedAdmin();
