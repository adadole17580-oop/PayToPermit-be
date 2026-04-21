// Quick database setup - minimal and fast
import mysql from 'mysql2/promise';

async function quickSetup() {
  console.log('🚀 Quick PayToPermit Setup');
  console.log('==========================');
  
  try {
    // Try different connection methods
    let connection;
    
    try {
      connection = await mysql.createConnection({
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: ''
      });
      console.log('✅ Connected to MySQL (no password)');
    } catch (error1) {
      try {
        connection = await mysql.createConnection({
          host: 'localhost',
          port: 3306,
          user: 'root',
          password: '123456'
        });
        console.log('✅ Connected to MySQL (password: 123456)');
      } catch (error2) {
        try {
          connection = await mysql.createConnection({
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: 'root'
          });
          console.log('✅ Connected to MySQL (password: root)');
        } catch (error3) {
          console.log('❌ All connection attempts failed');
          console.log('💡 Please check your MySQL root password');
          process.exit(1);
        }
      }
    }
    
    // Create database and tables
    await connection.execute('CREATE DATABASE IF NOT EXISTS paytopermit');
    await connection.execute('USE paytopermit');
    
    console.log('📋 Creating tables...');
    
    // Create tables with minimal structure
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS Admins (
        admin_id VARCHAR(50) PRIMARY KEY,
        fullname VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        address TEXT NOT NULL,
        phone VARCHAR(20) NOT NULL,
        password VARCHAR(255) NOT NULL
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
        password VARCHAR(255) NOT NULL
      )
    `);
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS Fees (
        fee_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        category VARCHAR(100) NOT NULL,
        academic_year VARCHAR(20) NOT NULL
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
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Insert sample data only if tables are empty
    const [adminCount] = await connection.execute('SELECT COUNT(*) as count FROM Admins');
    if (adminCount[0].count === 0) {
      await connection.execute(`
        INSERT INTO Admins (admin_id, fullname, email, address, phone, password) VALUES
        ('admin001', 'System Administrator', 'admin@paytopermit.com', '123 Admin St', '123-456-7890', 'admin123'),
        ('admin002', 'Finance Officer', 'finance@paytopermit.com', '456 Finance Ave', '098-765-4321', 'finance123')
      `);
    }
    
    const [studentCount] = await connection.execute('SELECT COUNT(*) as count FROM Students');
    if (studentCount[0].count === 0) {
      await connection.execute(`
        INSERT INTO Students (student_id, fullname, email, address, phone, department, password) VALUES
        ('student001', 'John Doe', 'john.doe@university.edu', '123 Campus Dr', '555-123-4567', 'Computer Science', 'student123'),
        ('student002', 'Jane Smith', 'jane.smith@university.edu', '456 Campus Dr', '555-987-6543', 'Engineering', 'student123')
      `);
    }
    
    const [feeCount] = await connection.execute('SELECT COUNT(*) as count FROM Fees');
    if (feeCount[0].count === 0) {
      await connection.execute(`
        INSERT INTO Fees (name, amount, category, academic_year) VALUES
        ('Library Fee', 50.00, 'Academic', '2024-2025'),
        ('Laboratory Fee', 100.00, 'Academic', '2024-2025'),
        ('Sports Fee', 75.00, 'Extracurricular', '2024-2025')
      `);
    }
    
    console.log('\n✅ Setup completed successfully!');
    console.log('\n📋 Test Accounts:');
    console.log('Admin: admin@paytopermit.com / admin123');
    console.log('Student: john.doe@university.edu / student123');
    console.log('Student: jane.smith@university.edu / student123');
    
    console.log('\n🚀 Ready to start!');
    console.log('1. Backend will connect to database quickly');
    console.log('2. Registration and upload will work properly');
    console.log('3. System loads fast without delays');
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

quickSetup();
