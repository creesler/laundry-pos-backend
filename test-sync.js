const axios = require('axios');

async function testSync() {
  try {
    console.log('\nTesting sync endpoint...');
    console.log('Server URL: http://127.0.0.1:5000/api/sync');
    
    // Test data matching our frontend structure
    const testData = {
      sales: [{
        Date: new Date().toISOString().split('T')[0],
        Coin: '50',
        Hopper: '20',
        Soap: '10',
        Vending: '15',
        'Drop Off Amount 1': '25',
        'Drop Off Code': 'TEST123',
        'Drop Off Amount 2': '30'
      }],
      timesheet: [{
        employeeName: 'Test Employee',
        date: '2024-03-14',
        time: '9:00 AM',
        action: 'in'
      }],
      inventory: [{
        name: 'Test Item',
        currentStock: 50,
        maxStock: 100,
        minStock: 10,
        unit: 'pieces'
      }],
      inventoryLogs: [{
        itemId: 'Test Item',
        previousStock: 40,
        newStock: 50,
        updateType: 'restock',
        timestamp: new Date().toISOString(),
        updatedBy: 'Test Employee',
        notes: 'Test restock'
      }]
    };

    console.log('\nSending test data:', JSON.stringify(testData, null, 2));

    const response = await axios.post('http://127.0.0.1:5000/api/sync', testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('\nResponse status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    console.log('\nSync test completed successfully!');

  } catch (error) {
    console.error('\nError testing sync:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received');
      console.error('Request:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    console.error('\nFull error:', error);
  }
}

// Run the test
testSync(); 