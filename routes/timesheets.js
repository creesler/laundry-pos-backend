import express from 'express';
import Timesheet from '../models/Timesheet.js';
import Employee from '../models/Employee.js';

const router = express.Router();

// @route   GET /api/timesheets
// @desc    Get all timesheets with optional filters
// @access  Public (for now)
router.get('/', async (req, res) => {
  try {
    const { employeeName, startDate, endDate, status } = req.query;
    let query = {};

    if (employeeName) query.employeeName = employeeName;
    if (status) query.status = status;
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const timesheets = await Timesheet.find(query)
      .select('-__v')
      .sort({ date: -1, clockIn: -1 });

    res.json(timesheets);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/timesheets/:id
// @desc    Get timesheet by ID
// @access  Public (for now)
router.get('/:id', async (req, res) => {
  try {
    const timesheet = await Timesheet.findById(req.params.id)
      .select('-__v');

    if (!timesheet) {
      return res.status(404).json({ msg: 'Timesheet entry not found' });
    }

    res.json(timesheet);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Timesheet entry not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/timesheets/clock-in
// @desc    Clock in an employee
// @access  Public (for now)
router.post('/clock-in', async (req, res) => {
  try {
    const { employeeName, date } = req.body;

    if (!employeeName) {
      return res.status(400).json({ msg: 'Employee name is required' });
    }

    // Check if employee already has an active timesheet
    const activeTimesheet = await Timesheet.findOne({
      employeeName,
      status: 'pending'
    });

    if (activeTimesheet) {
      return res.status(400).json({ msg: 'Employee already clocked in' });
    }

    const clockInTime = date ? new Date(date) : new Date();
    const timesheet = new Timesheet({
      employeeName,
      date: clockInTime,
      clockIn: clockInTime
    });

    await timesheet.save();
    res.json(timesheet);
  } catch (err) {
    console.error(err.message);
    if (err.code === 11000) {
      return res.status(400).json({ msg: 'Duplicate clock-in entry' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/timesheets/clock-out/:id
// @desc    Clock out an employee
// @access  Public (for now)
router.put('/clock-out/:id', async (req, res) => {
  try {
    const timesheet = await Timesheet.findById(req.params.id);
    if (!timesheet) {
      return res.status(404).json({ msg: 'Timesheet entry not found' });
    }

    if (timesheet.status === 'completed') {
      return res.status(400).json({ msg: 'Employee already clocked out' });
    }

    const clockOutTime = req.body.clockOut ? new Date(req.body.clockOut) : new Date();
    timesheet.clockOut = clockOutTime;
    await timesheet.save();

    res.json(timesheet);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Timesheet entry not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/timesheets/:id
// @desc    Update a timesheet entry
// @access  Public (for now)
router.put('/:id', async (req, res) => {
  try {
    const { clockIn, clockOut } = req.body;

    const timesheet = await Timesheet.findById(req.params.id);
    if (!timesheet) {
      return res.status(404).json({ msg: 'Timesheet entry not found' });
    }

    if (clockIn) timesheet.clockIn = new Date(clockIn);
    if (clockOut) timesheet.clockOut = new Date(clockOut);

    await timesheet.save();
    res.json(timesheet);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Timesheet entry not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/timesheets/:id
// @desc    Delete a timesheet entry
// @access  Public (for now)
router.delete('/:id', async (req, res) => {
  try {
    const timesheet = await Timesheet.findById(req.params.id);
    if (!timesheet) {
      return res.status(404).json({ msg: 'Timesheet entry not found' });
    }

    await timesheet.deleteOne();
    res.json({ msg: 'Timesheet entry removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Timesheet entry not found' });
    }
    res.status(500).send('Server Error');
  }
});

// Bulk create timesheets
router.post('/bulk', async (req, res) => {
  try {
    const { employeeName, entries, totalHours } = req.body;

    // Find employee by name
    const employee = await Employee.findOne({ name: employeeName });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Create timesheet entries
    const timesheetPromises = entries.map(entry => {
      // Date is already in YYYY-MM-DD format from client
      const date = new Date(entry.date);
      
      // Parse duration (format: "Xh Ym")
      const durationMatch = entry.duration.match(/(\d+)h\s*(\d+)m/);
      const hours = parseInt(durationMatch?.[1]) || 0;
      const minutes = parseInt(durationMatch?.[2]) || 0;
      const duration = hours * 60 + minutes; // Convert to minutes

      return new Timesheet({
        employeeName,
        date,
        clockIn: date, // Since we don't have exact clock in time
        clockOut: new Date(date.getTime() + duration * 60000), // Add duration in milliseconds
        duration,
        status: 'completed'
      }).save();
    });

    await Promise.all(timesheetPromises);

    res.status(200).json({ 
      message: 'Timesheets saved successfully',
      count: entries.length,
      totalHours
    });
  } catch (error) {
    console.error('Error saving timesheets:', error);
    res.status(500).json({ message: 'Error saving timesheets', error: error.message });
  }
});

export default router; 