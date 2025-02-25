import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import BookingForm from './components/BookingForm';
import AdminDashboard from './components/AdminDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<BookingForm />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App; 