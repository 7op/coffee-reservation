export const SERVER_URL = process.env.SERVER_URL || 'https://coffee-reservation.onrender.com';
export const API_ENDPOINTS = {
  login: '/api/auth/login',
  bookings: '/api/bookings',
  settings: '/api/settings/',
  settingsBooking: '/api/settings/booking',
  maxDailyBookings: '/api/settings/maxDailyBookings',
  maxGuests: '/api/settings/maxGuests'
}; 