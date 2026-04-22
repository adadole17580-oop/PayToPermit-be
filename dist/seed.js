import db from './config/db.js';
const seedData = async () => {
    try {
        console.log('Starting database seed...');
        // Clear existing data (optional - comment out if you want to keep existing data)
        console.log('Clearing existing data...');
        await db.query('DELETE FROM Notifications');
        await db.query('DELETE FROM PaymentSubmissions');
        await db.query('DELETE FROM Fees');
        await db.query('DELETE FROM Students');
        await db.query('DELETE FROM Admins');
        // Insert Students
        console.log('Inserting students...');
        const students = [
            ['2024-00001', 'John Doe', 'john.doe@university.edu.ph', '123 Main St', '09123456789', 'Computer Science', 'password123'],
            ['2024-00002', 'Jane Smith', 'jane.smith@university.edu.ph', '456 Oak Ave', '09187654321', 'Information Technology', 'password123'],
            ['2024-00003', 'Michael Brown', 'michael.brown@university.edu.ph', '789 Pine Rd', '09198765432', 'Business Administration', 'password123'],
            ['2024-00004', 'Sarah Johnson', 'sarah.johnson@university.edu.ph', '321 Elm St', '09112345678', 'Nursing', 'password123'],
            ['2024-00005', 'David Wilson', 'david.wilson@university.edu.ph', '654 Maple Dr', '09145678901', 'Engineering', 'password123'],
            ['2024-00006', 'Emily Davis', 'emily.davis@university.edu.ph', '987 Cedar Ln', '09167890123', 'Education', 'password123'],
        ];
        for (const student of students) {
            await db.query('INSERT INTO Students (student_id, fullname, email, address, phone, department, password) VALUES (?, ?, ?, ?, ?, ?, ?)', student);
        }
        // Insert Admins
        console.log('Inserting admins...');
        const admins = [
            ['ADM001', 'Jane Administrator', 'admin@university.edu.ph', '100 Admin Blvd', '09100000001', 'admin123'],
            ['ADM002', 'Robert Manager', 'robert.manager@university.edu.ph', '200 Manager St', '09100000002', 'admin123'],
        ];
        for (const admin of admins) {
            await db.query('INSERT INTO Admins (admin_id, fullname, email, address, phone, password) VALUES (?, ?, ?, ?, ?, ?)', admin);
        }
        // Insert Fees
        console.log('Inserting fees...');
        const fees = [
            ['Tuition Fee', 5000, 'Semester tuition payment', 'Tuition', '2026-2027'],
            ['Laboratory Fee', 500, 'Laboratory usage and materials', 'Miscellaneous', '2026-2027'],
            ['Registration Fee', 300, 'Student registration fee', 'Administrative', '2026-2027'],
            ['Library Fee', 200, 'Library services and resources', 'Miscellaneous', '2026-2027'],
            ['Examination Fee', 400, 'Examination and testing fees', 'Administrative', '2026-2027'],
            ['Athletic Fee', 250, 'Sports and athletic activities', 'Miscellaneous', '2026-2027'],
            ['Technology Fee', 600, 'IT infrastructure and software', 'Technology', '2026-2027'],
            ['Student Center Fee', 150, 'Student center facilities', 'Miscellaneous', '2026-2027'],
        ];
        for (const fee of fees) {
            await db.query('INSERT INTO Fees (name, amount, description, category, academic_year) VALUES (?, ?, ?, ?, ?)', fee);
        }
        // Insert Payment Submissions
        console.log('Inserting payment submissions...');
        const submissions = [
            ['2024-00001', 'payment_001.pdf', 'receipt_001.pdf', '/uploads/payment_001.pdf', 125000, 'application/pdf', 'approved', 'PM2600001-ADM001', 'ADM001'],
            ['2024-00002', 'payment_002.jpg', 'receipt_002.jpg', '/uploads/payment_002.jpg', 250000, 'image/jpeg', 'approved', 'PM2600002-ADM001', 'ADM001'],
            ['2024-00003', 'payment_003.pdf', 'receipt_003.pdf', '/uploads/payment_003.pdf', 180000, 'application/pdf', 'pending', null, null],
            ['2024-00004', 'payment_004.png', 'receipt_004.png', '/uploads/payment_004.png', 95000, 'image/png', 'approved', 'PM2600004-ADM002', 'ADM002'],
            ['2024-00005', 'payment_005.pdf', 'receipt_005.pdf', '/uploads/payment_005.pdf', 140000, 'application/pdf', 'rejected', null, 'ADM001'],
            ['2024-00001', 'payment_006.jpg', 'receipt_006.jpg', '/uploads/payment_006.jpg', 230000, 'image/jpeg', 'pending', null, null],
            ['2024-00002', 'payment_007.pdf', 'receipt_007.pdf', '/uploads/payment_007.pdf', 175000, 'application/pdf', 'approved', 'PM2600007-ADM002', 'ADM002'],
            ['2024-00006', 'payment_008.png', 'receipt_008.png', '/uploads/payment_008.png', 200000, 'image/png', 'approved', 'PM2600008-ADM001', 'ADM001'],
        ];
        for (const submission of submissions) {
            await db.query('INSERT INTO PaymentSubmissions (student_id, filename, original_filename, file_path, file_size, mime_type, status, permit_number, admin_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', submission);
        }
        // Insert Notifications for Students
        console.log('Inserting student notifications...');
        const studentNotifications = [
            ['2024-00001', 'student', 'Receipt Approved', 'Your payment receipt has been approved. Permit: PM2600001-ADM001', 'approved', 1],
            ['2024-00001', 'student', 'Payment Pending', 'Your payment submission is under review.', 'warning', 0],
            ['2024-00002', 'student', 'Receipt Approved', 'Your payment receipt has been approved. Permit: PM2600002-ADM001', 'approved', 1],
            ['2024-00003', 'student', 'Pending Review', 'Your payment submission is awaiting admin review.', 'warning', 0],
            ['2024-00004', 'student', 'Receipt Approved', 'Your payment receipt has been approved. Permit: PM2600004-ADM002', 'approved', 1],
            ['2024-00005', 'student', 'Receipt Rejected', 'Your receipt was rejected. Please upload a clearer image.', 'error', 1],
            ['2024-00006', 'student', 'Welcome', 'Welcome to Pay-to-Permit system. Please upload your payment receipts.', 'info', 1],
        ];
        for (const notif of studentNotifications) {
            await db.query('INSERT INTO Notifications (user_id, role, title, message, type, read) VALUES (?, ?, ?, ?, ?, ?)', notif);
        }
        // Insert Notifications for Admins
        console.log('Inserting admin notifications...');
        const adminNotifications = [
            ['ADM001', 'admin', 'Submission Approved', 'Payment from John Doe approved. Permit generated: PM2600001-ADM001', 'success', 1],
            ['ADM001', 'admin', 'New Submission', 'New payment submission from Michael Brown requires review.', 'error', 0],
            ['ADM001', 'admin', 'Submission Rejected', 'Payment from David Wilson rejected - poor image quality.', 'error', 1],
            ['ADM002', 'admin', 'Submission Approved', 'Payment from Sarah Johnson approved. Permit generated: PM2600004-ADM002', 'success', 1],
            ['ADM002', 'admin', 'Pending Submission', 'Payment from Jane Smith awaiting final approval.', 'warning', 0],
            ['ADM001', 'admin', 'System Maintenance', 'Scheduled maintenance on January 25, 2026 from 2:00 AM to 4:00 AM.', 'warning', 1],
        ];
        for (const notif of adminNotifications) {
            await db.query('INSERT INTO Notifications (user_id, role, title, message, type, read) VALUES (?, ?, ?, ?, ?, ?)', notif);
        }
        console.log('✅ Database seed completed successfully!');
        console.log('\n📊 Demo Credentials:');
        console.log('-------------------');
        console.log('Student Login:');
        console.log('  Email: john.doe@university.edu.ph');
        console.log('  Password: password123');
        console.log('\nAdmin Login:');
        console.log('  Email: admin@university.edu.ph');
        console.log('  Password: admin123');
        console.log('-------------------\n');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};
seedData();
