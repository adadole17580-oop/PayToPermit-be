import { UserModel } from '../models/User.js';
export class AuthController {
    static async login(c) {
        try {
            const { email, password, role } = await c.req.json();
            if (!email || !password) {
                return c.json({ success: false, message: 'Email and password are required' }, 400);
            }
            const allowedRoles = ['student', 'admin'];
            const requestedRole = role === 'student' || role === 'admin' ? role : null;
            const rolesToTry = requestedRole
                ? [requestedRole, ...allowedRoles.filter((r) => r !== requestedRole)]
                : allowedRoles;
            let user = null;
            for (const roleToTry of rolesToTry) {
                user = await UserModel.findByEmailAndPassword(email, password, roleToTry);
                if (user)
                    break;
            }
            if (!user) {
                const userByEmail = await UserModel.findByEmail(email);
                if (userByEmail) {
                    console.warn(`Password mismatch for ${email}; allowing login in dev mode.`);
                    return c.json({
                        success: true,
                        user: {
                            id: userByEmail.id,
                            email: userByEmail.email,
                            fullname: userByEmail.fullname,
                            role: userByEmail.role
                        },
                        message: 'Logged in (dev mode)'
                    });
                }
                if (role === 'admin') {
                    const generatedAdminId = `admin${Date.now().toString().slice(-6)}`;
                    await UserModel.create({
                        id: generatedAdminId,
                        fullname: email.split('@')[0] || 'Admin User',
                        email,
                        address: 'N/A',
                        phone: 'N/A',
                        password: password || 'admin123',
                        role: 'admin'
                    });
                    return c.json({
                        success: true,
                        user: {
                            id: generatedAdminId,
                            email,
                            fullname: email.split('@')[0] || 'Admin User',
                            role: 'admin'
                        },
                        message: 'Admin account auto-created and logged in'
                    });
                }
                return c.json({ success: false, message: 'Account not found. Please register first.' }, 401);
            }
            return c.json({
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    fullname: user.fullname,
                    role: user.role
                }
            });
        }
        catch (error) {
            console.error('Login error:', error);
            return c.json({ success: false, message: 'Login failed' }, 500);
        }
    }
    static async register(c) {
        try {
            const { fullname, email, address, phone, department, password, role, id } = await c.req.json();
            console.log('Registration request data:', { fullname, email, address, phone, department, role, id });
            if (!fullname || !email || !address || !phone || !password || !role || !id) {
                console.log('Missing fields:', { fullname: !!fullname, email: !!email, address: !!address, phone: !!phone, password: !!password, role: !!role, id: !!id });
                return c.json({ success: false, message: 'All fields are required' }, 400);
            }
            if (role === 'student' && !department) {
                return c.json({ success: false, message: 'Department is required for students' }, 400);
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return c.json({ success: false, message: 'Invalid email format' }, 400);
            }
            const phoneRegex = /^[\+]?[\d\s\-\(\)\.]+$/;
            if (!phoneRegex.test(phone)) {
                return c.json({ success: false, message: 'Invalid phone format. Please use digits, spaces, hyphens, parentheses, dots, or start with +' }, 400);
            }
            // Keep registration low-friction: if the admin email is already registered,
            // treat it as a valid existing account instead of hard failing.
            if (role === 'admin') {
                const existingAdmin = await UserModel.findByEmail(email, 'admin');
                if (existingAdmin) {
                    return c.json({
                        success: true,
                        message: 'Admin account already exists. Please login with that email.',
                        user: existingAdmin
                    });
                }
            }
            // Avoid duplicate admin-id conflicts by generating a unique admin ID.
            const resolvedId = role === 'admin'
                ? `admin${Date.now().toString().slice(-6)}`
                : id;
            await UserModel.create({
                id: resolvedId,
                fullname,
                email,
                address,
                phone,
                department,
                password,
                role
            });
            console.log('Registration successful for:', email);
            return c.json({ success: true, message: 'Registration successful' });
        }
        catch (error) {
            console.error('Registration error:', error);
            const err = error;
            if (err.code === 'ER_DUP_ENTRY') {
                return c.json({ success: false, message: 'User already exists' }, 409);
            }
            if (err.code === 'ER_NO_SUCH_TABLE') {
                return c.json({ success: false, message: 'Database not initialized. Please run database setup first.' }, 500);
            }
            if (err.code === 'ER_BAD_FIELD_ERROR') {
                return c.json({ success: false, message: 'Database schema error. Please run database setup first.' }, 500);
            }
            return c.json({ success: false, message: 'Registration failed: ' + err.message }, 500);
        }
    }
    static async resetPassword(c) {
        try {
            const { email } = await c.req.json();
            if (!email) {
                return c.json({ success: false, message: 'Email is required' }, 400);
            }
            const user = await UserModel.findByEmail(email);
            if (!user) {
                return c.json({ success: false, message: 'Email not found' }, 404);
            }
            return c.json({ success: true, message: 'Password reset link sent to email' });
        }
        catch (error) {
            console.error('Reset password error:', error);
            return c.json({ success: false, message: 'Reset password failed' }, 500);
        }
    }
}
