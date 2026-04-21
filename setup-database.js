import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function setupDatabase() {
  console.log('Setting up PayToPermit database...');
  
  // Read the schema file
  const schemaPath = path.join(process.cwd(), 'database', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  // Database connection (without specifying database initially)
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  });
  
  try {
    console.log('Connected to MySQL server');
    
    // Execute the schema
    const statements = schema.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 50) + '...');
        await connection.query(statement);
      }
    }
    
    console.log('✅ Database setup completed successfully!');
    console.log('\n📋 Default users created:');
    console.log('Admin: admin@paytopermit.com / admin123');
    console.log('Student: john.doe@university.edu / student123');
    console.log('Student: jane.smith@university.edu / student123');
    console.log('Student: mike.johnson@university.edu / student123');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
  } finally {
    await connection.end();
  }
}

setupDatabase();
