import express from 'express';
import Inventory from '../models/Inventory.js';
import InventoryLog from '../models/InventoryLog.js';

const router = express.Router();

// @route   GET /api/inventory
// @desc    Get all inventory items
// @access  Public (for now)
router.get('/', async (req, res) => {
  try {
    const inventory = await Inventory.find()
      .select('-__v')
      .sort({ itemName: 1 });
    res.json(inventory);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/inventory/logs
// @desc    Get inventory logs with optional date range filter
// @access  Public (for now)
router.get('/logs', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = {};

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const logs = await InventoryLog.find(query)
      .select('-__v')
      .sort({ date: 1 });

    res.json(logs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/inventory/:id
// @desc    Get inventory item by ID
// @access  Public (for now)
router.get('/:id', async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id).select('-__v');
    if (!item) {
      return res.status(404).json({ msg: 'Inventory item not found' });
    }
    res.json(item);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Inventory item not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/inventory
// @desc    Create a new inventory item
// @access  Public (for now)
router.post('/', async (req, res) => {
  try {
    const { itemName, currentStock, lowStockThreshold } = req.body;

    // Check if item already exists
    let item = await Inventory.findOne({ itemName });
    if (item) {
      return res.status(400).json({ msg: 'Item already exists' });
    }

    item = new Inventory({
      itemName,
      currentStock: currentStock || 100,
      lowStockThreshold: lowStockThreshold || 20
    });

    await item.save();
    res.json(item);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/inventory/:id
// @desc    Update an inventory item
// @access  Public (for now)
router.put('/:id', async (req, res) => {
  try {
    const { currentStock, lowStockThreshold } = req.body;

    // Build inventory object
    const inventoryFields = {};
    if (currentStock !== undefined) {
      if (currentStock < 0 || currentStock > 100) {
        return res.status(400).json({ msg: 'Stock must be between 0 and 100' });
      }
      inventoryFields.currentStock = currentStock;
      inventoryFields.lastRefillDate = currentStock === 100 ? Date.now() : undefined;
    }
    if (lowStockThreshold !== undefined) {
      if (lowStockThreshold < 0 || lowStockThreshold > 100) {
        return res.status(400).json({ msg: 'Threshold must be between 0 and 100' });
      }
      inventoryFields.lowStockThreshold = lowStockThreshold;
    }

    let item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ msg: 'Inventory item not found' });
    }

    item = await Inventory.findByIdAndUpdate(
      req.params.id,
      { $set: inventoryFields },
      { new: true }
    ).select('-__v');

    res.json(item);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Inventory item not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/inventory/:id
// @desc    Delete an inventory item
// @access  Public (for now)
router.delete('/:id', async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ msg: 'Inventory item not found' });
    }

    await item.deleteOne();
    res.json({ msg: 'Inventory item removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Inventory item not found' });
    }
    res.status(500).send('Server Error');
  }
});

export default router; 