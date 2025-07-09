import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 3306
};

// Initial data based on your mockData.ts
const initialData = {
  users: [
    {
      id: 'user-admin-1',
      email: 'jakebpffpnc@gmail.com',
      password: '1024924z',
      firstName: 'Jake',
      lastName: 'Zeigler',
      role: 'admin',
      status: 'active'
    },
    {
      id: 'user-pending-1',
      email: 'pending.user@example.com',
      password: 'password',
      firstName: 'Penny',
      lastName: 'Pending',
      role: 'user',
      status: 'pending'
    },
    {
      id: 'user-active-1',
      email: 'active.user@example.com',
      password: 'password',
      firstName: 'Archie',
      lastName: 'Active',
      role: 'user',
      status: 'active'
    }
  ],
  dispositions: [
    { id: 'disp-1', name: 'Sale', modifiers: ['Sale'], isDefault: false },
    { id: 'disp-2', name: 'No Answer', modifiers: [], isDefault: true },
    { id: 'disp-3', name: 'Busy', modifiers: [], isDefault: false },
    { id: 'disp-4', name: 'Not Interested', modifiers: ['DNC'], isDefault: false },
    { id: 'disp-5', name: 'Call Back', modifiers: [], isDefault: false }
  ],
  agents: [
    { id: 'agent-1', agentNumber: 7, firstName: 'John', lastName: 'Smith', phone: '555-0123', email: 'john@example.com', isDefault: true },
    { id: 'agent-2', agentNumber: 12, firstName: 'Sarah', lastName: 'Johnson', phone: '555-0124', email: 'sarah@example.com', isDefault: false }
  ],
  shows: [
    { id: 'show-1', showNumber: 74, showName: 'Summer Concert Series', genre: 'Music', startDate: '2024-06-01', endDate: '2024-08-31', venues: [], isDefault: true }
  ],
  associations: [
    { id: 'assoc-1', associationId: 'RAL', associationName: 'Raleigh Association', associatedCity: 'Raleigh', isDefault: true },
    { id: 'assoc-2', associationId: 'DUR', associationName: 'Durham Association', associatedCity: 'Durham', isDefault: false }
  ]
};

