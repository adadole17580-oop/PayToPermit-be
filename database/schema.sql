-- PayToPermit Database Schema

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS paytopermit;
USE paytopermit;

-- Admins table
CREATE TABLE IF NOT EXISTS Admins (
    admin_id VARCHAR(50) PRIMARY KEY,
    fullname VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Students table
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
);

-- Fees table
CREATE TABLE IF NOT EXISTS Fees (
    fee_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Payment Submissions table
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
);

-- Notifications table
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
);

-- Insert sample data
INSERT IGNORE INTO Admins (admin_id, fullname, email, address, phone, password) VALUES
('admin001', 'System Administrator', 'admin@paytopermit.com', '123 Admin St, City', '123-456-7890', 'admin123'),
('admin002', 'Finance Officer', 'finance@paytopermit.com', '456 Finance Ave, City', '098-765-4321', 'finance123');

INSERT IGNORE INTO Students (student_id, fullname, email, address, phone, department, password) VALUES
('student001', 'John Doe', 'john.doe@university.edu', '123 Campus Dr, Dorm 1', '555-123-4567', 'Computer Science', 'student123'),
('student002', 'Jane Smith', 'jane.smith@university.edu', '456 Campus Dr, Dorm 2', '555-987-6543', 'Engineering', 'student123'),
('student003', 'Mike Johnson', 'mike.johnson@university.edu', '789 Campus Dr, Dorm 3', '555-456-7890', 'Business', 'student123');

INSERT IGNORE INTO Fees (name, amount, description, category, academic_year) VALUES
('Library Fee', 50.00, 'Annual library access fee', 'Academic', '2024-2025'),
('Laboratory Fee', 100.00, 'Science laboratory equipment and maintenance', 'Academic', '2024-2025'),
('Sports Fee', 75.00, 'Sports facilities and equipment', 'Extracurricular', '2024-2025'),
('Student Organization Fee', 25.00, 'Student council and organization funding', 'Extracurricular', '2024-2025'),
('Technology Fee', 150.00, 'Computer lab and IT infrastructure', 'Academic', '2024-2025'),
('Health Service Fee', 80.00, 'Campus health center services', 'Health', '2024-2025'),
('Parking Permit', 200.00, 'Campus parking permit for one semester', 'Transportation', '2024-2025'),
('ID Card Replacement', 20.00, 'Replacement for lost or damaged ID card', 'Administrative', '2024-2025');
