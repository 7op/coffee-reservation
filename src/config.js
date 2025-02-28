// تحديد عنوان السيرفر بناءً على بيئة التشغيل
const getServerUrl = () => {
  if (import.meta.env.MODE === 'development') {
    return 'http://localhost:5000';
  }
  return import.meta.env.VITE_SERVER_URL || 'https://coffee-reservation-hyam2.vercel.app';
};

export const SERVER_URL = getServerUrl();
export const API_ENDPOINTS = {
  login: '/api/auth/login',
  bookings: '/api/bookings',
  settings: '/api/settings/',
  settingsBooking: '/api/settings/booking',
  maxDailyBookings: '/api/settings/maxDailyBookings',
  maxGuests: '/api/settings/maxGuests'
}; 