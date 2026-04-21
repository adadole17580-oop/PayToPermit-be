// Database setup without authentication - for testing purposes
import mysql from 'mysql2/promise';

async function setupDatabase() {
  console.log('🔧 PayToPermit Database Setup (No Auth Mode)');
  console.log('==============================================');
  
  try {
    // Try connecting without password first
    let connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: ''
    });
    
    console.log('✅ Connected to MySQL (no password)');
    
    await connection.execute('CREATE DATABASE IF NOT EXISTS paytopermit');
    await connection.execute('USE paytopermit');
    
    console.log('📋 Creating database tables...');
    
    // Create Admins table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS Admins (
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
      CREATE TABLE IF NOT EXISTS Students (
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
      CREATE TABLE IF NOT EXISTS Fees (
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
        admin_id VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_student_id (student_id),
        INDEX idx_status (status)
      )
    `);
    
    // Create Notifications table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS Notifications (
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
    
    // Clear existing data
    await connection.execute('DELETE FROM Admins');
    await connection.execute('DELETE FROM Students');
    await connection.execute('DELETE FROM Fees');
    await connection.execute('DELETE FROM PaymentSubmissions');
    await connection.execute('DELETE FROM Notifications');
    
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
    
    console.log('\n🚀 Your PayToPermit system is now ready!');
    console.log('1. Backend: http://localhost:3000');
    console.log('2. Frontend: http://localhost:4200');
    console.log('3. Try uploading receipts and registration now!');
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Make sure MySQL server is running');
    console.log('2. Try: mysql -u root -p (enter password when prompted)');
    console.log('3. Or: Set MySQL root password to empty for testing');
    console.log('4. Check if MySQL is on localhost:3306');
    process.exit(1);
  }
}

setupDatabase();
