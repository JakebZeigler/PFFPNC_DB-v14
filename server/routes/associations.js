import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Get all associations
router.get('/', async (req, res) => {
  try {
    const [associations] = await pool.execute('SELECT * FROM associations ORDER BY associationId');
    res.json(associations);
  } catch (error) {
    console.error('Get associations error:', error);
    res.status(500).json({ error: 'Failed to fetch associations' });
  }
});

// Create or update association
router.post('/', async (req, res) => {
  try {
    const association = req.body;
    const assocId = association.id || `assoc-${Date.now()}`;

    // Check if association exists
    const [existing] = await pool.execute('SELECT id FROM associations WHERE id = ?', [assocId]);

    if (existing.length > 0) {
      // Update existing association
      await pool.execute(`
        UPDATE associations SET associationId = ?, associationName = ?, associatedCity = ?, isDefault = ?
        WHERE id = ?
      `, [association.associationId, association.associationName, association.associatedCity, association.isDefault, assocId]);
    } else {
      // Insert new association
      await pool.execute(`
        INSERT INTO associations (id, associationId, associationName, associatedCity, isDefault)
        VALUES (?, ?, ?, ?, ?)
      `, [assocId, association.associationId, association.associationName, association.associatedCity, association.isDefault]);
    }

    res.json({ id: assocId, message: 'Association saved successfully' });
  } catch (error) {
    console.error('Save association error:', error);
    res.status(500).json({ error: 'Failed to save association' });
  }
});

// Delete association
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM associations WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Association not found' });
    }
    
    res.json({ message: 'Association deleted successfully' });
  } catch (error) {
    console.error('Delete association error:', error);
    res.status(500).json({ error: 'Failed to delete association' });
  }
});

export default router;
