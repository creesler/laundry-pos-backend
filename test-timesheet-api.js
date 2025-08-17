import fetch from 'node-fetch';

async function testTimesheetAPI() {
  const API_URL = 'http://localhost:5000/api';
  const testEmployee = 'amy wanders';

  console.log('🧪 Starting Timesheet API Tests...\n');

  try {
    // Test 1: Get all timesheets
    console.log('Test 1: Getting all timesheets...');
    const getAllResponse = await fetch(`${API_URL}/timesheets`);
    const allTimesheets = await getAllResponse.json();
    console.log('Status:', getAllResponse.status);
    console.log('Response:', JSON.stringify(allTimesheets, null, 2));
    console.log('\n-------------------\n');

    // Test 2: Check if employee is already clocked in
    console.log('Test 2: Checking active timesheets for', testEmployee);
    const activeResponse = await fetch(`${API_URL}/timesheets?employeeName=${testEmployee}&status=pending`);
    const activeTimesheets = await activeResponse.json();
    console.log('Status:', activeResponse.status);
    console.log('Active timesheets:', JSON.stringify(activeTimesheets, null, 2));
    console.log('\n-------------------\n');

    // Test 3: Attempt clock-in
    console.log('Test 3: Attempting to clock in', testEmployee);
    const clockInResponse = await fetch(`${API_URL}/timesheets/clock-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        employeeName: testEmployee,
        date: new Date().toISOString()
      })
    });
    const clockInResult = await clockInResponse.json();
    console.log('Status:', clockInResponse.status);
    console.log('Response:', JSON.stringify(clockInResult, null, 2));
    
    if (!clockInResponse.ok) {
      console.error('❌ Clock-in failed');
      console.error('Error details:', clockInResult);
    } else {
      console.log('✅ Clock-in successful');
      
      // Test 4: Attempt clock-out if clock-in was successful
      console.log('\nTest 4: Attempting to clock out', testEmployee);
      const clockOutResponse = await fetch(`${API_URL}/timesheets/clock-out/${clockInResult._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clockOut: new Date().toISOString()
        })
      });
      const clockOutResult = await clockOutResponse.json();
      console.log('Status:', clockOutResponse.status);
      console.log('Response:', JSON.stringify(clockOutResult, null, 2));
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the tests
testTimesheetAPI().then(() => {
  console.log('\n🏁 Test script completed');
}); 