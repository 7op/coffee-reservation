import { SERVER_URL, API_ENDPOINTS } from '../config';

// حذف التعريف المباشر
// const SERVER_URL = 'http://localhost:5000';

// استبدال جميع الاستخدامات المباشرة:
// مثال:
// fetch(`${SERVER_URL}/settings`) => fetch(`${SERVER_URL}${API_ENDPOINTS.settings}`)
// fetch(`${SERVER_URL}/bookings`) => fetch(`${SERVER_URL}${API_ENDPOINTS.bookings}`) 