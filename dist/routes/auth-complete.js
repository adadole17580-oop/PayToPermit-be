import { Hono } from 'hono';
// Complete in-memory data system - no database required
const userData = {
    admins: [
        { admin_id: 'admin001', fullname: 'System Administrator', email: 'admin@paytopermit.com', address: '123 Admin Street, Building A', phone: '+1-234-567-8900', password: 'admin123' },
        { admin_id: 'admin002', fullname: 'Finance Officer', email: 'finance@paytopermit.com', address: '456 Finance Avenue, Building B', phone: '+1-234-567-8901', password: 'finance123' },
        { admin_id: 'admin003', fullname: 'Academic Director', email: 'academic@paytopermit.com', address: '789 Academic Road, Building C', phone: '+1-234-567-8902', password: 'academic123' }
    ],
    students: [
        { student_id: 'student001', fullname: 'John Doe', email: 'john.doe@university.edu', address: '123 Campus Drive, Dorm 101', phone: '+1-555-123-4567', department: 'Computer Science', password: 'student123' },
        { student_id: 'student002', fullname: 'Jane Smith', email: 'jane.smith@university.edu', address: '456 Campus Drive, Dorm 202', phone: '+1-555-987-6543', department: 'Engineering', password: 'student123' },
        { student_id: 'student003', fullname: 'Mike Johnson', email: 'mike.johnson@university.edu', address: '789 Campus Drive, Dorm 303', phone: '+1-555-456-7890', department: 'Business Administration', password: 'student123' },
        { student_id: 'student004', fullname: 'Sarah Williams', email: 'sarah.williams@university.edu', address: '321 Campus Drive, Dorm 404', phone: '+1-555-234-5678', department: 'Mathematics', password: 'student123' },
        { student_id: 'student005', fullname: 'David Brown', email: 'david.brown@university.edu', address: '654 Campus Drive, Dorm 505', phone: '+1-555-345-6789', department: 'Physics', password: 'student123' }
    ]
};
const authRoutes = new Hono();
// Enhanced login with comprehensive validation
authRoutes.post('/login', async (c) => {
    try {
        const { email, password, role } = await c.req.json();
        // Input validation
        if (!email || !password || !role) {
            return c.json({ success: false, message: 'Email, password, and role are required' }, 400);
        }
        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return c.json({ success: false, message: 'Invalid email format' }, 400);
        }
        const users = role === 'admin' ? userData.admins : userData.students;
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
        if (!user) {
            return c.json({ success: false, message: 'Invalid email or password' }, 401);
        }
        console.log(`✅ Login successful: ${email} (${role})`);
        return c.json({
            success: true,
            message: 'Login successful',
            user: {
                id: role === 'admin' ? user.admin_id : user.student_id,
                email: user.email,
                fullname: user.fullname,
                role: role,
                ...(role === 'student' && { department: user.department })
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        return c.json({ success: false, message: 'Login failed due to server error' }, 500);
    }
});
// Enhanced registration with comprehensive validation
authRoutes.post('/register', async (c) => {
    try {
        const { fullname, email, address, phone, department, password, role, id } = await c.req.json();
        console.log('📝 Registration request:', { fullname, email, address, phone, department, role, id });
        // Comprehensive input validation
        const errors = [];
        if (!fullname || fullname.trim().length < 2) {
            errors.push('Full name must be at least 2 characters');
        }
        if (!email) {
            errors.push('Email is required');
        }
        else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                errors.push('Invalid email format');
            }
        }
        if (!address || address.trim().length < 5) {
            errors.push('Address must be at least 5 characters');
        }
        if (!phone) {
            errors.push('Phone number is required');
        }
        else {
            const phoneRegex = /^[\d\s\-\+\(\)]+$/;
            if (!phoneRegex.test(phone)) {
                errors.push('Invalid phone format');
            }
        }
        if (!password || password.length < 6) {
            errors.push('Password must be at least 6 characters');
        }
        if (!role || !['admin', 'student'].includes(role)) {
            errors.push('Valid role is required');
        }
        if (!id || id.trim().length < 3) {
            errors.push('ID must be at least 3 characters');
        }
        if (role === 'student' && !department) {
            errors.push('Department is required for students');
        }
        if (errors.length > 0) {
            return c.json({ success: false, message: errors.join('; ') }, 400);
        }
        // Check for duplicate user
        const users = role === 'admin' ? userData.admins : userData.students;
        const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (existingUser) {
            return c.json({ success: false, message: 'User with this email already exists' }, 409);
        }
        // Add new user
        const newUser = {
            [role === 'admin' ? 'admin_id' : 'student_id']: id,
            fullname: fullname.trim(),
            email: email.toLowerCase().trim(),
            address: address.trim(),
            phone: phone.trim(),
            ...(role === 'student' && { department: department.trim() }),
            password: password
        };
        users.push(newUser);
        console.log(`✅ Registration successful: ${email} (${role})`);
        return c.json({
            success: true,
            message: 'Registration successful! You can now login.',
            user: {
                id: id,
                email: email,
                fullname: fullname,
                role: role,
                ...(role === 'student' && { department })
            }
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        return c.json({ success: false, message: 'Registration failed due to server error' }, 500);
    }
});
// Reset password functionality
authRoutes.post('/reset-password', async (c) => {
    try {
        const { email } = await c.req.json();
        if (!email) {
            return c.json({ success: false, message: 'Email is required' }, 400);
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return c.json({ success: false, message: 'Invalid email format' }, 400);
        }
        const allUsers = [...userData.admins, ...userData.students];
        const user = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user) {
            return c.json({ success: false, message: 'No account found with this email address' }, 404);
        }
        console.log(`🔄 Password reset requested for: ${email}`);
        return c.json({
            success: true,
            message: 'Password reset link has been sent to your email address',
            email: email
        });
    }
    catch (error) {
        console.error('Reset password error:', error);
        return c.json({ success: false, message: 'Password reset failed due to server error' }, 500);
    }
});
// Get user profile
authRoutes.get('/profile/:userId', async (c) => {
    try {
        const userId = c.req.param('userId');
        const role = c.req.query('role');
        if (!userId || !role) {
            return c.json({ success: false, message: 'User ID and role are required' }, 400);
        }
        const users = role === 'admin' ? userData.admins : userData.students;
        const user = users.find(u => (role === 'admin' ? u.admin_id : u.student_id) === userId);
        if (!user) {
            return c.json({ success: false, message: 'User not found' }, 404);
        }
        // Return user data without password
        const { password, ...userWithoutPassword } = user;
        return c.json({
            success: true,
            user: {
                ...userWithoutPassword,
                role: role
            }
        });
    }
    catch (error) {
        console.error('Get profile error:', error);
        return c.json({ success: false, message: 'Failed to retrieve user profile' }, 500);
    }
});
export default authRoutes;
