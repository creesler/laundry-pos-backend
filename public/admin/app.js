// Create a global namespace for our app
window.LaundryAdmin = window.LaundryAdmin || {};

// API URL constant - automatically detect environment
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000/api' 
  : 'https://laundry-pos-api.vercel.app/api';

// Debug log to check initialization
console.log('🚀 Initializing LaundryAdmin with API_URL:', API_URL);

// Test function to check all endpoints
async function testAllEndpoints() {
    console.log('🔍 Testing all endpoints...');

    // Test employees endpoint
    try {
        console.log('👥 Testing /employees endpoint...');
        const employeesResponse = await fetch(`${API_URL}/employees`);
        console.log('Response status:', employeesResponse.status);
        if (!employeesResponse.ok) {
            const errorText = await employeesResponse.text();
            console.error('Error response:', errorText);
        } else {
            const employees = await employeesResponse.json();
            console.log('Employees data:', employees);
        }
    } catch (error) {
        console.error('Error fetching employees:', error);
    }

    // Test sales endpoint
    try {
        console.log('💰 Testing /sales endpoint...');
        const salesResponse = await fetch(`${API_URL}/sales`);
        console.log('Response status:', salesResponse.status);
        if (!salesResponse.ok) {
            const errorText = await salesResponse.text();
            console.error('Error response:', errorText);
        } else {
            const sales = await salesResponse.json();
            console.log('Sales data:', sales);
        }
    } catch (error) {
        console.error('Error fetching sales:', error);
    }

    // Test timesheets endpoint
    try {
        console.log('⏰ Testing /timesheets endpoint...');
        const timesheetsResponse = await fetch(`${API_URL}/timesheets`);
        console.log('Response status:', timesheetsResponse.status);
        if (!timesheetsResponse.ok) {
            const errorText = await timesheetsResponse.text();
            console.error('Error response:', errorText);
        } else {
            const timesheets = await timesheetsResponse.json();
            console.log('Timesheets data:', timesheets);
        }
    } catch (error) {
        console.error('Error fetching timesheets:', error);
    }

    // Test inventory endpoint
    try {
        console.log('📦 Testing /inventory endpoint...');
        const inventoryResponse = await fetch(`${API_URL}/inventory`);
        console.log('Response status:', inventoryResponse.status);
        if (!inventoryResponse.ok) {
            const errorText = await inventoryResponse.text();
            console.error('Error response:', errorText);
        } else {
            const inventory = await inventoryResponse.json();
            console.log('Inventory data:', inventory);
        }
    } catch (error) {
        console.error('Error fetching inventory:', error);
    }

    console.log('✅ Endpoint testing complete');
}

// Run the test when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌟 Running endpoint tests...');
    testAllEndpoints();
});

