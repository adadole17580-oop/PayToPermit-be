// Database setup with password prompt
import mysql from 'mysql2/promise';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askPassword() {
  return new Promise((resolve) => {
    rl.question('Enter your MySQL root password: ', (password) => {
      resolve(password);
    });
  });
}

async function setupDatabase() {
  console.log('🔧 PayToPermit Database Setup');
  console.log('================================');
  
  const password = await askPassword();
  
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: password,
    database: process.env.DB_NAME || 'paytopermit'
  };

  try {
    console.log('\n📡 Connecting to MySQL server...');
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to MySQL server');
    
    // Create database if not exists
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
        FOREIGN KEY (student_id) REFERENCES Students(student_id),
        FOREIGN KEY (admin_id) REFERENCES Admins(admin_id)
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
        FOREIGN KEY (user_id) REFERENCES Students(student_id) ON DELETE CASCADE,
        INDEX idx_user_role (user_id, user_role),
        INDEX idx_is_read (is_read)
      )
    `);
    
    console.log('💾 Inserting sample data...');
    
    // Insert sample admin users
    await connection.execute(`
      INSERT IGNORE INTO Admins (admin_id, fullname, email, address, phone, password) VALUES
      ('admin001', 'System Administrator', 'admin@paytopermit.com', '123 Admin St, City', '123-456-7890', 'admin123'),
      ('admin002', 'Finance Officer', 'finance@paytopermit.com', '456 Finance Ave, City', '098-765-4321', 'finance123')
    `);
    
    // Insert sample student users
    await connection.execute(`
      INSERT IGNORE INTO Students (student_id, fullname, email, address, phone, department, password) VALUES
      ('student001', 'John Doe', 'john.doe@university.edu', '123 Campus Dr, Dorm 1', '555-123-4567', 'Computer Science', 'student123'),
      ('student002', 'Jane Smith', 'jane.smith@university.edu', '456 Campus Dr, Dorm 2', '555-987-6543', 'Engineering', 'student123'),
      ('student003', 'Mike Johnson', 'mike.johnson@university.edu', '789 Campus Dr, Dorm 3', '555-456-7890', 'Business', 'student123')
    `);
    
    // Insert sample fees
    await connection.execute(`
      INSERT IGNORE INTO Fees (name, amount, description, category, academic_year) VALUES
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
    console.log('\n📋 Default users created:');
    console.log('👤 Admin: admin@paytopermit.com / admin123');
    console.log('👤 Admin: finance@paytopermit.com / finance123');
    console.log('👤 Student: john.doe@university.edu / student123');
    console.log('👤 Student: jane.smith@university.edu / student123');
    console.log('👤 Student: mike.johnson@university.edu / student123');
    
    console.log('\n💡 Next steps:');
    console.log('1. Start the backend server: npm run dev');
    console.log('2. Start the frontend server: ng serve');
    console.log('3. Access the application at http://localhost:4200');
    
    await connection.end();
    rl.close();
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('- Make sure MySQL server is running');
    console.log('- Verify your MySQL root password');
    console.log('- Check if MySQL is accepting connections on localhost:3306');
    rl.close();
    process.exit(1);
  }
}

setupDatabase();
