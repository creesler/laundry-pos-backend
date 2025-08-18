// API URL configuration
window.API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000/api' 
  : window.location.origin + '/api';  // Use current origin for API

console.log('🚀 API URL configured:', window.API_URL);