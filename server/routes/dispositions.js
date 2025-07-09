import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Get all dispositions
router.get('/', async (req, res) => {
  try {
    const [dispositions] = await pool.execute('SELECT * FROM dispositions ORDER BY name');
    
    // Parse JSON modifiers
    const parsedDispositions = dispositions.map(disp => ({
      ...disp,
      modifiers: JSON.parse(disp.modifiers || '[]')
    }));
    
    res.json(parsedDispositions);
  } catch (error) {
    console.error('Get dispositions error:', error);
    res.status(500).json({ error: 'Failed to fetch dispositions' });
  }
});

// Create or update disposition
router.post('/', async (req, res) => {
  try {
    const disposition = req.body;
    const dispId = disposition.id || `disp-${Date.now()}`;

    // Check if disposition exists
    const [existing] = await pool.execute('SELECT id FROM dispositions WHERE id = ?', [dispId]);

    if (existing.length > 0) {
      // Update existing disposition
      await pool.execute(`
        UPDATE dispositions SET name = ?, modifiers = ?, isDefault = ?, timeOutDays = ?, 
               excludeAfterAttempts = ?, excludeAction = ?, excludeActionTimeOutDays = ?
        WHERE id = ?
      `, [
        disposition.name, JSON.stringify(disposition.modifiers || []), disposition.isDefault,
        disposition.timeOutDays, disposition.excludeAfterAttempts, disposition.excludeAction,
        disposition.excludeActionTimeOutDays, dispId
      ]);
    } else {
      // Insert new disposition
      await pool.execute(`
        INSERT INTO dispositions (id, name, modifiers, isDefault, timeOutDays, excludeAfterAttempts, excludeAction, excludeActionTimeOutDays)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        dispId, disposition.name, JSON.stringify(disposition.modifiers || []), disposition.isDefault,
        disposition.timeOutDays, disposition.excludeAfterAttempts, disposition.excludeAction,
        disposition.excludeActionTimeOutDays
      ]);
    }

    res.json({ id: dispId, message: 'Disposition saved successfully' });
  } catch (error) {
    console.error('Save disposition error:', error);
    res.status(500).json({ error: 'Failed to save disposition' });
  }
});

// Delete disposition
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM dispositions WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Disposition not found' });
    }
    
    res.json({ message: 'Disposition deleted successfully' });
  } catch (error) {
    console.error('Delete disposition error:', error);
    res.status(500).json({ error: 'Failed to delete disposition' });
  }
});

export default router;
