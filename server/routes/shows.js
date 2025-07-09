import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Get all shows
router.get('/', async (req, res) => {
  try {
    const [shows] = await pool.execute('SELECT * FROM shows ORDER BY showNumber');
    
    // Parse JSON venues
    const parsedShows = shows.map(show => ({
      ...show,
      venues: JSON.parse(show.venues || '[]')
    }));
    
    res.json(parsedShows);
  } catch (error) {
    console.error('Get shows error:', error);
    res.status(500).json({ error: 'Failed to fetch shows' });
  }
});

// Create or update show
router.post('/', async (req, res) => {
  try {
    const show = req.body;
    const showId = show.id || `show-${Date.now()}`;

    // Check if show exists
    const [existing] = await pool.execute('SELECT id FROM shows WHERE id = ?', [showId]);

    if (existing.length > 0) {
      // Update existing show
      await pool.execute(`
        UPDATE shows SET showNumber = ?, showName = ?, genre = ?, startDate = ?, endDate = ?, venues = ?, isDefault = ?
        WHERE id = ?
      `, [show.showNumber, show.showName, show.genre, show.startDate, show.endDate, JSON.stringify(show.venues || []), show.isDefault, showId]);
    } else {
      // Insert new show
      await pool.execute(`
        INSERT INTO shows (id, showNumber, showName, genre, startDate, endDate, venues, isDefault)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [showId, show.showNumber, show.showName, show.genre, show.startDate, show.endDate, JSON.stringify(show.venues || []), show.isDefault]);
    }

    res.json({ id: showId, message: 'Show saved successfully' });
  } catch (error) {
    console.error('Save show error:', error);
    res.status(500).json({ error: 'Failed to save show' });
  }
});

// Delete show
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM shows WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Show not found' });
    }
    
    res.json({ message: 'Show deleted successfully' });
  } catch (error) {
    console.error('Delete show error:', error);
    res.status(500).json({ error: 'Failed to delete show' });
  }
});

export default router;
