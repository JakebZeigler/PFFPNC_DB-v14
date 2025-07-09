import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Get all customers
router.get('/', async (req, res) => {
  try {
    const [customers] = await pool.execute(`
      SELECT c.*, 
             GROUP_CONCAT(
               JSON_OBJECT(
                 'dispositionId', dh.dispositionId,
                 'dispositionTime', dh.dispositionTime,
                 'agentNumber', dh.agentNumber,
                 'amount', dh.amount,
                 'ticketsAd', dh.ticketsAd,
                 'currentNotes', dh.currentNotes,
                 'program', dh.program,
                 'leadList', dh.leadList
               )
             ) as dispositionHistory
      FROM customers c
      LEFT JOIN disposition_history dh ON c.id = dh.customerId
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);

    // Parse disposition history JSON
    const customersWithHistory = customers.map(customer => ({
      ...customer,
      dispositionHistory: customer.dispositionHistory 
        ? JSON.parse(`[${customer.dispositionHistory}]`)
        : []
    }));

    res.json(customersWithHistory);
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Get customer by ID
router.get('/:id', async (req, res) => {
  try {
    const [customers] = await pool.execute(
      'SELECT * FROM customers WHERE id = ?',
      [req.params.id]
    );

    if (customers.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Get disposition history
    const [history] = await pool.execute(
      'SELECT * FROM disposition_history WHERE customerId = ? ORDER BY dispositionTime DESC',
      [req.params.id]
    );

    res.json({
      ...customers[0],
      dispositionHistory: history
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// Create or update customer
router.post('/', async (req, res) => {
  try {
    const customer = req.body;
    const customerId = customer.id || `cust-${Date.now()}`;

    // Check if customer exists
    const [existing] = await pool.execute(
      'SELECT id FROM customers WHERE id = ?',
      [customerId]
    );

    if (existing.length > 0) {
      // Update existing customer
      await pool.execute(`
        UPDATE customers SET
          phone = ?, title = ?, firstName = ?, lastName = ?, middleName = ?,
          address = ?, city = ?, state = ?, zip = ?, currentNotes = ?,
          businessResidential = ?, showNumber = ?, associationId = ?, coldPc = ?,
          agentNumber = ?, amount = ?, ticketsAd = ?, email = ?, creditCard = ?,
          expDate = ?, ccv = ?, routingNumber = ?, accountNumber = ?, website = ?,
          dispositionId = ?, dispositionTime = ?, program = ?
        WHERE id = ?
      `, [
        customer.phone, customer.title, customer.firstName, customer.lastName, customer.middleName,
        customer.address, customer.city, customer.state, customer.zip, customer.currentNotes,
        customer.businessResidential, customer.showNumber, customer.associationId, customer.coldPc,
        customer.agentNumber, customer.amount, customer.ticketsAd, customer.email, customer.creditCard,
        customer.expDate, customer.ccv, customer.routingNumber, customer.accountNumber, customer.website,
        customer.dispositionId, customer.dispositionTime, customer.program, customerId
      ]);
    } else {
      // Insert new customer
      await pool.execute(`
        INSERT INTO customers (
          id, phone, title, firstName, lastName, middleName, address, city, state, zip,
          currentNotes, businessResidential, showNumber, associationId, coldPc, agentNumber,
          amount, ticketsAd, email, creditCard, expDate, ccv, routingNumber, accountNumber,
          website, dispositionId, dispositionTime, program
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        customerId, customer.phone, customer.title, customer.firstName, customer.lastName, customer.middleName,
        customer.address, customer.city, customer.state, customer.zip, customer.currentNotes,
        customer.businessResidential, customer.showNumber, customer.associationId, customer.coldPc,
        customer.agentNumber, customer.amount, customer.ticketsAd, customer.email, customer.creditCard,
        customer.expDate, customer.ccv, customer.routingNumber, customer.accountNumber, customer.website,
        customer.dispositionId, customer.dispositionTime, customer.program
      ]);
    }

    // Add to disposition history if disposition info provided
    if (customer.dispositionId && customer.dispositionTime) {
      await pool.execute(`
        INSERT INTO disposition_history (
          customerId, dispositionId, dispositionTime, agentNumber, amount, ticketsAd, currentNotes, program
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        customerId, customer.dispositionId, customer.dispositionTime, customer.agentNumber,
        customer.amount, customer.ticketsAd, customer.currentNotes, customer.program
      ]);
    }

    res.json({ id: customerId, message: 'Customer saved successfully' });
  } catch (error) {
    console.error('Save customer error:', error);
    res.status(500).json({ error: 'Failed to save customer' });
  }
});

// Delete customer
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM customers WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

// Bulk add customers
router.post('/bulk', async (req, res) => {
  try {
    const customers = req.body;
    
    if (!Array.isArray(customers)) {
      return res.status(400).json({ error: 'Expected array of customers' });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      for (const customer of customers) {
        const customerId = customer.id || `cust-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        await connection.execute(`
          INSERT INTO customers (
            id, phone, title, firstName, lastName, middleName, address, city, state, zip,
            currentNotes, businessResidential, showNumber, associationId, coldPc, agentNumber,
            amount, ticketsAd, email, creditCard, expDate, ccv, routingNumber, accountNumber,
            website, dispositionId, dispositionTime, program
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          customerId, customer.phone, customer.title, customer.firstName, customer.lastName, customer.middleName,
          customer.address, customer.city, customer.state, customer.zip, customer.currentNotes,
          customer.businessResidential, customer.showNumber, customer.associationId, customer.coldPc,
          customer.agentNumber, customer.amount, customer.ticketsAd, customer.email, customer.creditCard,
          customer.expDate, customer.ccv, customer.routingNumber, customer.accountNumber, customer.website,
          customer.dispositionId, customer.dispositionTime, customer.program
        ]);
      }

      await connection.commit();
      res.json({ message: `${customers.length} customers added successfully` });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Bulk add customers error:', error);
    res.status(500).json({ error: 'Failed to add customers' });
  }
});

// Delete all customers
router.delete('/', async (req, res) => {
  try {
    const { verification } = req.body;
    
    if (verification !== 'DELETE ALL CUSTOMERS') {
      return res.status(400).json({ error: 'Invalid verification string' });
    }

    await pool.execute('DELETE FROM customers');
    res.json({ message: 'All customers deleted successfully' });
  } catch (error) {
    console.error('Delete all customers error:', error);
    res.status(500).json({ error: 'Failed to delete all customers' });
  }
});

export default router;
