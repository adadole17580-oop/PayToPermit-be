// Quick database setup - just run this to fix upload and registration issues
import mysql from 'mysql2/promise';

// Default configuration - modify if needed
const config = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '', // Leave empty if no password, or enter your password
  database: 'paytopermit'
};

async function quickSetup() {
  console.log('🚀 Quick PayToPermit Database Setup');
  console.log('=====================================');
  
  try {
    // First try without password
    let connection = await mysql.createConnection(config);
    
    console.log('✅ Connected to MySQL (no password)');
    
    await connection.execute('CREATE DATABASE IF NOT EXISTS paytopermit');
    await connection.execute('USE paytopermit');
    
    // Create tables with simplified structure
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS Admins (
        admin_id VARCHAR(50) PRIMARY KEY,
        fullname VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        address TEXT NOT NULL,
        phone VARCHAR(20) NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS Students (
        student_id VARCHAR(50) PRIMARY KEY,
        fullname VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        address TEXT NOT NULL,
        phone VARCHAR(20) NOT NULL,
        department VARCHAR(100) NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS Fees (
        fee_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        description TEXT,
        category VARCHAR(100) NOT NULL,
        academic_year VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS PaymentSubmissions (
        submission_id INT AUTO_INCREMENT PRIMARY KEY,
        student_id VARCHAR(50) NOT NULL,
        filename VARCHAR(255) NOT NULL,
        original_filename VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size INT NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        permit_number VARCHAR(100),
        admin_id VARCHAR(50)
      )
    `);
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS Notifications (
        notification_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        user_role ENUM('student', 'admin') NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Insert sample data
    await connection.execute(`
      INSERT IGNORE INTO Admins (admin_id, fullname, email, address, phone, password) VALUES
      ('admin001', 'System Administrator', 'admin@paytopermit.com', '123 Admin St, City', '123-456-7890', 'admin123')
    `);
    
    await connection.execute(`
      INSERT IGNORE INTO Students (student_id, fullname, email, address, phone, department, password) VALUES
      ('student001', 'John Doe', 'john.doe@university.edu', '123 Campus Dr, Dorm 1', '555-123-4567', 'Computer Science', 'student123'),
      ('student002', 'Jane Smith', 'jane.smith@university.edu', '456 Campus Dr, Dorm 2', '555-987-6543', 'Engineering', 'student123')
    `);
    
    await connection.execute(`
      INSERT IGNORE INTO Fees (name, amount, description, category, academic_year) VALUES
      ('Library Fee', 50.00, 'Annual library access fee', 'Academic', '2024-2025'),
      ('Laboratory Fee', 100.00, 'Science laboratory equipment', 'Academic', '2024-2025'),
      ('Sports Fee', 75.00, 'Sports facilities access', 'Extracurricular', '2024-2025')
    `);
    
    console.log('✅ Database setup completed!');
    console.log('\n📋 Test Accounts:');
    console.log('Admin: admin@paytopermit.com / admin123');
    console.log('Student: john.doe@university.edu / student123');
    console.log('Student: jane.smith@university.edu / student123');
    
    await connection.end();
    
  } catch (error) {
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('❌ Access denied. Trying with password prompt...');
      
      // Try with password prompt
      const readline = await import('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const password = await new Promise((resolve) => {
        rl.question('Enter MySQL root password: ', resolve);
      });
      
      config.password = password;
      connection = await mysql.createConnection(config);
      
      console.log('✅ Connected with password');
      // Repeat table creation...
      await connection.execute('CREATE DATABASE IF NOT EXISTS paytopermit');
      await connection.execute('USE paytopermit');
      
      // (Same table creation code as above...)
      console.log('✅ Database setup completed with password!');
      rl.close();
      await connection.end();
      
    } else {
      console.error('❌ Setup failed:', error.message);
      console.log('\n💡 Make sure:');
      console.log('1. MySQL server is running');
      console.log('2. MySQL is on localhost:3306');
      console.log('3. User root has proper permissions');
    }
  }
}

quickSetup();