// Wait for all functions to be defined before initializing
(function(app) {
    // Global state
    let chart = null;
    let allSalesData = null;  // Store all sales data
    let currentData = null;  // Initialize as null instead of with default values

    // Employee Management
    let employees = [];

    // DOM Elements
    const messageBox = document.getElementById('messageBox');
    const form = document.getElementById('employeeForm');
    const employeeTable = document.getElementById('employeeTable').getElementsByTagName('tbody')[0];
    const submitBtn = document.getElementById('submitBtn');
    const clearBtn = document.getElementById('clearBtn');
    const employeeTabs = document.getElementById('employeeTabs');
    const timesheetStartDate = document.getElementById('timesheetStartDate');
    const timesheetEndDate = document.getElementById('timesheetEndDate');
    const timesheetTable = document.getElementById('timesheetTableBody');
    const totalHoursSpan = document.getElementById('totalHours');

    // Timesheet functionality
    let timesheetData = {};
    let selectedEmployee = null;

    // Inventory Management
    let inventoryChart = null;
    let inventoryData = null;
    let inventoryChartType = 'stock';

    // Global date state
    let currentPeriodDate = new Date();

    // Add debug counter
    let refreshCounter = 0;

    // Add debounce function at the top
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Format the date with full details
    function getFormattedDate(date) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        
        const formattedDate = `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
        console.log('Formatting date:', formattedDate); // Debug log
        return formattedDate;
    }

    // Handle date display update
    function updateDateDisplay() {
        const displayElement = document.getElementById('dateRangeDisplay');
        if (!displayElement) {
            console.error('Date display element not found');
            return;
        }

        const formattedDate = getFormattedDate(currentPeriodDate);
        console.log('Updating display with:', formattedDate); // Debug log
        displayElement.textContent = formattedDate;
    }

    // Handle date navigation
    function handleDateNavigation(direction) {
        console.log('Navigation direction:', direction); // Debug log
        console.log('Current date before:', getFormattedDate(currentPeriodDate)); // Debug log

        // Create a new date object
        const newDate = new Date(currentPeriodDate);
        
        // Update the date
        if (direction === 'next') {
            newDate.setDate(newDate.getDate() + 1);
        } else {
            newDate.setDate(newDate.getDate() - 1);
        }

        // Update our state
        currentPeriodDate = newDate;
        
        console.log('New date after navigation:', getFormattedDate(currentPeriodDate)); // Debug log
        
        // Update display first
        updateDateDisplay();
        
        // Then refresh data
        refreshData();
    }

    // Initialize period filter
    function initializePeriodFilter() {
        console.log('[Debug] initializePeriodFilter called');
        const periodFilter = document.getElementById('periodFilter');
        const dateControls = document.getElementById('dateControls');

        if (!periodFilter || !dateControls) return;

        // Reset to today's date
        currentPeriodDate = new Date();
        
        // Initialize the date navigation
        initializeDateNavigation();

        // Create debounced handler for period changes
        const handlePeriodChange = debounce(() => {
            console.log('[Debug] Period changed to:', periodFilter.value);
            const period = periodFilter.value;
            
            if (period === 'custom') {
                dateControls.style.display = 'flex';
            } else {
                dateControls.style.display = 'none';
                // Reset to today
                currentPeriodDate = new Date();
                updateDateRangeDisplay(null, null, period);
                console.log('[Debug] About to call refreshData from period change handler');
                refreshData();
            }
        }, 250); // 250ms debounce delay

        // Handle period changes
        periodFilter.addEventListener('change', handlePeriodChange);

        // Initial data refresh
        console.log('[Debug] About to call initial refreshData');
        refreshData();
    }

    // Utility functions
    function formatCurrency(value) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(value);
    }

    // Format date to show day name, month, day, and year
    function formatDate(date) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        
        const dayName = days[date.getDay()];
        const monthName = months[date.getMonth()];
        const day = date.getDate();
        const year = date.getFullYear();
        
        return `${dayName}, ${monthName} ${day}, ${year}`;
    }

    // Get date range based on period
    function getDateRange(period) {
        if (!currentPeriodDate) {
            currentPeriodDate = new Date();
        }

        const start = new Date(currentPeriodDate);
        const end = new Date(currentPeriodDate);
        
        switch (period) {
            case 'day':
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'month':
                start.setDate(1);
                start.setHours(0, 0, 0, 0);
                end.setMonth(end.getMonth() + 1);
                end.setDate(0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'year':
                start.setMonth(0, 1);
                start.setHours(0, 0, 0, 0);
                end.setMonth(11, 31);
                end.setHours(23, 59, 59, 999);
                break;
            case 'custom':
                const startInput = document.getElementById('startDate');
                const endInput = document.getElementById('endDate');
                if (startInput.value && endInput.value) {
                    start.setTime(new Date(startInput.value).getTime());
                    start.setHours(0, 0, 0, 0);
                    end.setTime(new Date(endInput.value).getTime());
                    end.setHours(23, 59, 59, 999);
                } else {
                    return null;
                }
                break;
            case 'all':
                return null;
            default:
                return null;
        }

        return { start, end };
    }

    // Filter data based on date range
    function filterData(data, startDate, endDate) {
        if (!data) return [];
        
        const start = startDate ? new Date(startDate) : new Date(0);
        const end = endDate ? new Date(endDate) : new Date();
        
        // Set time to start of day for start date and end of day for end date
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        console.log('Filtering data:', {
            startDate: start.toISOString(),
            endDate: end.toISOString(),
            totalRecords: data.length
        });

        // Sort data by date first
        data.sort((a, b) => new Date(b.Date) - new Date(a.Date));

        const filtered = data.filter(sale => {
            const saleDate = new Date(sale.Date);
            saleDate.setHours(0, 0, 0, 0); // Normalize sale date to start of day
            return saleDate >= start && saleDate <= end;
        });

        console.log('Filtered results:', {
            filteredCount: filtered.length,
            firstDate: filtered[0]?.Date,
            lastDate: filtered[filtered.length - 1]?.Date
        });

        return filtered;
    }

    // Calculate totals from sales data
    function calculateTotals(salesData) {
        if (!salesData || !salesData.length) {
            console.log('No sales data to calculate totals');
            return {
                coin: 0,
                hopper: 0,
                soap: 0,
                vending: 0,
                dropOff1: 0,
                dropOff2: 0
            };
        }

        const totals = {
            coin: salesData.reduce((sum, sale) => sum + (parseFloat(sale.Coin) || 0), 0),
            hopper: salesData.reduce((sum, sale) => sum + (parseFloat(sale.Hopper) || 0), 0),
            soap: salesData.reduce((sum, sale) => sum + (parseFloat(sale.Soap) || 0), 0),
            vending: salesData.reduce((sum, sale) => sum + (parseFloat(sale.Vending) || 0), 0),
            dropOff1: salesData.reduce((sum, sale) => sum + (parseFloat(sale['Drop Off Amount 1']) || 0), 0),
            dropOff2: salesData.reduce((sum, sale) => sum + (parseFloat(sale['Drop Off Amount 2']) || 0), 0)
        };

        console.log('Calculated totals:', totals);
        return totals;
    }

    // Chart functions
    function initializeChart(data = null) {
        const defaultData = {
            labels: ['Coin', 'Hopper', 'Soap', 'Vending', 'Drop Off 1', 'Drop Off 2'],
            values: [436, 170, 367, 299, 771, 690]
        };

        const chartData = data || defaultData;
        const ctx = document.getElementById('totalSalesChart').getContext('2d');
        
        if (chart) {
            chart.destroy();
        }

        chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartData.labels,
                datasets: [{
                    data: chartData.values,
                    backgroundColor: [
                        '#3b82f6',
                        '#60a5fa',
                        '#93c5fd',
                        '#bfdbfe',
                        '#dbeafe',
                        '#eff6ff'
                    ],
                    borderColor: 'white',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    datalabels: {
                        color: '#1e293b',
                        anchor: 'end',
                        align: 'top',
                        offset: 4,
                        font: {
                            weight: '600',
                            size: 12
                        },
                        formatter: (value) => formatCurrency(value)
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => formatCurrency(value)
                        }
                    }
                }
            }
        });
    }

    function updateChart(totals) {
        console.log('Updating chart with totals:', totals);

        // Always destroy the existing chart before creating a new one
        if (chart) {
            console.log('Destroying existing chart');
            chart.destroy();
            chart = null;
        }

        const chartData = {
            labels: ['Coin', 'Hopper', 'Soap', 'Vending', 'Drop Off 1', 'Drop Off 2'],
            values: [
                totals.coin || 0,
                totals.hopper || 0,
                totals.soap || 0,
                totals.vending || 0,
                totals.dropOff1 || 0,
                totals.dropOff2 || 0
            ]
        };

        console.log('New chart data:', chartData);

        const ctx = document.getElementById('totalSalesChart').getContext('2d');
        
        chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartData.labels,
                datasets: [{
                    data: chartData.values,
                    backgroundColor: [
                        '#3b82f6',
                        '#60a5fa',
                        '#93c5fd',
                        '#bfdbfe',
                        '#dbeafe',
                        '#eff6ff'
                    ],
                    borderColor: 'white',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    datalabels: {
                        color: '#1e293b',
                        anchor: 'end',
                        align: 'top',
                        offset: 4,
                        font: {
                            weight: '600',
                            size: 12
                        },
                        formatter: (value) => formatCurrency(value)
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => formatCurrency(value)
                        }
                    }
                }
            }
        });

        console.log('Chart created with new data');
    }

    // Format date with different levels of detail
    function formatDateWithDetail(date, detail = 'full') {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        
        switch(detail) {
            case 'full':
                return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
            case 'month':
                return `${months[date.getMonth()]} ${date.getFullYear()}`;
            case 'year':
                return `${date.getFullYear()}`;
            default:
                return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
        }
    }

    // Update date range display
    function updateDateRangeDisplay(startDate, endDate, period) {
        const dateRangeDisplay = document.getElementById('dateRangeDisplay');
        
        if (period === 'custom' && startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const formattedStart = formatDate(start);
            const formattedEnd = formatDate(end);
            dateRangeDisplay.textContent = `${formattedStart} to ${formattedEnd}`;
        } else if (period === 'all') {
            dateRangeDisplay.textContent = 'All Time';
        } else if (period) {
            const currentDate = currentPeriodDate || new Date();
            let displayText;
            
            switch(period) {
                case 'day':
                    displayText = formatDate(currentDate);
                    break;
                case 'month': {
                    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                    displayText = `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
                    break;
                }
                case 'year': {
                    displayText = currentDate.getFullYear().toString();
                    break;
                }
                default:
                    displayText = period;
            }
            dateRangeDisplay.textContent = displayText;
        }
    }

    function updateTable(data) {
        console.log('Updating table with data:', data);

        const tableBody = document.getElementById('salesTableBody');
        tableBody.innerHTML = '';

        // Sort data by date (newest first)
        const sortedData = [...data].sort((a, b) => new Date(b.Date) - new Date(a.Date));

        sortedData.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${new Date(row.Date).toLocaleString()}</td>
                <td>${formatCurrency(parseFloat(row.Coin) || 0)}</td>
                <td>${formatCurrency(parseFloat(row.Hopper) || 0)}</td>
                <td>${formatCurrency(parseFloat(row.Soap) || 0)}</td>
                <td>${formatCurrency(parseFloat(row.Vending) || 0)}</td>
                <td>${formatCurrency(parseFloat(row['Drop Off Amount 1']) || 0)}</td>
                <td>${formatCurrency(parseFloat(row['Drop Off Amount 2']) || 0)}</td>
            `;
            tableBody.appendChild(tr);
        });

        // Update total amount
        const totals = calculateTotals(data);
        if (totals) {
            const total = Object.values(totals).reduce((sum, val) => sum + val, 0);
            document.getElementById('totalAmount').textContent = formatCurrency(total);
        }

        console.log('Table updated');
    }

    async function fetchAllData() {
        try {
            const response = await fetch(`${API_URL}/sales`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch sales data');
            }

            const data = await response.json();
            
            // Sort data by date
            data.sort((a, b) => new Date(a.Date) - new Date(b.Date));
            
            console.log('Fetched and sorted data:', {
                totalRecords: data.length,
                firstDate: data[0]?.Date,
                lastDate: data[data.length - 1]?.Date
            });
            
            return data;
        } catch (error) {
            console.error('Error fetching data:', error);
            return null;
        }
    }

    async function refreshData() {
        refreshCounter++;
        console.log(`[Debug] refreshData called (${refreshCounter})`);
        console.trace('[Debug] Stack trace for refresh call');

        const periodFilter = document.getElementById('periodFilter');
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        
        try {
            // First fetch all data
            console.log('Fetching all sales data...');
            const response = await fetch(`${API_URL}/sales`);
            if (!response.ok) throw new Error('Failed to fetch data');
            const allData = await response.json();
            console.log('Total sales records:', allData.length);

            // Then filter based on selected period
            let data = allData;
            if (periodFilter.value !== 'all') {
                let startDate, endDate;
                
                if (periodFilter.value === 'custom' && startDateInput.value && endDateInput.value) {
                    startDate = new Date(startDateInput.value);
                    endDate = new Date(endDateInput.value);
                    endDate.setHours(23, 59, 59, 999);
                } else {
                    const dateRange = getDateRange(periodFilter.value, currentPeriodDate);
                    if (dateRange) {
                        startDate = dateRange.start;
                        endDate = dateRange.end;
                        data = filterData(allData, startDate, endDate);
                    }
                }
            }

            console.log('Filtered sales records:', data.length);
            
            // Update the UI with the fetched data or show empty state
            if (data && data.length > 0) {
                const totals = calculateTotals(data);
            updateChart(totals);
                updateTable(data);
            } else {
                // Show empty state but keep the date range display
                updateChart({
                    coin: 0,
                    hopper: 0,
                    soap: 0,
                    vending: 0,
                    dropOff1: 0,
                    dropOff2: 0
                });
                updateTable([]);
        }

            // Always update the date range display
            updateDateRangeDisplay(startDate, endDate, periodFilter.value);
        } catch (error) {
            console.error('Error fetching data:', error);
            showMessage('Error fetching data', true);
        }
    }

    // Update navigation buttons state
    function updateNavigationState() {
        const prevBtn = document.getElementById('prevPeriod');
        const nextBtn = document.getElementById('nextPeriod');
        const period = document.getElementById('periodFilter').value;

        // Disable navigation for 'all' and 'custom' periods
        if (period === 'all' || period === 'custom') {
            prevBtn.disabled = true;
            nextBtn.disabled = true;
            return;
        }

        // Enable both buttons for sequential navigation
        prevBtn.disabled = false;
        nextBtn.disabled = false;
        }

    // Update the display with the current date
    function updateDateDisplay() {
        const dateRangeDisplay = document.getElementById('dateRangeDisplay');
        if (dateRangeDisplay) {
            dateRangeDisplay.textContent = formatDate(currentPeriodDate);
        }
        }

    // Navigate to the next or previous day
    function navigateDay(direction) {
        // Create a new date object
        const newDate = new Date(currentPeriodDate);
            
        // Add or subtract one day
        if (direction === 'next') {
            newDate.setDate(newDate.getDate() + 1);
            } else {
            newDate.setDate(newDate.getDate() - 1);
        }
        
        // Update the current date
        currentPeriodDate = newDate;
        
        // Update the display
        updateDateDisplay();
        
        // Refresh data
                refreshData();
            }

    // Initialize date navigation
    function initializeDateNavigation() {
        console.log('[Debug] Initializing date navigation');
        const prevBtn = document.getElementById('prevPeriod');
        const nextBtn = document.getElementById('nextPeriod');

        if (!prevBtn || !nextBtn) {
            console.error('Navigation buttons not found');
            return;
        }

        // Remove any existing event listeners
        prevBtn.replaceWith(prevBtn.cloneNode(true));
        nextBtn.replaceWith(nextBtn.cloneNode(true));

        // Get fresh references after replacing
        const newPrevBtn = document.getElementById('prevPeriod');
        const newNextBtn = document.getElementById('nextPeriod');

        // Add debounced click handlers
        const handleNavigation = debounce((direction) => {
            console.log('[Debug] Navigation button clicked:', direction);
            navigatePeriod(direction);
        }, 250);

        newPrevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleNavigation('prev');
        });

        newNextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleNavigation('next');
            });
        }

    function initializeNavigation() {
        // Set up section navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                // Get the nav-link element, whether the click was on the link itself or its child icon
                const navLink = e.target.closest('.nav-link');
                if (!navLink) return;
                
                const section = navLink.getAttribute('data-section');
                document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
                document.getElementById(section).classList.add('active');
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                navLink.classList.add('active');

                // Initialize section-specific functionality
                if (section === 'employees') {
                    fetchEmployees();
                } else if (section === 'timesheets') {
                    initializeTimesheets();
                }
            });
        });

        console.log('Navigation initialized');
    }

    // Show message function
    function showMessage(message, isError = false) {
        if (messageBox) {
            messageBox.textContent = message;
            messageBox.className = `message-box ${isError ? 'error' : 'success'}`;
            messageBox.style.display = 'block';
            setTimeout(() => messageBox.style.display = 'none', 3000);
        } else {
            console.log(`Message: ${message} (${isError ? 'error' : 'success'})`);
        }
    }

    // Clear form function
    function clearForm() {
        if (form) {
            form.reset();
            const employeeIdInput = document.getElementById('employeeId');
            if (employeeIdInput) {
                employeeIdInput.value = '';
            }
            if (submitBtn) {
                submitBtn.textContent = 'Add Employee';
            }
        }
    }

    // Remove employee function
    async function removeEmployee(id) {
        if (!confirm('Are you sure you want to remove this employee? This will set their status to inactive.')) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/employees/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: 'inactive'
                })
            });

            if (!response.ok) {
                throw new Error('Failed to remove employee');
            }

            showMessage('Employee removed successfully');
            await fetchEmployees(); // Refresh the employee list
        } catch (error) {
            showMessage('Error removing employee', true);
            console.error('Error:', error);
        }
    }

    // Add test timesheet data
    async function addTestTimesheetData(employeeName) {
        console.log('📅 ADMIN: Adding test timesheet data for', employeeName);
        
        const today = new Date();
        const entries = [];
        
        // Create entries for the last 7 days
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            // Random duration between 6 and 9 hours
            const hours = Math.floor(Math.random() * 3) + 6;
            const minutes = Math.floor(Math.random() * 60);
            const duration = `${hours}h ${minutes}m`;
            
            entries.push({
                date: date.toISOString().split('T')[0],
                duration: duration
            });
        }
        
        try {
            const response = await fetch(`${API_URL}/timesheets/bulk`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    employeeName,
                    entries,
                    totalHours: entries.length * 8 // Approximate
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to add test timesheet data');
            }
            
            console.log('✅ ADMIN: Test timesheet data added successfully');
            return true;
        } catch (error) {
            console.error('❌ ADMIN: Error adding test timesheet data:', error);
            return false;
        }
    }

    // Modified fetchEmployees function to add test data
    async function fetchEmployees() {
        console.log('👥 ADMIN: Fetching employees...', API_URL);
        try {
            const response = await fetch(`${API_URL}/employees`);
            console.log('📥 Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('📛 Response error:', errorText);
                throw new Error(`Failed to fetch employees: ${response.status} ${errorText}`);
            }
            
            const data = await response.json();
            console.log('📋 ADMIN: Received employee data:', data);
            employees = data;
            renderEmployees();
            
            // Initialize timesheet with first employee
            if (employees.length > 0) {
                selectEmployee(employees[0].name);
            }
        } catch (error) {
            console.error('❌ ADMIN: Error fetching employees:', error);
            showMessage(`Error fetching employees: ${error.message}`, true);
        }
    }

    // Render employees table
    function renderEmployees() {
        console.log('🔄 ADMIN: Rendering employee table');
        employeeTable.innerHTML = '';
        if (!employees || employees.length === 0) {
            console.log('⚠️ ADMIN: No employees to display');
            employeeTable.innerHTML = '<tr><td colspan="5">No employees found</td></tr>';
            return;
        }
        
        console.log(`✨ ADMIN: Rendering ${employees.length} employees`);
        employees.forEach(employee => {
            const row = employeeTable.insertRow();
            row.innerHTML = `
                <td>${employee.name || 'N/A'}</td>
                <td>${employee.contactNumber || '-'}</td>
                <td>${employee.role || 'N/A'}</td>
                <td>${employee.status || 'N/A'}</td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="LaundryAdmin.editEmployee('${employee._id}')">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="LaundryAdmin.deleteEmployee('${employee._id}')">Delete</button>
                    <button class="btn btn-secondary btn-sm" onclick="LaundryAdmin.removeEmployee('${employee._id}')">Remove</button>
                </td>
            `;
        });
        console.log('✅ ADMIN: Employee table rendered successfully');
    }

    // Edit employee
    function editEmployee(id) {
        const employee = employees.find(emp => emp._id === id);
        if (employee) {
            document.getElementById('employeeId').value = employee._id;
            document.getElementById('name').value = employee.name;
            document.getElementById('contactNumber').value = employee.contactNumber || '';
            document.getElementById('address').value = employee.address || '';
            document.getElementById('role').value = employee.role;
            document.getElementById('status').value = employee.status;
            submitBtn.textContent = 'Update Employee';
        }
    }

    // Delete employee
    async function deleteEmployee(id) {
        if (confirm('Are you sure you want to delete this employee?')) {
            try {
                const response = await fetch(`${API_URL}/employees/${id}`, {
                    method: 'DELETE'
                });
                if (response.ok) {
                    showMessage('Employee deleted successfully');
                    await fetchEmployees();
                } else {
                    throw new Error('Failed to delete employee');
                }
            } catch (error) {
                showMessage('Error deleting employee', true);
                console.error('Error:', error);
            }
        }
    }

    // Form submit handler
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const employeeId = document.getElementById('employeeId').value;
        const employeeData = {
            name: document.getElementById('name').value,
            contactNumber: document.getElementById('contactNumber').value,
            address: document.getElementById('address').value,
            role: document.getElementById('role').value,
            status: document.getElementById('status').value
        };

        try {
                            const url = employeeId 
                ? `${API_URL}/employees/${employeeId}`
                : `${API_URL}/employees`;
            const method = employeeId ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(employeeData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.msg || 'Failed to save employee');
            }

                showMessage(`Employee ${employeeId ? 'updated' : 'added'} successfully`);
                clearForm();
                await fetchEmployees();
        } catch (error) {
            console.error('❌ ADMIN: Error saving employee:', error);
            showMessage(error.message || 'Error saving employee', true);
        }
    });

    // Clear button handler
    clearBtn.addEventListener('click', clearForm);

    // Initialize everything when the page loads
    function initialize() {
        console.log('Initializing dashboard...');
        
        // Register Chart.js plugins
        if (window.Chart) {
            Chart.register(ChartDataLabels);
            console.log('Chart.js plugins registered');
        }

        // Set default date range to current month
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        document.getElementById('startDate').value = firstDayOfMonth.toISOString().split('T')[0];
        document.getElementById('endDate').value = today.toISOString().split('T')[0];
        
        // Set up refresh button click handler
        document.getElementById('refreshButton').addEventListener('click', refreshData);
        
        // Initialize all components
        initializeChart();
        initializePeriodFilter();
        initializeNavigation();
        refreshData();
        
        // Initialize employee list
        fetchEmployees();
        
        // Initialize inventory controls and data
        initializeInventoryControls();
        refreshInventoryData();
        
        console.log('Dashboard initialization complete');
    }

    // Expose necessary functions to the global scope
    app.refreshData = refreshData;
    app.updateChart = updateChart;
    app.initializePeriodFilter = initializePeriodFilter;
    app.deleteEmployee = deleteEmployee;  // Expose employee management functions
    app.editEmployee = editEmployee;
    app.removeEmployee = removeEmployee;
    app.fetchEmployees = fetchEmployees;
    app.initializeTimesheets = initializeTimesheets;

    // Start initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('🌟 DOM Content Loaded - Starting initialization');
            initialize();
        });
    } else {
        console.log('🌟 DOM Already Ready - Starting initialization');
        initialize();
    }

    // Initialize date inputs with current month
    function initializeTimesheetDates() {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        timesheetStartDate.value = firstDay.toISOString().split('T')[0];
        timesheetEndDate.value = lastDay.toISOString().split('T')[0];
    }

    // Format duration to hours and minutes
    function formatDuration(minutes) {
        if (!minutes) return '--';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    }

    // Format date and time
    function formatDateTime(dateString, format = 'date') {
        if (!dateString) return '--';
        const date = new Date(dateString);
        if (format === 'date') {
            return date.toLocaleDateString();
        } else if (format === 'time') {
            return date.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
            });
        }
        return '--';
    }

    // Fetch timesheet data from server
    async function fetchTimesheetData() {
        console.log('📅 ADMIN: Fetching timesheet data...');
        if (!selectedEmployee) {
            console.log('⚠️ ADMIN: No employee selected');
            return;
        }

        try {
            console.log(`🔍 ADMIN: Fetching timesheets for ${selectedEmployee} from ${timesheetStartDate.value} to ${timesheetEndDate.value}`);
            const response = await fetch(
                `${API_URL}/timesheets?employeeName=${encodeURIComponent(selectedEmployee)}&startDate=${timesheetStartDate.value}&endDate=${timesheetEndDate.value}`
            );
            
            console.log('📥 ADMIN: Timesheet API response status:', response.status);
            if (!response.ok) {
                throw new Error(`Failed to fetch timesheet data: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('📋 ADMIN: Received timesheet data:', data);
            timesheetData = data;
            renderTimesheet();
        } catch (error) {
            console.error('❌ ADMIN: Error fetching timesheet data:', error);
            showMessage('Error loading timesheet data', true);
            timesheetTable.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Failed to load timesheet data</td></tr>';
        }
    }

    // Render timesheet table
    function renderTimesheet() {
        console.log('🔄 ADMIN: Rendering timesheet table');
        if (!timesheetTable) {
            console.error('❌ ADMIN: Timesheet table element not found');
            return;
        }

        timesheetTable.innerHTML = '';
        let totalHours = 0;

        if (!Array.isArray(timesheetData) || timesheetData.length === 0) {
            console.log('⚠️ ADMIN: No timesheet data to display');
            timesheetTable.innerHTML = '<tr><td colspan="5" class="text-center">No timesheet entries found for this period</td></tr>';
            totalHoursSpan.textContent = '0';
            return;
        }

        console.log(`📊 ADMIN: Rendering ${timesheetData.length} timesheet entries`);
        timesheetData.forEach(entry => {
            const row = document.createElement('tr');
            
            // Format the date as YYYY-MM-DD
            const date = new Date(entry.date);
            const formattedDate = date.toISOString().split('T')[0];
            
            // Format times as HH:MM
            const clockInTime = entry.clockIn ? new Date(entry.clockIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A';
            const clockOutTime = entry.clockOut ? new Date(entry.clockOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A';
            
            // Calculate hours (duration is in minutes)
            const hours = entry.duration ? (entry.duration / 60).toFixed(2) : '0.00';
            
            row.innerHTML = `
                <td>${formattedDate}</td>
                <td>${clockInTime}</td>
                <td>${clockOutTime}</td>
                <td>${hours}</td>
                <td>
                    <span class="badge ${entry.status === 'completed' ? 'bg-success' : 'bg-warning'}">
                        ${entry.status || 'N/A'}
                    </span>
                </td>
            `;
            timesheetTable.appendChild(row);

            if (entry.duration) {
                totalHours += entry.duration / 60;
            }
        });

        console.log(`✨ ADMIN: Total hours calculated: ${totalHours.toFixed(2)}`);
        totalHoursSpan.textContent = totalHours.toFixed(2);
    }

    // Render employee tabs
    function renderEmployeeTabs() {
        employeeTabs.innerHTML = '';
        employees.forEach(employee => {
            const tab = document.createElement('button');
            tab.className = `tab ${employee.name === selectedEmployee ? 'active' : ''}`;
            tab.textContent = employee.name;
            tab.onclick = () => selectEmployee(employee.name);
            employeeTabs.appendChild(tab);
        });
    }

    // Select employee and update timesheet
    async function selectEmployee(employeeName) {
        console.log('👤 ADMIN: Selecting employee:', employeeName);
        selectedEmployee = employeeName;
        renderEmployeeTabs();
        
        // First try to fetch existing timesheet data
        await fetchTimesheetData();
        
        // If no data exists, generate test data
        if (!timesheetData || !Array.isArray(timesheetData) || timesheetData.length === 0) {
            console.log('📊 ADMIN: No timesheet data found, generating test data...');
            await addTestTimesheetData(employeeName);
            await fetchTimesheetData(); // Fetch the newly generated data
        }
    }

    // Event listeners for date filters
    document.querySelector('.filter-btn').addEventListener('click', () => {
        console.log('🔍 ADMIN: Filter button clicked');
        if (selectedEmployee) {
            fetchTimesheetData();
        }
    });

    // Initialize timesheet and filters
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🚀 ADMIN: Initializing page...');
        initializeTimesheetDates();
        fetchEmployees();
    });

    async function fetchInventoryData() {
        try {
            const response = await fetch(`${API_URL}/inventory`);
            if (!response.ok) {
                throw new Error('Failed to fetch inventory data');
            }
            inventoryData = await response.json();
            console.log('Fetched inventory data:', inventoryData);
            return inventoryData;
        } catch (error) {
            console.error('Error fetching inventory data:', error);
            showMessage('Error fetching inventory data', true);
            return null;
        }
    }

    async function fetchInventoryLogs(period = 'week') {
        const endDate = new Date();
        const startDate = new Date();
        if (period === 'week') {
            startDate.setDate(endDate.getDate() - 7);
        } else {
            startDate.setDate(endDate.getDate() - 30);
        }

        try {
            const response = await fetch(`${API_URL}/inventory/logs?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
            if (!response.ok) {
                throw new Error('Failed to fetch inventory logs');
            }
            const logs = await response.json();
            console.log('Fetched inventory logs:', logs);
            return logs;
        } catch (error) {
            console.error('Error fetching inventory logs:', error);
            showMessage('Error fetching inventory logs', true);
            return null;
        }
    }

    function initializeInventoryChart() {
        const ctx = document.getElementById('inventoryChart').getContext('2d');
        
        if (inventoryChart) {
            inventoryChart.destroy();
        }

        const chartConfig = {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Current Stock',
                    data: [],
                    backgroundColor: '#3b82f6',
                    borderColor: 'white',
                    borderWidth: 2
                },
                {
                    label: 'Max Stock',
                    data: [],
                    backgroundColor: '#22c55e',
                    borderColor: 'white',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    datalabels: {
                        color: '#1e293b',
                        anchor: 'end',
                        align: 'top',
                        formatter: (value) => value.toFixed(0)
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        };

        inventoryChart = new Chart(ctx, chartConfig);
    }

    function updateInventoryChart(data, type = 'stock') {
        if (!inventoryChart) {
            initializeInventoryChart();
        }

        if (type === 'stock') {
            // Current stock levels chart
            inventoryChart.data.labels = data.map(item => item.name);
            inventoryChart.data.datasets = [
                {
                    label: 'Current Stock',
                    data: data.map(item => item.currentStock),
                    backgroundColor: '#3b82f6',
                    borderColor: 'white',
                    borderWidth: 2
                },
                {
                    label: 'Max Stock',
                    data: data.map(item => item.maxStock),
                    backgroundColor: '#22c55e',
                    borderColor: 'white',
                    borderWidth: 2
                }
            ];
        } else {
            // Usage trends chart
            inventoryChart.type = 'line';
            inventoryChart.data.labels = data.map(log => new Date(log.date).toLocaleDateString());
            inventoryChart.data.datasets = data.reduce((datasets, log) => {
                const itemName = log.itemName;
                const dataset = datasets.find(d => d.label === itemName);
                
                if (dataset) {
                    dataset.data.push(log.quantity);
                } else {
                    datasets.push({
                        label: itemName,
                        data: [log.quantity],
                        borderColor: `#${Math.floor(Math.random()*16777215).toString(16)}`,
                        fill: false
                    });
                }
                return datasets;
            }, []);
        }

        inventoryChart.update();
    }

    function updateInventoryTable(data) {
        const tbody = document.getElementById('inventoryTableBody');
        tbody.innerHTML = '';

        data.forEach(item => {
            const row = document.createElement('tr');
            const status = item.currentStock >= item.maxStock ? 'Overstocked' : 'Normal';
            const statusClass = status === 'Overstocked' ? 'text-warning' : 'text-success';

            row.innerHTML = `
                <td>${item.name}</td>
                <td>${item.currentStock}</td>
                <td>${item.maxStock}</td>
                <td>${new Date(item.lastUpdated).toLocaleString()}</td>
                <td class="${statusClass}">${status}</td>
            `;
            tbody.appendChild(row);
        });
    }

    async function refreshInventoryData() {
        const data = await fetchInventoryData();
        if (!data) return;

        if (inventoryChartType === 'usage') {
            const period = document.getElementById('inventoryPeriod').value;
            const logs = await fetchInventoryLogs(period);
            if (logs) {
                updateInventoryChart(logs, 'usage');
            }
        } else {
            updateInventoryChart(data, 'stock');
        }

        updateInventoryTable(data);
    }

    function initializeInventoryControls() {
        const chartTypeSelect = document.getElementById('inventoryChartType');
        const periodControls = document.getElementById('inventoryPeriodControls');
        const periodSelect = document.getElementById('inventoryPeriod');
        const refreshButton = document.getElementById('refreshInventoryButton');

        chartTypeSelect.addEventListener('change', (e) => {
            inventoryChartType = e.target.value;
            periodControls.style.display = inventoryChartType === 'usage' ? 'block' : 'none';
            refreshInventoryData();
        });

        periodSelect.addEventListener('change', () => {
            if (inventoryChartType === 'usage') {
                refreshInventoryData();
            }
        });

        refreshButton.addEventListener('click', refreshInventoryData);
    }

    // Initialize global Chart.js plugins
    if (window.Chart) {
        Chart.register(ChartDataLabels);
    }

    // These functions are already exposed above

    // Function to initialize timesheet section
    async function initializeTimesheets() {
        console.log('🕒 ADMIN: Initializing timesheet section');
        initializeTimesheetDates();
        await fetchEmployees();
            if (employees.length > 0) {
            await selectEmployee(employees[0].name);
        }
        // Add event listener for filter button
        const filterBtn = document.querySelector('.filter-btn');
        if (filterBtn) {
            filterBtn.addEventListener('click', () => {
                if (selectedEmployee) {
                    fetchTimesheetData();
            }
        });
        }
    }

    // These functions are already exposed above

    // Initialize the application
    document.addEventListener('DOMContentLoaded', () => {
        initialize();
        initializePeriodFilter();
        initializeNavigation();
        initializeInventoryControls();
        
        // Fetch initial data
        fetchAllData();
        fetchEmployees();

        // Initialize timesheet if it's the active section
        const timesheetSection = document.getElementById('timesheets');
        if (timesheetSection && timesheetSection.classList.contains('active')) {
            initializeTimesheets();
        }
    });

    // Navigate to next/previous period
    function navigatePeriod(direction) {
        console.log(`[Debug] navigatePeriod called with direction: ${direction}`);
        const periodFilter = document.getElementById('periodFilter');
        const currentPeriod = periodFilter.value;
        
        if (currentPeriod === 'all' || currentPeriod === 'custom') {
            return; // No navigation for these periods
        }

        if (!currentPeriodDate) {
            currentPeriodDate = new Date();
        }

        // Create a new date object to avoid modifying the original
        const newDate = new Date(currentPeriodDate.getTime());
        console.log('[Debug] Current date before navigation:', newDate.toISOString());

        switch (currentPeriod) {
            case 'day':
                newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
                break;
            case 'month': {
                const currentMonth = newDate.getMonth();
                const newMonth = currentMonth + (direction === 'next' ? 1 : -1);
                newDate.setMonth(newMonth);
                
                // Check if we went too far (e.g., Jan 31 -> Feb 31 becomes Mar 3)
                if (newDate.getMonth() !== ((newMonth + 12) % 12)) {
                    // If so, set to last day of intended month
                    newDate.setDate(0);
                }
                console.log('[Debug] Month navigation:', {
                    currentMonth,
                    newMonth: newDate.getMonth(),
                    fullDate: newDate.toISOString()
                });
                break;
            }
            case 'year':
                newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
                break;
        }

        // Update the current period date with the new date
        currentPeriodDate = newDate;
        console.log('[Debug] Date after navigation:', currentPeriodDate.toISOString());

        // Update display and refresh data
        updateDateRangeDisplay(null, null, currentPeriod);
        refreshData();
    }

})(window.LaundryAdmin); 