export const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
export const API_ENDPOINTS = {
  login: '/api/auth/login',
  bookings: '/api/bookings',
  settings: '/api/settings',
  settingsBooking: '/api/settings/booking',
  maxDailyBookings: '/api/settings/maxDailyBookings',
  maxGuests: '/api/settings/maxGuests'
}; 