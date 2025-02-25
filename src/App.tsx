import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';  // تأكد من استيراد Navbar بشكل صحيح
import Home from './pages/Home';
import Booking from './pages/Booking';

function App() {
  return (
    <Router>
      <Navbar />  {/* تأكد من إضافة Navbar هنا */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/booking" element={<Booking />} />

        {/* إضافة مسار navbar إذا كنت بحاجة إليه */}
        <Route path="/navbar" element={<Navbar />} />  
      </Routes>
    </Router>
  );
}

export default App;
