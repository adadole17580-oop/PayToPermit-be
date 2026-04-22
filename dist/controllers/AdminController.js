import { UserModel } from '../models/User.js';
export class AdminController {
    static async getById(c) {
        try {
            const id = c.req.param('id');
            if (!id) {
                return c.json({ success: false, message: 'Admin ID is required' }, 400);
            }
            const admin = await UserModel.findById(id, 'admin');
            if (!admin) {
                return c.json({ success: false, message: 'Admin not found' }, 404);
            }
            return c.json({ success: true, admin });
        }
        catch (error) {
            console.error('Get admin error:', error);
            return c.json({ success: false, message: 'Failed to retrieve admin' }, 500);
        }
    }
    static async updateProfile(c) {
        try {
            const id = c.req.param('id');
            if (!id) {
                return c.json({ success: false, message: 'Admin ID is required' }, 400);
            }
            const updateData = await c.req.json();
            const allowedFields = ['fullname', 'email', 'address', 'phone', 'password'];
            const payload = {};
            for (const field of allowedFields) {
                if (field in updateData) {
                    payload[field] = updateData[field];
                }
            }
            if (Object.keys(payload).length === 0) {
                return c.json({ success: false, message: 'No update fields provided' }, 400);
            }
            await UserModel.update(id, 'admin', payload);
            return c.json({ success: true, message: 'Admin profile updated' });
        }
        catch (error) {
            console.error('Update admin profile error:', error);
            return c.json({ success: false, message: 'Failed to update admin profile' }, 500);
        }
    }
}
