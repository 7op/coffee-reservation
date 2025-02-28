import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  Button,
  Container,
  Typography,
  Paper,
  Stack,
  Alert,
  MenuItem,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import io from 'socket.io-client';
import { SERVER_URL, API_ENDPOINTS } from '../config';

// تصميم مخصص للورقة
const StyledPaper = styled(Paper)(({ theme }) => ({
  position: 'relative',
  padding: theme.spacing(4),
  borderRadius: 20,
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 8px 32px rgba(31, 54, 92, 0.15)',
  overflow: 'hidden',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3),
    borderRadius: 16,
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'linear-gradient(45deg, #012070 30%, #012070 90%)',
  },
}));

// تصميم مخصص للحقول
const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
    },
    '&.Mui-focused': {
      backgroundColor: '#ffffff',
    },
    [theme.breakpoints.down('sm')]: {
      borderRadius: 8,
    },
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(0, 0, 0, 0.6)',
    '&.Mui-focused': {
      color: '#012070',
    }
  },
  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: '#012070',
  }
}));

// تصميم الصفحة الكاملة
const PageWrapper = styled(Box)({
  minHeight: '100vh',
  width: '100vw',
  margin: 0,
  padding: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `
      linear-gradient(135deg, 
        rgba(1, 32, 112, 0.1) 0%,
        rgba(1, 32, 112, 0.1) 100%
      )
    `,
    backgroundImage: `
      radial-gradient(circle at 50% 50%, rgba(1, 32, 112, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 0% 0%, rgba(1, 32, 112, 0.05) 0%, transparent 50%),
      radial-gradient(circle at 100% 100%, rgba(1, 32, 112, 0.1) 0%, transparent 50%)
    `,
    backgroundSize: '100% 100%, 50% 50%, 75% 75%',
    backgroundRepeat: 'no-repeat',
    zIndex: -1,
  },
  backgroundColor: '#f5f8fc'
});

// تصميم الشعار
const Logo = styled('img')(({ theme }) => ({
  width: 140,
  height: 'auto',
  [theme.breakpoints.down('sm')]: {
    width: 100,
  },
}));

const StyledContainer = styled(Container)(({ theme }) => ({
  [theme.breakpoints.up('sm')]: {
    padding: 0  // إلغاء جميع الـ padding في الشاشات المتوسطة والكبيرة
  }
}));

