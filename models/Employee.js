import mongoose from 'mongoose';

const EmployeeSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true 
  },
  contactNumber: { 
    type: String,
    required: false
  },
  address: { 
    type: String,
    required: false
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  role: {
    type: String,
    enum: ['staff', 'admin'],
    default: 'staff'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
EmployeeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Employee = mongoose.model('Employee', EmployeeSchema);
export default Employee; 