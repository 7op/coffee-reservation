import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import AdminDashboard from './components/AdminDashboard';
import BookingForm from './components/BookingForm';

// مكون التوجيه المحمي للوحة التحكم فقط
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* صفحة الحجز الرئيسية - متاحة للجميع */}
        <Route path="/" element={<BookingForm />} />
        
        {/* صفحة تسجيل الدخول للوحة التحكم */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* لوحة التحكم - محمية بتسجيل الدخول */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* توجيه أي مسار غير معروف إلى الصفحة الرئيسية */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App; 