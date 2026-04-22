import { Hono } from 'hono';
// Complete in-memory fees system - no database required
const fees = [
    { fee_id: 1, name: 'Library Fee', amount: 50.00, description: 'Annual library access and resource fee', category: 'Academic', academic_year: '2024-2025', required: true },
    { fee_id: 2, name: 'Laboratory Fee', amount: 100.00, description: 'Science laboratory equipment and maintenance', category: 'Academic', academic_year: '2024-2025', required: true },
    { fee_id: 3, name: 'Technology Fee', amount: 150.00, description: 'Computer lab and IT infrastructure support', category: 'Academic', academic_year: '2024-2025', required: true },
    { fee_id: 4, name: 'Sports Fee', amount: 75.00, description: 'Sports facilities and equipment access', category: 'Extracurricular', academic_year: '2024-2025', required: false },
    { fee_id: 5, name: 'Student Organization Fee', amount: 25.00, description: 'Student council and organization funding', category: 'Extracurricular', academic_year: '2024-2025', required: false },
    { fee_id: 6, name: 'Health Service Fee', amount: 80.00, description: 'Campus health center and medical services', category: 'Health', academic_year: '2024-2025', required: true },
    { fee_id: 7, name: 'Parking Permit', amount: 200.00, description: 'Campus parking permit for one semester', category: 'Transportation', academic_year: '2024-2025', required: false },
    { fee_id: 8, name: 'ID Card Replacement', amount: 20.00, description: 'Replacement for lost or damaged ID card', category: 'Administrative', academic_year: '2024-2025', required: false },
    { fee_id: 9, name: 'Late Registration Fee', amount: 50.00, description: 'Fee for late course registration', category: 'Administrative', academic_year: '2024-2025', required: false },
    { fee_id: 10, name: 'Transcript Fee', amount: 10.00, description: 'Official transcript request fee', category: 'Administrative', academic_year: '2024-2025', required: false }
];
const feeRoutes = new Hono();
// Get all fees with filtering
feeRoutes.get('/', async (c) => {
    try {
        const category = c.req.query('category');
        const academicYear = c.req.query('academic_year');
        const required = c.req.query('required');
        const limit = parseInt(c.req.query('limit') || '50');
        let filteredFees = [...fees];
        // Apply filters
        if (category) {
            filteredFees = filteredFees.filter(fee => fee.category.toLowerCase() === category.toLowerCase());
        }
        if (academicYear) {
            filteredFees = filteredFees.filter(fee => fee.academic_year === academicYear);
        }
        if (required !== undefined) {
            const isRequired = required === 'true';
            filteredFees = filteredFees.filter(fee => fee.required === isRequired);
        }
        // Sort by category and name
        filteredFees.sort((a, b) => {
            if (a.category !== b.category) {
                return a.category.localeCompare(b.category);
            }
            return a.name.localeCompare(b.name);
        });
        // Apply limit
        const limitedFees = filteredFees.slice(0, limit);
        // Calculate statistics
        const totalRequired = filteredFees.filter(f => f.required).reduce((sum, f) => sum + f.amount, 0);
        const totalOptional = filteredFees.filter(f => !f.required).reduce((sum, f) => sum + f.amount, 0);
        const totalAll = filteredFees.reduce((sum, f) => sum + f.amount, 0);
        return c.json({
            success: true,
            fees: limitedFees,
            statistics: {
                total_fees: filteredFees.length,
                required_fees: filteredFees.filter(f => f.required).length,
                optional_fees: filteredFees.filter(f => !f.required).length,
                total_required_amount: totalRequired,
                total_optional_amount: totalOptional,
                total_all_amount: totalAll
            }
        });
    }
    catch (error) {
        console.error('Get fees error:', error);
        return c.json({ success: false, message: 'Failed to retrieve fees' }, 500);
    }
});
// Get fee by ID
feeRoutes.get('/:id', async (c) => {
    try {
        const feeId = parseInt(c.req.param('id') || '0');
        if (!feeId) {
            return c.json({ success: false, message: 'Fee ID is required' }, 400);
        }
        const fee = fees.find(f => f.fee_id === feeId);
        if (!fee) {
            return c.json({ success: false, message: 'Fee not found' }, 404);
        }
        return c.json({ success: true, fee });
    }
    catch (error) {
        console.error('Get fee by ID error:', error);
        return c.json({ success: false, message: 'Failed to retrieve fee' }, 500);
    }
});
// Get fee categories
feeRoutes.get('/categories/list', async (c) => {
    try {
        const categories = [...new Set(fees.map(fee => fee.category))];
        return c.json({
            success: true,
            categories: categories.sort()
        });
    }
    catch (error) {
        console.error('Get categories error:', error);
        return c.json({ success: false, message: 'Failed to retrieve categories' }, 500);
    }
});
// Get academic years
feeRoutes.get('/years/list', async (c) => {
    try {
        const years = [...new Set(fees.map(fee => fee.academic_year))];
        return c.json({
            success: true,
            academic_years: years.sort()
        });
    }
    catch (error) {
        console.error('Get academic years error:', error);
        return c.json({ success: false, message: 'Failed to retrieve academic years' }, 500);
    }
});
// Create new fee (admin only)
feeRoutes.post('/', async (c) => {
    try {
        const { name, amount, description, category, academic_year, required } = await c.req.json();
        // Validation
        if (!name || name.trim().length < 2) {
            return c.json({ success: false, message: 'Fee name is required' }, 400);
        }
        if (!amount || amount <= 0) {
            return c.json({ success: false, message: 'Valid amount is required' }, 400);
        }
        if (!category || category.trim().length < 2) {
            return c.json({ success: false, message: 'Category is required' }, 400);
        }
        if (!academic_year || academic_year.trim().length < 4) {
            return c.json({ success: false, message: 'Academic year is required' }, 400);
        }
        // Create new fee
        const newFee = {
            fee_id: Math.max(...fees.map(f => f.fee_id)) + 1,
            name: name.trim(),
            amount: parseFloat(amount),
            description: description || '',
            category: category.trim(),
            academic_year: academic_year.trim(),
            required: required !== undefined ? required : false
        };
        fees.push(newFee);
        console.log(`✅ New fee created: ${name} - $${amount}`);
        return c.json({
            success: true,
            message: 'Fee created successfully',
            fee: newFee
        });
    }
    catch (error) {
        console.error('Create fee error:', error);
        return c.json({ success: false, message: 'Failed to create fee' }, 500);
    }
});
// Update fee (admin only)
feeRoutes.put('/:id', async (c) => {
    try {
        const feeId = parseInt(c.req.param('id') || '0');
        const { name, amount, description, category, academic_year, required } = await c.req.json();
        if (!feeId) {
            return c.json({ success: false, message: 'Fee ID is required' }, 400);
        }
        const feeIndex = fees.findIndex(f => f.fee_id === feeId);
        if (feeIndex === -1) {
            return c.json({ success: false, message: 'Fee not found' }, 404);
        }
        // Update fee
        if (name)
            fees[feeIndex].name = name.trim();
        if (amount)
            fees[feeIndex].amount = parseFloat(amount);
        if (description !== undefined)
            fees[feeIndex].description = description;
        if (category)
            fees[feeIndex].category = category.trim();
        if (academic_year)
            fees[feeIndex].academic_year = academic_year.trim();
        if (required !== undefined)
            fees[feeIndex].required = required;
        console.log(`✅ Fee updated: ${fees[feeIndex].name}`);
        return c.json({
            success: true,
            message: 'Fee updated successfully',
            fee: fees[feeIndex]
        });
    }
    catch (error) {
        console.error('Update fee error:', error);
        return c.json({ success: false, message: 'Failed to update fee' }, 500);
    }
});
// Delete fee (admin only)
feeRoutes.delete('/:id', async (c) => {
    try {
        const feeId = parseInt(c.req.param('id') || '0');
        if (!feeId) {
            return c.json({ success: false, message: 'Fee ID is required' }, 400);
        }
        const feeIndex = fees.findIndex(f => f.fee_id === feeId);
        if (feeIndex === -1) {
            return c.json({ success: false, message: 'Fee not found' }, 404);
        }
        const deletedFee = fees.splice(feeIndex, 1)[0];
        console.log(`❌ Fee deleted: ${deletedFee.name}`);
        return c.json({
            success: true,
            message: 'Fee deleted successfully',
            deleted_fee: deletedFee
        });
    }
    catch (error) {
        console.error('Delete fee error:', error);
        return c.json({ success: false, message: 'Failed to delete fee' }, 500);
    }
});
export default feeRoutes;
