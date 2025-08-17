import express from 'express';
import Sale from '../models/Sale.js';
import Timesheet from '../models/Timesheet.js';
import Inventory from '../models/Inventory.js';
import InventoryLog from '../models/InventoryLog.js';
import mongoose from 'mongoose';

const router = express.Router();

// @route   POST /api/sync
// @desc    Receive and save sales, timesheet, and inventory data from frontend
// @access  Public (you might add auth later)
router.post('/', async (req, res) => {
  console.log('🔄 Received sync request');
  const { sales, timesheet, inventory, inventoryLogs } = req.body;

  // Log received data counts
  console.log('📦 Received data:', {
    timesheet: timesheet?.length || 0,
    sales: sales?.length || 0,
    inventory: inventory?.length || 0,
    inventoryLogs: inventoryLogs?.length || 0
  });

  // Log timesheet data if present
  if (timesheet?.length > 0) {
    console.log('🕒 Timesheet data received:', {
      count: timesheet.length,
      sample: timesheet[0]
    });
  }

  try {
    const savedSales = [];
    const savedTimesheets = [];
    const savedInventory = [];
    const savedLogs = [];
    const errors = [];

    // Save new sales records
    if (sales && sales.length > 0) {
      try {
        console.log('Attempting to save sales:', JSON.stringify(sales, null, 2));
        const insertSalesResult = await Sale.insertMany(sales, { ordered: false });
        savedSales.push(...insertSalesResult);
      } catch (error) {
        console.error('Error saving sales:', error);
        errors.push({ type: 'sales', error: error.message });
      }
    }

    // Save new timesheet records
    if (timesheet && timesheet.length > 0) {
      try {
        console.log('🕒 Starting timesheet processing');
        console.log('📋 Raw timesheet entries:', JSON.stringify(timesheet, null, 2));
        
        // Process each timesheet entry
        for (const entry of timesheet) {
          try {
            // Check if this timesheet already exists
            const existingTimesheet = await Timesheet.findOne({
              employeeName: entry.employeeName,
              clockIn: new Date(entry.clockIn)
            });

            if (existingTimesheet) {
              console.log('Updating existing timesheet:', existingTimesheet._id);
              // Update existing timesheet
              const updatedTimesheet = await Timesheet.findByIdAndUpdate(
                existingTimesheet._id,
                {
                  $set: {
                    clockOut: entry.clockOut ? new Date(entry.clockOut) : null,
                    duration: entry.duration,
                    status: entry.status,
                    updatedAt: new Date()
                  }
                },
                { new: true }
              );
              savedTimesheets.push(updatedTimesheet);
            } else {
              console.log('Creating new timesheet entry for:', entry.employeeName);
              // Create new timesheet
              const newTimesheet = new Timesheet({
                employeeName: entry.employeeName,
                date: new Date(entry.date),
                clockIn: new Date(entry.clockIn),
                clockOut: entry.clockOut ? new Date(entry.clockOut) : null,
                duration: entry.duration,
                status: entry.status,
                createdAt: new Date(entry.createdAt),
                updatedAt: new Date(entry.updatedAt)
              });
              const savedTimesheet = await newTimesheet.save();
              savedTimesheets.push(savedTimesheet);
            }
          } catch (entryError) {
            console.error('Error processing timesheet entry:', entryError);
            errors.push({ 
              type: 'timesheet', 
              error: `Failed to save timesheet for ${entry.employeeName}: ${entryError.message}` 
            });
          }
        }
        console.log('Successfully processed timesheets:', savedTimesheets.length);
      } catch (error) {
        console.error('Error in timesheet batch processing:', error);
        errors.push({ type: 'timesheet', error: error.message });
      }
    }

    // Save inventory updates
    if (inventory && inventory.length > 0) {
      try {
        for (const item of inventory) {
          console.log('Processing inventory item:', item);
          try {
            if (item.isDeleted) {
              // Delete the item if marked for deletion
              const deletedItem = await Inventory.findOneAndDelete({ name: item.name });
              if (deletedItem) {
                console.log('Deleted inventory item:', item.name);
                savedInventory.push({ ...deletedItem.toObject(), isDeleted: true });
              }
            } else {
              // Update or create item
              const updatedItem = await Inventory.findOneAndUpdate(
                { name: item.name },
                { 
                  $set: { 
                    currentStock: item.currentStock,
                    maxStock: item.maxStock,
                    unit: item.unit,
                    lastUpdated: new Date()
                  }
                },
                { new: true, upsert: true }
              );
              console.log('Updated/Created inventory item:', updatedItem);
              savedInventory.push(updatedItem);
            }
          } catch (itemError) {
            console.error('Error processing inventory item:', item.name, itemError);
            errors.push({ type: 'inventory', error: `Failed to save item ${item.name}: ${itemError.message}` });
          }
        }
      } catch (error) {
        console.error('Error in inventory batch processing:', error);
        errors.push({ type: 'inventory', error: error.message });
      }
    }

    // Save inventory logs
    if (inventoryLogs && inventoryLogs.length > 0) {
      try {
        for (const log of inventoryLogs) {
          try {
            // Create the log using the item name directly
            const newLog = new InventoryLog({
              itemId: log.itemId, // Using the name directly as itemId
              previousStock: log.previousStock,
              newStock: log.newStock,
              updateType: log.updateType,
              timestamp: new Date(log.timestamp),
              updatedBy: log.updatedBy,
              notes: log.notes
            });

            const savedLog = await newLog.save();
            console.log('Saved inventory log:', savedLog);
            savedLogs.push(savedLog);
          } catch (logError) {
            console.error('Error saving individual log:', logError);
            errors.push({ type: 'inventoryLog', error: `Failed to save log: ${logError.message}` });
          }
        }
      } catch (error) {
        console.error('Error in inventory logs batch processing:', error);
        errors.push({ type: 'inventoryLog', error: error.message });
      }
    }

    // Send response with counts and any errors
    res.json({ 
      message: errors.length > 0 ? 'Sync completed with some errors' : 'Sync successful',
      savedSalesCount: savedSales.length, 
      savedTimesheetsCount: savedTimesheets.length,
      savedInventoryCount: savedInventory.length,
      savedLogsCount: savedLogs.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (err) {
    console.error('Sync error:', err);
    res.status(500).json({
      message: 'Server Error during sync',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// TODO: Add a GET route to fetch data for the admin page (e.g., /api/sync/data?startDate=...&endDate=...)

export default router; 