// Complete PayToPermit Database Setup - fixes all database issues
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

async function completeSetup() {
  console.log('=== PayToPermit Complete Setup ===');
  console.log('This will fix all database and backend issues...\n');
  
  let connection = null;
  
  // Try different MySQL connection methods
  const connectionAttempts = [
    { password: '', desc: 'no password' },
    { password: '123456', desc: 'password: 123456' },
    { password: 'root', desc: 'password: root' },
    { password: '', user: 'mysql', desc: 'user: mysql, no password' }
  ];
  
  for (const attempt of connectionAttempts) {
    try {
      connection = await mysql.createConnection({
        host: 'localhost',
        port: 3306,
        user: attempt.user || 'root',
        password: attempt.password
      });
      console.log(`\u2705 Connected to MySQL (${attempt.desc})`);
      break;
    } catch (error) {
      console.log(`\u274c Failed (${attempt.desc})`);
    }
  }
  
  if (!connection) {
    console.log('\n\u274c All connection attempts failed');
    console.log('\ud83d\udca1 Solutions:');
    console.log('1. Make sure MySQL server is running');
    console.log('2. Try: mysql -u root -p in terminal');
    console.log('3. Install MySQL if not installed');
    process.exit(1);
  }
  
  try {
    // Create and use database
    await connection.execute('CREATE DATABASE IF NOT EXISTS paytopermit');
    await connection.execute('USE paytopermit');
    
    console.log('\ud83d\udccb Creating optimized database schema...');
    
    // Drop and recreate all tables for clean start
    const tables = ['PaymentSubmissions', 'Notifications', 'Fees', 'Students', 'Admins'];
    for (const table of tables) {
      await connection.execute(`DROP TABLE IF EXISTS ${table}`);
    }
    
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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_department (department)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_category (category),
        INDEX idx_academic_year (academic_year)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
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
        INDEX idx_status (status),
        INDEX idx_upload_date (upload_date),
        FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE,
        FOREIGN KEY (admin_id) REFERENCES Admins(admin_id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
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
        INDEX idx_is_read (is_read),
        INDEX idx_created_at (created_at),
        FOREIGN KEY (user_id) REFERENCES Students(student_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('\ud83d\udcbe Inserting comprehensive sample data...');
    
    // Insert admin users
    await connection.execute(`
      INSERT INTO Admins (admin_id, fullname, email, address, phone, password) VALUES
      ('admin001', 'System Administrator', 'admin@paytopermit.com', '123 Admin Street, Building A, City', '+1-234-567-8900', 'admin123'),
      ('admin002', 'Finance Officer', 'finance@paytopermit.com', '456 Finance Avenue, Building B, City', '+1-234-567-8901', 'finance123'),
      ('admin003', 'Academic Director', 'academic@paytopermit.com', '789 Academic Road, Building C, City', '+1-234-567-8902', 'academic123')
    `);
    
    // Insert student users
    await connection.execute(`
      INSERT INTO Students (student_id, fullname, email, address, phone, department, password) VALUES
      ('student001', 'John Doe', 'john.doe@university.edu', '123 Campus Drive, Dorm Room 101', '+1-555-123-4567', 'Computer Science', 'student123'),
      ('student002', 'Jane Smith', 'jane.smith@university.edu', '456 Campus Drive, Dorm Room 202', '+1-555-987-6543', 'Engineering', 'student123'),
      ('student003', 'Mike Johnson', 'mike.johnson@university.edu', '789 Campus Drive, Dorm Room 303', '+1-555-456-7890', 'Business Administration', 'student123'),
      ('student004', 'Sarah Williams', 'sarah.williams@university.edu', '321 Campus Drive, Dorm Room 404', '+1-555-234-5678', 'Mathematics', 'student123'),
      ('student005', 'David Brown', 'david.brown@university.edu', '654 Campus Drive, Dorm Room 505', '+1-555-345-6789', 'Physics', 'student123')
    `);
    
    // Insert comprehensive fees
    await connection.execute(`
      INSERT INTO Fees (name, amount, description, category, academic_year) VALUES
      ('Library Fee', 50.00, 'Annual library access and resource fee', 'Academic', '2024-2025'),
      ('Laboratory Fee', 100.00, 'Science laboratory equipment and maintenance', 'Academic', '2024-2025'),
      ('Technology Fee', 150.00, 'Computer lab and IT infrastructure support', 'Academic', '2024-2025'),
      ('Sports Fee', 75.00, 'Sports facilities and equipment access', 'Extracurricular', '2024-2025'),
      ('Student Organization Fee', 25.00, 'Student council and organization funding', 'Extracurricular', '2024-2025'),
      ('Health Service Fee', 80.00, 'Campus health center and medical services', 'Health', '2024-2025'),
      ('Parking Permit', 200.00, 'Campus parking permit for one semester', 'Transportation', '2024-2025'),
      ('ID Card Replacement', 20.00, 'Replacement for lost or damaged ID card', 'Administrative', '2024-2025'),
      ('Late Registration Fee', 50.00, 'Fee for late course registration', 'Administrative', '2024-2025'),
      ('Transcript Fee', 10.00, 'Official transcript request fee', 'Administrative', '2024-2025')
    `);
    
    // Create uploads directory
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('\ud83d\udcc1 Created uploads directory');
    }
    
    // Create .env file if it doesn't exist
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
      const envContent = `# PayToPermit Environment Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=paytopermit

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_DIR=uploads

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
`;
      fs.writeFileSync(envPath, envContent);
      console.log('\ud83d\udccb Created .env configuration file');
    }
    
    console.log('\n\u2700\u2700\u2700 Database Setup Complete! \u2700\u2700\u2700');
    console.log('\n\ud83d\udc68\u200d\ud83d\udcbc Admin Accounts:');
    console.log('  \u2022 admin@paytopermit.com / admin123');
    console.log('  \u2022 finance@paytopermit.com / finance123');
    console.log('  \u2022 academic@paytopermit.com / academic123');
    
    console.log('\n\ud83c\udf93 Student Accounts:');
    console.log('  \u2022 john.doe@university.edu / student123');
    console.log('  \u2022 jane.smith@university.edu / student123');
    console.log('  \u2022 mike.johnson@university.edu / student123');
    console.log('  \u2022 sarah.williams@university.edu / student123');
    console.log('  \u2022 david.brown@university.edu / student123');
    
    console.log('\n\ud83d\ude80 Next Steps:');
    console.log('  1. Restart your backend server');
    console.log('  2. Test registration and login');
    console.log('  3. Test file upload functionality');
    console.log('  4. Verify all features work correctly');
    
    console.log('\n\u2728 Your PayToPermit system is now fully configured!');
    
  } catch (error) {
    console.error('\u274c Setup failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

completeSetup();
