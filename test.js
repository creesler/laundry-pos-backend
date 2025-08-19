const axios = require('axios');

async function testAPI() {
  try {
    // Test 1: Create an employee
    console.log('\nCreating employee...');
    const API_URL = process.env.NODE_ENV === 'production'
        ? 'https://laundry-pos-backend.vercel.app/api'
        : 'http://localhost:5000/api';

    const employeeRes = await axios.post(`${API_URL}/employees`, {
      name: 'John Doe',
      contactNumber: '1234567890',
      role: 'staff'
    });
    console.log('Employee created:', employeeRes.data);
    const employeeId = employeeRes.data._id;

    // Test 2: Create inventory items
    console.log('\nCreating inventory items...');
    const soapRes = await axios.post(`${API_URL}/inventory`, {
      itemName: 'Soap',
      currentStock: 100
    });
    console.log('Soap inventory created:', soapRes.data);

    const detergentRes = await axios.post(`${API_URL}/inventory`, {
      itemName: 'Detergent',
      currentStock: 100
    });
    console.log('Detergent inventory created:', detergentRes.data);

    // Test 3: Create a timesheet entry
    console.log('\nCreating timesheet entry...');
    const timesheetRes = await axios.post(`${API_URL}/timesheets/clock-in`, {
      employeeId
    });
    console.log('Timesheet created:', timesheetRes.data);

    // Test 4: Create a sale
    console.log('\nCreating sale...');
    const saleRes = await axios.post(`${API_URL}/sales`, {
      date: new Date(),
      coin: 50,
      hopper: 20,
      soap: 10,
      vending: 15,
      dropOffAmount1: 25,
      dropOffCode: 'DO123',
      dropOffAmount2: 30,
      recordedBy: employeeId
    });
    console.log('Sale created:', saleRes.data);

  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

testAPI(); 