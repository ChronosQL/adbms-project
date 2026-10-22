const db = require('../db/connection');

const getAllCities = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT id, name FROM city ORDER BY name ASC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ message: 'Failed to fetch cities' });
  }
};

const addCity = async (req, res) => {
  const { name } = req.body;
  if (!name || name.trim() === '') {
    return res.status(400).json({ message: 'City name is required' });
  }

  try {
    const { rows } = await db.query('INSERT INTO city (name) VALUES ($1) RETURNING id', [name.trim()]);
    res.status(201).json({ id: rows[0].id, name: name.trim() });
  } catch (error) {
    console.error('Error adding city:', error);
    if (error.code === '23505') {
      return res.status(409).json({ message: 'City already exists' });
    }
    res.status(500).json({ message: 'Failed to add city' });
  }
};

const deleteCity = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM city WHERE id = $1', [id]);
    res.json({ message: 'City deleted successfully' });
  } catch (error) {
    console.error('Error deleting city:', error);
    res.status(500).json({ message: 'Failed to delete city' });
  }
};

module.exports = {
  getAllCities,
  addCity,
  deleteCity
};
