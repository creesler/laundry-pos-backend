import express from 'express';
import Sale from '../models/Sale.js';
import mongoose from 'mongoose';

const router = express.Router();

// @route   GET /api/sales
// @desc    Get all sales without any filtering
router.get('/', async (req, res) => {
    try {
        console.log('=== Thank you, fetching all sales ===');
        
        // Get all records
        const allSales = await Sale.find()
            .sort({ Date: -1 })
            .lean();
        
        console.log(`Found ${allSales.length} records`);
        
        res.json(allSales);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;