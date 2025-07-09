import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Get all agents
router.get('/', async (req, res) => {
  try {
    const [agents] = await pool.execute('SELECT * FROM agents ORDER BY agentNumber');
    res.json(agents);
  } catch (error) {
    console.error('Get agents error:', error);
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

// Get agent by ID
router.get('/:id', async (req, res) => {
  try {
    const [agents] = await pool.execute('SELECT * FROM agents WHERE id = ?', [req.params.id]);
    
    if (agents.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    res.json(agents[0]);
  } catch (error) {
    console.error('Get agent error:', error);
    res.status(500).json({ error: 'Failed to fetch agent' });
  }
});

// Create or update agent
router.post('/', async (req, res) => {
  try {
    const agent = req.body;
    const agentId = agent.id || `agent-${Date.now()}`;

    // Check if agent exists
    const [existing] = await pool.execute('SELECT id FROM agents WHERE id = ?', [agentId]);

    if (existing.length > 0) {
      // Update existing agent
      await pool.execute(`
        UPDATE agents SET agentNumber = ?, phone = ?, firstName = ?, lastName = ?, email = ?, isDefault = ?
        WHERE id = ?
      `, [agent.agentNumber, agent.phone, agent.firstName, agent.lastName, agent.email, agent.isDefault, agentId]);
    } else {
      // Insert new agent
      await pool.execute(`
        INSERT INTO agents (id, agentNumber, phone, firstName, lastName, email, isDefault)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [agentId, agent.agentNumber, agent.phone, agent.firstName, agent.lastName, agent.email, agent.isDefault]);
    }

    res.json({ id: agentId, message: 'Agent saved successfully' });
  } catch (error) {
    console.error('Save agent error:', error);
    res.status(500).json({ error: 'Failed to save agent' });
  }
});

// Delete agent
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM agents WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    res.json({ message: 'Agent deleted successfully' });
  } catch (error) {
    console.error('Delete agent error:', error);
    res.status(500).json({ error: 'Failed to delete agent' });
  }
});

export default router;
