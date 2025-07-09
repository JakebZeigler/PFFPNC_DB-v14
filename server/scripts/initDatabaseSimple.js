require('dotenv').config();
const mysql = require('mysql2/promise');

async function initDatabase() {
  let connection;
  
  try {
    console.log('Connecting to MySQL...');
    
    // First connect without specifying database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || 3306,
      ssl: false
    });

    console.log('Connected to MySQL successfully!');

    // Create database if it doesn't exist
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    console.log(`Database ${process.env.DB_NAME} created or already exists`);

    // Use the database
    await connection.execute(`USE ${process.env.DB_NAME}`);

    // Create tables
    console.log('Creating tables...');

    // Users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Customers table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Agents table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS agents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(50),
        department VARCHAR(100),
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Dispositions table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS dispositions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        modifiers JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Shows table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS shows (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        date DATE,
        time TIME,
        venues JSON,
        status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Associations table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS associations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100),
        description TEXT,
        contact_info JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Customer disposition history table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS customer_disposition_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT,
        disposition_id INT,
        agent_id INT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
        FOREIGN KEY (disposition_id) REFERENCES dispositions(id),
        FOREIGN KEY (agent_id) REFERENCES agents(id)
      )
    `);

    console.log('Tables created successfully!');

    // Insert sample data
    console.log('Inserting sample data...');

    // Insert users
    await connection.execute(`
      INSERT IGNORE INTO users (username, email, password, role) VALUES 
      ('admin', 'admin@pffpnc.com', 'admin123', 'admin'),
      ('user1', 'user1@pffpnc.com', 'user123', 'user')
    `);

    // Insert agents
    await connection.execute(`
      INSERT IGNORE INTO agents (name, email, phone, department) VALUES 
      ('John Smith', 'john@pffpnc.com', '555-0101', 'Sales'),
      ('Jane Doe', 'jane@pffpnc.com', '555-0102', 'Support'),
      ('Mike Johnson', 'mike@pffpnc.com', '555-0103', 'Sales')
    `);

    // Insert dispositions
    await connection.execute(`
      INSERT IGNORE INTO dispositions (name, description, category, modifiers) VALUES 
      ('Interested', 'Customer showed interest', 'Positive', '["follow_up", "priority"]'),
      ('Not Interested', 'Customer not interested', 'Negative', '["no_contact"]'),
      ('Callback Requested', 'Customer requested callback', 'Neutral', '["schedule_callback"]')
    `);

    // Insert customers
    await connection.execute(`
      INSERT IGNORE INTO customers (name, email, phone, address) VALUES 
      ('Alice Johnson', 'alice@email.com', '555-1001', '123 Main St, City, State'),
      ('Bob Smith', 'bob@email.com', '555-1002', '456 Oak Ave, City, State'),
      ('Carol Davis', 'carol@email.com', '555-1003', '789 Pine Rd, City, State')
    `);

    // Insert shows
    await connection.execute(`
      INSERT IGNORE INTO shows (name, description, date, time, venues) VALUES 
      ('Summer Concert', 'Annual summer music event', '2024-07-15', '19:00:00', '["Main Stage", "Side Stage"]'),
      ('Art Exhibition', 'Local artists showcase', '2024-08-01', '10:00:00', '["Gallery A", "Gallery B"]')
    `);

    // Insert associations
    await connection.execute(`
      INSERT IGNORE INTO associations (name, type, description, contact_info) VALUES 
      ('Music Lovers Club', 'Community', 'Local music enthusiasts', '{"email": "info@musiclovers.com", "phone": "555-2001"}'),
      ('Art Society', 'Professional', 'Professional artists group', '{"email": "contact@artsociety.com", "phone": "555-2002"}')
    `);

    console.log('Sample data inserted successfully!');
    console.log('Database initialization completed!');

  } catch (error) {
    console.error('Database initialization failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initDatabase();