async function initializeDatabase() {
  let connection;
  
  try {
    // Connect to MySQL server (without database)
    connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      port: dbConfig.port
    });

    console.log('Connected to MySQL server');

    // Create database if it doesn't exist
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'pffpnc_db'}`);
    console.log(`Database ${process.env.DB_NAME || 'pffpnc_db'} created or already exists`);

    // Use the database
    await connection.execute(`USE ${process.env.DB_NAME || 'pffpnc_db'}`);

    // Create tables
    const createTables = [
      `CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        firstName VARCHAR(255) NOT NULL,
        lastName VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user') NOT NULL,
        status ENUM('active', 'pending') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS dispositions (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        modifiers JSON,
        isDefault BOOLEAN DEFAULT FALSE,
        timeOutDays INT,
        excludeAfterAttempts INT,
        excludeAction ENUM('None', 'DNC', 'TimeOut'),
        excludeActionTimeOutDays INT
      )`,
      
      `CREATE TABLE IF NOT EXISTS agents (
        id VARCHAR(255) PRIMARY KEY,
        agentNumber INT UNIQUE NOT NULL,
        phone VARCHAR(20),
        firstName VARCHAR(255) NOT NULL,
        lastName VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        isDefault BOOLEAN DEFAULT FALSE
      )`,
      
      `CREATE TABLE IF NOT EXISTS shows (
        id VARCHAR(255) PRIMARY KEY,
        showNumber INT UNIQUE NOT NULL,
        showName VARCHAR(255) NOT NULL,
        genre VARCHAR(255),
        startDate DATE,
        endDate DATE,
        venues JSON,
        isDefault BOOLEAN DEFAULT FALSE
      )`,
      
      `CREATE TABLE IF NOT EXISTS associations (
        id VARCHAR(255) PRIMARY KEY,
        associationId VARCHAR(255) UNIQUE NOT NULL,
        associationName VARCHAR(255) NOT NULL,
        associatedCity VARCHAR(255),
        isDefault BOOLEAN DEFAULT FALSE
      )`,
      
      `CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(255) PRIMARY KEY,
        phone VARCHAR(20) NOT NULL,
        title VARCHAR(50),
        firstName VARCHAR(255) NOT NULL,
        lastName VARCHAR(255) NOT NULL,
        middleName VARCHAR(255),
        address VARCHAR(500),
        city VARCHAR(255),
        state VARCHAR(50),
        zip VARCHAR(20),
        currentNotes TEXT,
        businessResidential VARCHAR(50),
        showNumber INT,
        associationId VARCHAR(255),
        coldPc VARCHAR(10),
        agentNumber INT,
        amount DECIMAL(10,2),
        ticketsAd INT,
        email VARCHAR(255),
        creditCard VARCHAR(255),
        expDate VARCHAR(10),
        ccv VARCHAR(10),
        routingNumber VARCHAR(255),
        accountNumber VARCHAR(255),
        website VARCHAR(255),
        dispositionId VARCHAR(255),
        dispositionTime DATETIME,
        program VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (dispositionId) REFERENCES dispositions(id),
        FOREIGN KEY (associationId) REFERENCES associations(associationId),
        INDEX idx_phone (phone),
        INDEX idx_disposition (dispositionId),
        INDEX idx_agent (agentNumber)
      )`,
      
      `CREATE TABLE IF NOT EXISTS disposition_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customerId VARCHAR(255),
        dispositionId VARCHAR(255),
        dispositionTime DATETIME,
        agentNumber INT,
        amount DECIMAL(10,2),
        ticketsAd INT,
        currentNotes TEXT,
        program VARCHAR(255),
        leadList VARCHAR(255),
        FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE CASCADE,
        FOREIGN KEY (dispositionId) REFERENCES dispositions(id)
      )`
    ];

    for (const query of createTables) {
      await connection.execute(query);
    }
    console.log('✅ All tables created successfully');

    // Insert initial data
    console.log('Inserting initial data...');

    // Insert users
    for (const user of initialData.users) {
      await connection.execute(
        'INSERT IGNORE INTO users (id, email, password, firstName, lastName, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [user.id, user.email, user.password, user.firstName, user.lastName, user.role, user.status]
      );
    }

    // Insert dispositions
    for (const disp of initialData.dispositions) {
      await connection.execute(
        'INSERT IGNORE INTO dispositions (id, name, modifiers, isDefault) VALUES (?, ?, ?, ?)',
        [disp.id, disp.name, JSON.stringify(disp.modifiers), disp.isDefault]
      );
    }

    // Insert agents
    for (const agent of initialData.agents) {
      await connection.execute(
        'INSERT IGNORE INTO agents (id, agentNumber, firstName, lastName, phone, email, isDefault) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [agent.id, agent.agentNumber, agent.firstName, agent.lastName, agent.phone, agent.email, agent.isDefault]
      );
    }

    // Insert shows
    for (const show of initialData.shows) {
      await connection.execute(
        'INSERT IGNORE INTO shows (id, showNumber, showName, genre, startDate, endDate, venues, isDefault) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [show.id, show.showNumber, show.showName, show.genre, show.startDate, show.endDate, JSON.stringify(show.venues), show.isDefault]
      );
    }

    // Insert associations
    for (const assoc of initialData.associations) {
      await connection.execute(
        'INSERT IGNORE INTO associations (id, associationId, associationName, associatedCity, isDefault) VALUES (?, ?, ?, ?, ?)',
        [assoc.id, assoc.associationId, assoc.associationName, assoc.associatedCity, assoc.isDefault]
      );
    }

    console.log('✅ Initial data inserted successfully');
    console.log('🎉 Database initialization complete!');

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run initialization
initializeDatabase().catch(console.error);
