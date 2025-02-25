const VERCEL_URL = process.env.VERCEL_URL;

export const SERVER_URL = process.env.NODE_ENV === 'production'
  ? `https://${VERCEL_URL}`
  : 'http://localhost:4000';

export const API_ENDPOINTS = {
  login: '/api/auth/login',
  bookings: '/api/bookings',
  settings: '/api/settings/booking'
}; 