const BookingForm = () => {
  const [booking, setBooking] = useState({
    name: '',
    phone: '',
    guests: '',
    time: new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    }),
    day: '',
  });
  const [success, setSuccess] = useState(false);
  const [isBookingEnabled, setIsBookingEnabled] = useState(true);
  const [maxGuestsPerBooking, setMaxGuestsPerBooking] = useState(() => {
    const saved = localStorage.getItem('maxGuestsPerBooking');
    return saved ? parseInt(saved) : 10;
  });
  const [bookingStatus, setBookingStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    // إنشاء اتصال Socket.IO
    socketRef.current = io(SERVER_URL, {
      transports: ['websocket'],
      upgrade: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    });

    // معالجة أحداث الاتصال
    socketRef.current.on('connect', () => {
      console.log('تم الاتصال بالسيرفر بنجاح');
      fetchInitialSettings();
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('خطأ في الاتصال:', error);
      setBookingStatus('جاري إعادة الاتصال...');
    });

    socketRef.current.on('reconnect', (attemptNumber) => {
      console.log(`تم إعادة الاتصال بنجاح بعد ${attemptNumber} محاولات`);
      fetchInitialSettings();
    });

    // الاستماع لتحديثات الإعدادات
    socketRef.current.on('settingsUpdated', (data) => {
      if (data.maxGuests !== undefined) {
        setMaxGuestsPerBooking(data.maxGuests);
        localStorage.setItem('maxGuestsPerBooking', data.maxGuests.toString());
      }
    });

    socketRef.current.on('bookingStatusUpdated', (data) => {
      setIsBookingEnabled(data.bookingEnabled);
      setBookingStatus(data.bookingStatus || '');
    });

    // تنظيف عند إزالة المكون
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // دالة جلب الإعدادات الأولية
  const fetchInitialSettings = async () => {
    try {
      const [bookingResponse, guestsResponse] = await Promise.all([
        fetch(`${SERVER_URL}/api/settings/booking`),
        fetch(`${SERVER_URL}/api/settings/maxGuests`)
      ]);

      if (bookingResponse.ok) {
        const bookingData = await bookingResponse.json();
        setIsBookingEnabled(bookingData.enabled);
        setBookingStatus(bookingData.bookingStatus || '');
      }

      if (guestsResponse.ok) {
        const guestsData = await guestsResponse.json();
        if (guestsData.maxGuests) {
          setMaxGuestsPerBooking(guestsData.maxGuests);
          localStorage.setItem('maxGuestsPerBooking', guestsData.maxGuests.toString());
        }
      }
    } catch (error) {
      console.error('خطأ في جلب الإعدادات:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      // التحقق من صحة المدخلات
      if (!booking.name || !booking.phone || !booking.guests || !booking.time) {
        throw new Error('الرجاء تعبئة جميع الحقول المطلوبة');
      }

      const response = await fetch(`${SERVER_URL}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(booking),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'حدث خطأ في عملية الحجز');
      }

      setSuccess(true);
      setBooking({
        name: '',
        phone: '',
        guests: '',
        time: new Date().toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit'
        }),
        day: '',
      });
    } catch (error) {
      console.error('خطأ:', error);
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageWrapper>
      <StyledContainer maxWidth="sm">
        <StyledPaper elevation={20}>
          <Stack spacing={2}>
            <Box textAlign="center">
              <Logo 
                src="/logo.png" 
                alt="قهوة هيام"
              />
              <Typography 
                variant="h4" 
                gutterBottom
                sx={{
                  fontSize: { xs: '1.5rem', sm: '1.5rem' },
                  fontWeight: 700,
                  color: '#012070',
                  fontFamily: 'Tajawal, sans-serif',
                }}
              >
                احجز مكانك مع هيـام
              </Typography>
              <Typography 
                variant="subtitle1" 
                color="#012070" 
                sx={{
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  fontFamily: 'Tajawal, sans-serif',
                }}
              >
                استمتع بأجواء رمضانية مميزة مع قهوة هيام
              </Typography>
            </Box>

            {success ? (
              <Box sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'rgba(1, 32, 112, 0.1)',
                border: '1px solid rgba(1, 32, 112, 0.3)',
                color: '#012070',
                textAlign: 'center',
              }}>
                <Typography sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                   تم تأكيد حجزك بنجاح ! مبارك عليك الشهر ✨
                </Typography>
              </Box>
            ) : !isBookingEnabled ? (
              <Box sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'rgba(1, 32, 112, 0.1)',
                border: '1px solid rgba(1, 32, 112, 0.3)',
                color: '#012070',
                textAlign: 'center',
              }}>
                <Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1 
                  }}>
                    <span role="img" aria-label="warning">⚠️</span>
                    عذراً ، تم إغلاق الحجز حالياً لهذا اليوم
                  </Box>
                </Typography>
              </Box>
            ) : (
              <form onSubmit={handleSubmit}>
                <Stack spacing={2.5}>
                  <StyledTextField
                    fullWidth
                    id="name-input"
                    label="الاسم"
                    placeholder="أدخل اسمك الكامل"
                    value={booking.name}
                    onChange={(e) => setBooking({...booking, name: e.target.value})}
                    required
                    dir="rtl"
                    inputProps={{
                      id: 'name-input'
                    }}
                  />
                  
                  <StyledTextField
                    fullWidth
                    id="phone-input"
                    label="رقم الجوال"
                    placeholder="05xxxxxxxx"
                    value={booking.phone}
                    onChange={(e) => setBooking({...booking, phone: e.target.value})}
                    required
                    dir="rtl"
                    type="tel"
                    inputProps={{
                      id: 'phone-input',
                      pattern: '[0-9]*',
                      maxLength: 10
                    }}
                  />
                  
                  <StyledTextField
                    fullWidth
                    id="guests-input"
                    label="عدد الأشخاص"
                    placeholder={`الحد الأقصى المسموح به ${maxGuestsPerBooking} أشخاص`}
                    type="number"
                    value={booking.guests}
                    onChange={(e) => setBooking({...booking, guests: e.target.value})}
                    required
                    InputProps={{
                      inputProps: { 
                        id: 'guests-input',
                        min: 1,
                        max: maxGuestsPerBooking
                      }
                    }}
                  />
                  
                  <StyledTextField
                    fullWidth
                    id="day-input"
                    select
                    label="يوم الحضور"
                    placeholder="اختر يوم الحضور"
                    value={booking.day}
                    onChange={(e) => setBooking({...booking, day: e.target.value})}
                    required
                    dir="rtl"
                    inputProps={{
                      id: 'day-input'
                    }}
                  >
                    <MenuItem value="الخميس">الخميس</MenuItem>
                    <MenuItem value="الجمعة">الجمعة</MenuItem>
                    <MenuItem value="السبت">السبت</MenuItem>
                  </StyledTextField>
                  
                  <StyledTextField
                    fullWidth
                    id="time-input"
                    label="وقت الحضور"
                    placeholder="اختر وقت الحضور"
                    type="time"
                    value={booking.time}
                    onChange={(e) => setBooking({...booking, time: e.target.value})}
                    required
                    InputLabelProps={{
                      shrink: true,
                    }}
                    dir="rtl"
                    inputProps={{
                      id: 'time-input'
                    }}
                  />
                  
                  <Button 
                    fullWidth 
                    variant="contained" 
                    type="submit"
                    size="large"
                    disabled={isSubmitting}
                    sx={{ 
                      mt: 2,
                      height: { xs: 48, sm: 56 },
                      fontSize: { xs: '1rem', sm: '1.1rem' },
                      borderRadius: { xs: 2, sm: 3 },
                      backgroundColor: '#012070',
                      boxShadow: '0 4px 12px rgba(1, 32, 112, 0.2)',
                      '&:hover': {
                        backgroundColor: '#012070',
                        boxShadow: '0 6px 16px rgba(1, 32, 112, 0.3)',
                      },
                      '&:disabled': {
                        backgroundColor: '#012070',
                        color: '#ffffff',
                        opacity: 0.7,
                      }
                    }}
                  >
                    {isSubmitting ? 'جاري إرسال الحجز...' : 'تأكيد الحجز'}
                  </Button>
                </Stack>
              </form>
            )}
          </Stack>
        </StyledPaper>
      </StyledContainer>
    </PageWrapper>
  );
};

export default BookingForm; 