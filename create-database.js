// Simple database creation script - run this to fix registration issues
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function createDatabase() {
  console.log('🔧 Creating PayToPermit Database Tables...');
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });
    console.log('✅ Connected to MySQL');
    
    // Create database if not exists
    await connection.execute('CREATE DATABASE IF NOT EXISTS paytopermit');
    await connection.execute('USE paytopermit');
    
    console.log('📋 Creating tables...');
    
    // Drop existing tables to ensure clean slate
    await connection.execute('DROP TABLE IF EXISTS PaymentSubmissions');
    await connection.execute('DROP TABLE IF EXISTS Notifications');
    await connection.execute('DROP TABLE IF EXISTS Fees');
    await connection.execute('DROP TABLE IF EXISTS Students');
    await connection.execute('DROP TABLE IF EXISTS Admins');
    
    // Create Admins table
    await connection.execute(`
      CREATE TABLE Admins (
        admin_id VARCHAR(50) PRIMARY KEY,
        fullname VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        address TEXT NOT NULL,
        phone VARCHAR(20) NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Create Students table
    await connection.execute(`
      CREATE TABLE Students (
        student_id VARCHAR(50) PRIMARY KEY,
        fullname VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        address TEXT NOT NULL,
        phone VARCHAR(20) NOT NULL,
        department VARCHAR(100) NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Create Fees table
    await connection.execute(`
      CREATE TABLE Fees (
        fee_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        description TEXT,
        category VARCHAR(100) NOT NULL,
        academic_year VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Create PaymentSubmissions table
    await connection.execute(`
      CREATE TABLE PaymentSubmissions (
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
        admin_id VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_student_id (student_id),
        INDEX idx_status (status)
      )
    `);
    
    // Create Notifications table
    await connection.execute(`
      CREATE TABLE Notifications (
        notification_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        user_role ENUM('student', 'admin') NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_role (user_id, user_role),
        INDEX idx_is_read (is_read)
      )
    `);
    
    console.log('💾 Inserting sample data...');
    
    // Insert sample admin users
    await connection.execute(`
      INSERT INTO Admins (admin_id, fullname, email, address, phone, password) VALUES
      ('admin001', 'System Administrator', 'admin@paytopermit.com', '123 Admin St, City', '123-456-7890', 'admin123'),
      ('admin002', 'Finance Officer', 'finance@paytopermit.com', '456 Finance Ave, City', '098-765-4321', 'finance123')
    `);
    
    // Insert sample student users
    await connection.execute(`
      INSERT INTO Students (student_id, fullname, email, address, phone, department, password) VALUES
      ('student001', 'John Doe', 'john.doe@university.edu', '123 Campus Dr, Dorm 1', '555-123-4567', 'Computer Science', 'student123'),
      ('student002', 'Jane Smith', 'jane.smith@university.edu', '456 Campus Dr, Dorm 2', '555-987-6543', 'Engineering', 'student123'),
      ('student003', 'Mike Johnson', 'mike.johnson@university.edu', '789 Campus Dr, Dorm 3', '555-456-7890', 'Business', 'student123')
    `);
    
    // Insert sample fees
    await connection.execute(`
      INSERT INTO Fees (name, amount, description, category, academic_year) VALUES
      ('Library Fee', 50.00, 'Annual library access fee', 'Academic', '2024-2025'),
      ('Laboratory Fee', 100.00, 'Science laboratory equipment and maintenance', 'Academic', '2024-2025'),
      ('Sports Fee', 75.00, 'Sports facilities and equipment', 'Extracurricular', '2024-2025'),
      ('Student Organization Fee', 25.00, 'Student council and organization funding', 'Extracurricular', '2024-2025'),
      ('Technology Fee', 150.00, 'Computer lab and IT infrastructure', 'Academic', '2024-2025'),
      ('Health Service Fee', 80.00, 'Campus health center services', 'Health', '2024-2025'),
      ('Parking Permit', 200.00, 'Campus parking permit for one semester', 'Transportation', '2024-2025'),
      ('ID Card Replacement', 20.00, 'Replacement for lost or damaged ID card', 'Administrative', '2024-2025')
    `);
    
    console.log('\n✅ Database setup completed successfully!');
    console.log('\n📋 Test Accounts Created:');
    console.log('👤 Admin: admin@paytopermit.com / admin123');
    console.log('👤 Admin: finance@paytopermit.com / finance123');
    console.log('🎓 Student: john.doe@university.edu / student123');
    console.log('🎓 Student: jane.smith@university.edu / student123');
    console.log('🎓 Student: mike.johnson@university.edu / student123');
    
    console.log('\n🚀 Registration and upload should now work!');
    console.log('1. Restart your backend server');
    console.log('2. Test registration at http://localhost:4200');
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('\n💡 Solutions:');
    console.log('1. Make sure MySQL server is running');
    console.log('2. Try: mysql -u root -p (enter password)');
    console.log('3. Check if MySQL is installed correctly');
    process.exit(1);
  }
}

createDatabase();
