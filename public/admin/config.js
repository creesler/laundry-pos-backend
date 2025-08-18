// API URL configuration
window.API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000/api' 
  : 'https://laundry-pos-backend.vercel.app/api';

console.log('🚀 API URL configured:', window.API_URL);
