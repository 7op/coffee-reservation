import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Stack,
  Typography,
  IconButton,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  styled,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Avatar,
  LinearProgress,
  Menu,
  ListItemIcon,
  ListItemText,
  Switch,
  Divider,
  Checkbox,
  CircularProgress,
  Backdrop,
  Grid
} from '@mui/material';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { TimePicker, DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { io } from "socket.io-client";
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import DeleteIcon from '@mui/icons-material/Delete';
import EventIcon from '@mui/icons-material/Event';
import GroupIcon from '@mui/icons-material/Group';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SettingsIcon from '@mui/icons-material/Settings';
import BlockIcon from '@mui/icons-material/Block';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import { Pagination } from 'swiper/modules';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from 'react-router-dom';
import { SERVER_URL, API_ENDPOINTS } from '../config';

// تصميم الصفحة الرئيسية
const PageWrapper = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  padding: theme.spacing(3),
  backgroundColor: '#f5f8fc',
  backgroundImage: `
    linear-gradient(45deg, 
      rgba(38, 135, 242, 0.05) 25%, 
      transparent 25%, 
      transparent 75%, 
      rgba(38, 135, 242, 0.05) 75%
    )
  `,
  backgroundSize: '40px 40px',
  // إضافة padding مختلف للشاشات الكبيرة
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(4, 8)
  },
  [theme.breakpoints.up('lg')]: {
    padding: theme.spacing(5, 12)
  },
  [theme.breakpoints.up('xl')]: {
    padding: theme.spacing(6, 16),
    maxWidth: '1600px',
    margin: '0 auto'
  }
}));

// تصميم ورقة البيانات
const StyledPaper = styled(Paper)(({ theme }) => ({
  position: 'relative',
  padding: theme.spacing(3),
  borderRadius: 16,
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 8px 32px rgba(31, 54, 92, 0.15)',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'linear-gradient(45deg, #2687f2 70%, #4a9cf4 90%)',
  },
}));

// تعديل تنسيق خلية الجدول
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontFamily: 'Tajawal, sans-serif',
  color: theme.palette.text.primary,
  borderColor: 'rgba(31, 54, 92, 0.1)',
  padding: theme.spacing(2),
  textAlign: 'center',  // توسيط النص
}));

// تصميم صف الجدول
const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: 'rgba(38, 135, 242, 0.02)',
  },
  '&:hover': {
    backgroundColor: 'rgba(38, 135, 242, 0.05)',
  },
}));

// تعديل commonInputStyles
const commonInputStyles = {
  '& .MuiInputBase-root': {
    height: '45px',
    '&.Mui-focused': {
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: theme => theme.palette.primary.main,
        borderWidth: '2px'
      },
      '& .MuiInputLabel-root, & .MuiInputAdornment-root .MuiSvgIcon-root': {
        color: theme => theme.palette.primary.main
      }
    }
  },
  '& .MuiInputLabel-root': {
    transform: 'translate(14px, 12px) scale(1)',
    fontFamily: 'Tajawal, sans-serif',
    '&.MuiInputLabel-shrink': {
      transform: 'translate(14px, -9px) scale(0.75)',
      backgroundColor: 'white',
      padding: '0 8px',
      marginLeft: '-4px'
    }
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s ease-in-out'
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(0, 0, 0, 0.3)'
  },
  '& .MuiInputAdornment-root': {
    marginLeft: '8px',
    marginRight: '8px',
    '& .MuiSvgIcon-root': {
      color: 'rgba(0, 0, 0, 0.54)',
      transition: 'all 0.2s ease-in-out'
    }
  }
};

// تحديث التنسيق المشترك للـ TimePicker
const timePickerCommonProps = {
  textField: {
    fullWidth: true,
    size: "small",
    sx: commonInputStyles
  },
  popper: {
    sx: {
      '& .MuiPickersLayout-root': {
        height: 'auto !important',
        minHeight: 'auto !important',
        maxHeight: 'none !important'
      },
      '& .MuiClock-root': {
        margin: '0 !important',
        padding: '0 !important',
        height: 'auto !important',
        minHeight: 'auto !important',
        maxHeight: 'none !important'
      },
      '& .MuiClock-clock': {
        margin: '8px 0 0 0 !important',
        height: '200px !important',
        minHeight: '200px !important',
        maxHeight: '200px !important'
      },
      '& .MuiList-root': {
        '&::-webkit-scrollbar': {
          display: 'none'
        },
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        '&::-webkit-scrollbar-track': {
          display: 'none'
        },
        '&::-webkit-scrollbar-thumb': {
          display: 'none'
        }
      },
      '& .muirtl-14prqje-MuiList-root-MuiMultiSectionDigitalClockSection-root:after': {
        display: 'none !important',
        height: '0 !important'
      },
      '& .MuiPickersLayout-actionBar': {
        gridColumn: '2 !important',
        padding: '0 !important',
        margin: '0 !important',
        width: '100% !important'
      },
      '& .MuiDialogActions-root': {
        alignItems: 'center !important',
        justifyContent: 'center !important',
        width: '100% !important',
        padding: '0 !important'
      },
      '& .MuiDialogActions-root > button': {
        width: '100% !important',
        margin: '0 !important',
        borderRadius: '4px !important'
      }
    }
  }
};

// تحديث تنسيق DatePicker
const StyledDatePicker = styled(DatePicker)(({ theme }) => ({
  ...commonInputStyles,
  '& .MuiInputAdornment-root': {
    marginLeft: '8px',
    marginRight: '8px',
    '& .MuiSvgIcon-root': {
      color: 'rgba(0, 0, 0, 0.54)',  // لون رمادي افتراضي
      transition: 'all 0.2s ease-in-out'
    }
  },
  // عند فتح الكالندر
  '&.MuiPickersPopper-root .MuiSvgIcon-root, &.Mui-focused .MuiSvgIcon-root': {
    color: theme.palette.primary.main  // تغيير اللون إلى الأزرق عند الفتح
  }
}));

// تعديل تنسيق StyledTextField
const StyledTextField = styled(TextField)(({ theme }) => ({
  ...commonInputStyles,
  '& .MuiInputAdornment-root': {
    marginLeft: '8px',
    marginRight: '8px',
    '& .MuiSvgIcon-root': {
      color: theme.palette.primary.main,
      transition: 'all 0.2s ease-in-out'
    }
  },
  // إضافة تنسيقات جديدة
  '&.MuiFormControl-root': {
    marginTop: '20px !important',  // تعديل المسافة العلوية
    [theme.breakpoints.up('sm')]: {
      marginTop: '0 !important'  // إزالة المسافة في الشاشات الكبيرة
    }
  }
}));

// إضافة تصميم مربع الإحصائيات مع انيميشن
const StyledStatBox = styled(Paper)(({ theme, index }) => ({
  padding: theme.spacing(3),
  borderRadius: 16,
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 8px 32px rgba(31, 54, 92, 0.08)',
  border: '1px solid rgba(31, 54, 92, 0.05)',
  flex: 1,
  animation: 'fadeInUp 0.6s ease forwards',
  animationDelay: `${0.1 + (index * 0.1)}s`,
  opacity: 0,

  '@keyframes fadeInUp': {
    '0%': {
      opacity: 0,
      transform: 'translateY(20px)'
    },
    '100%': {
      opacity: 1,
      transform: 'translateY(0)'
    }
  }
}));

// إضافة انيميشن لقسم البحث
const AnimatedSearchBox = styled(StyledPaper)(({ theme }) => ({
  animation: 'fadeInUp 0.6s ease forwards',
  animationDelay: '0.5s',
  opacity: 0,
}));

// إضافة انيميشن للجدول
const AnimatedTableBox = styled(StyledPaper)(({ theme }) => ({
  animation: 'fadeInUp 0.6s ease forwards',
  animationDelay: '0.7s',
  opacity: 0,
}));

// إضافة دالة حساب الإحصائيات
const getStatistics = (bookings) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // الحجوزات اليومية
  const todayBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.createdAt);
    bookingDate.setHours(0, 0, 0, 0);
    return bookingDate.getTime() === today.getTime();
  });

  // عدد الأشخاص اليوم
  const todayGuests = todayBookings.reduce((sum, booking) => sum + (booking.guests || 0), 0);

  // متوسط الحجوزات اليومي (آخر 7 أيام)
  const last7Days = bookings.filter(booking => {
    const bookingDate = new Date(booking.createdAt);
    const diffTime = Math.abs(today - bookingDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  });
  const averageBookings = Math.round(last7Days.length / 7);

  // تحسين حساب الوقت الأكثر حجزاً (بالساعات فقط)
  const timeCount = {};
  let maxCount = 0;
  let mostBookedTime = '';

  bookings.forEach(booking => {
    if (booking.time) {
      // استخراج الساعة فقط من الوقت
      const hour = booking.time.split(':')[0];
      const period = parseInt(hour) >= 12 ? 'م' : 'ص';
      const displayHour = parseInt(hour) > 12 ? parseInt(hour) - 12 : (parseInt(hour) === 0 ? 12 : parseInt(hour));
      const timeKey = `${displayHour} ${period}`;
      
      timeCount[timeKey] = (timeCount[timeKey] || 0) + 1;

      // تحديث الوقت الأكثر تكراراً
      if (timeCount[timeKey] > maxCount) {
        maxCount = timeCount[timeKey];
        mostBookedTime = timeKey;
      }
    }
  });

  // حساب النسبة المئوية للوقت الأكثر حجزاً
  const totalBookings = bookings.length;
  const progressPercentage = totalBookings > 0 ? (maxCount / totalBookings) * 100 : 0;

  // حساب النسب المئوية للتقدم
  const maxDailyBookings = 50; // افتراضي
  const maxDailyGuests = 200; // افتراضي
  const maxAverageBookings = 30; // افتراضي

  // تغيير المتوسط اليومي إلى عدد الحجوزات الكلي
  const totalBookingsObj = {
    count: bookings.length,
    progress: (bookings.length / 200) * 100  // افتراض أن 200 هو الحد الأقصى
  };

  return {
    todayBookings: {
      count: todayBookings.length,
      progress: (todayBookings.length / maxDailyBookings) * 100
    },
    todayGuests: {
      count: todayGuests,
      progress: (todayGuests / maxDailyGuests) * 100
    },
    totalBookings: totalBookingsObj,  // تغيير من averageBookings إلى totalBookings
    mostBookedTime: {
      time: mostBookedTime,
      count: maxCount,
      progress: progressPercentage
    }
  };
};

// إضافة مكون جديد للأيقونة المتحركة
const RotatingIcon = styled(RestartAltIcon)(({ isrotating }) => ({
  animation: isrotating === 'true' ? 'rotateIcon 0.6s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
  '@keyframes rotateIcon': {
    '0%': {
      transform: 'rotate(0deg)'
    },
    '100%': {
      transform: 'rotate(-720deg)'  // تغيير إلى قيمة سالبة للدوران عكس عقارب الساعة
    }
  }
}));

// إضافة مكون الهيدر (يجب إضافته بعد التعريفات الأخرى في الملف)
const StyledHeader = styled('header')(({ theme, scrolled }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 1000,
  padding: theme.spacing(2, 3),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  margin: 0,
  borderRadius: 0,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  background: scrolled 
    ? 'rgba(255, 255, 255, 0.95)'
    : 'rgba(255, 255, 255, 0.8)',
  backdropFilter: 'blur(10px)',
  boxShadow: scrolled 
    ? '0 4px 20px rgba(31, 54, 92, 0.1)'
    : 'none',
  transform: `translateY(${scrolled ? '0' : '-1px'})`,
  
  // إضافة انيميشن الظهور
  animation: 'slideDown 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
  
  '@keyframes slideDown': {
    '0%': {
      transform: 'translateY(-100%)',
      opacity: 0
    },
    '100%': {
      transform: 'translateY(0)',
      opacity: 1
    }
  },
  
  ...(scrolled && {
    margin: '10px',
    borderRadius: '30px',
    width: 'calc(100% - 20px)'
  }),

  '&::before': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(31, 54, 92, 0.1), transparent)',
    opacity: scrolled ? 1 : 0,
    transition: 'opacity 0.3s ease'
  }
}));

// تحديث تصميم حاوية اللوغو والعنوان
const LogoContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '15px',
  transition: 'transform 0.3s ease',
  animation: 'fadeIn 0.8s ease forwards',
  '@keyframes fadeIn': {
    '0%': {
      transform: 'translateY(20px)',
      opacity: 0
    },
    '100%': {
      transform: 'translateY(0)',
      opacity: 1
    }
  }
});

// إضافة مكون جديد للعنوان
const TitleContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    left: 0,
    bottom: -4,
    width: '100%',
    height: '2px',
    background: 'linear-gradient(90deg, #2687f2 30%, rgba(38, 135, 242, 0.2))',
    transition: 'opacity 0.3s ease',
    opacity: 0.7
  },
  '&:hover::after': {
    opacity: 1
  }
}));

// إضافة دالة لتنسيق الوقت
const formatTime = (time) => {
  if (!time) return '';
  
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  
  // تحديد ص أو م
  const period = hour >= 12 ? 'م' : 'ص';
  
  // تحويل الساعة إلى نظام 12 ساعة
  const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
  
  return `${displayHour}:${minutes} ${period}`;
};

// دالة لحساب يوم رمضان
const getRamadanDay = () => {
  const today = new Date();
  const ramadanStart = new Date('2024-03-11');
  const ramadanEnd = new Date('2024-04-09');
  const eidEnd = new Date('2024-04-15');
  const nextRamadanStart = new Date('2025-03-01');
  
  today.setHours(0, 0, 0, 0);
  ramadanStart.setHours(0, 0, 0, 0);
  ramadanEnd.setHours(0, 0, 0, 0);
  eidEnd.setHours(0, 0, 0, 0);
  nextRamadanStart.setHours(0, 0, 0, 0);
  
  const diffFromStart = Math.floor((ramadanStart - today) / (1000 * 60 * 60 * 24));
  const dayOfRamadan = Math.floor((today - ramadanStart) / (1000 * 60 * 60 * 24)) + 1;
  const diffToNextRamadan = Math.floor((nextRamadanStart - today) / (1000 * 60 * 60 * 24));
  
  if (today < ramadanStart) {
    return `-${diffFromStart}`;
  } else if (today >= ramadanStart && today <= ramadanEnd) {
    return dayOfRamadan;
  } else if (today > ramadanEnd && today <= eidEnd) {
    return 'عيدكم مبارك';
  } else {
    return `-${diffToNextRamadan}`;
  }
};

const AdminDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState(null);
  const [timeRange, setTimeRange] = useState({
    start: null,
    end: null
  });
  const audioRef = useRef(new Audio('/notification.mp3'));
  const previousBookingsLength = useRef(0);
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('soundEnabled');
    return saved ? JSON.parse(saved) : false;
  });
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    multiple: false,
    bookingId: null
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const [bookingEnabled, setBookingEnabled] = useState(true);
  const [selectedBookings, setSelectedBookings] = useState([]);
  const navigate = useNavigate();
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [maxDailyBookings, setMaxDailyBookings] = useState(() => {
    const saved = localStorage.getItem('maxDailyBookings');
    return saved ? parseInt(saved) : 50;  // القيمة الافتراضية 50
  });
  const [maxGuestsPerBooking, setMaxGuestsPerBooking] = useState(() => {
    const saved = localStorage.getItem('maxGuestsPerBooking');
    return saved ? parseInt(saved) : 10;  // القيمة الافتراضية 10
  });
  // في بداية المكون AdminDashboard أضف مرجعاً للحقل
  const searchInputRef = useRef(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    audioRef.current = new Audio('/notification.mp3');
    audioRef.current.volume = 0.5;
    audioRef.current.load();
  }, []);

  useEffect(() => {
    const socket = io(SERVER_URL, {
      transports: ['websocket'],
      upgrade: false
    });

    const fetchBookings = async () => {
      try {
        const response = await fetch(`${SERVER_URL}/api/bookings`);
        const data = await response.json();
        
        if (data.length > previousBookingsLength.current && isSoundEnabled) {
          try {
            audioRef.current.currentTime = 0;
            await audioRef.current.play();
          } catch (error) {
            console.error('Error playing sound:', error);
          }
        }
        
        setBookings(data);
        setFilteredBookings(data);
        previousBookingsLength.current = data.length;
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchBookings();
    socket.on('bookingUpdated', fetchBookings);

    return () => {
      socket.off('bookingUpdated');
      socket.disconnect();
    };
  }, [isSoundEnabled]);

  useEffect(() => {
    let result = [...bookings];

    // تطبيق البحث
    if (searchTerm) {
      result = result.filter(booking => 
        booking.name.includes(searchTerm) || 
        booking.phone.includes(searchTerm)
      );
    }

    // تطبيق فلتر التاريخ
    if (dateFilter && dateFilter !== 'all') {
      const filterDate = new Date(dateFilter);
      result = result.filter(booking => {
        const bookingDate = new Date(booking.createdAt);
        return (
          bookingDate.getDate() === filterDate.getDate() &&
          bookingDate.getMonth() === filterDate.getMonth() &&
          bookingDate.getFullYear() === filterDate.getFullYear()
        );
      });
    }

    // تطبيق فلتر نطاق الوقت
    if (timeRange.start && timeRange.end) {
      result = result.filter(booking => {
        if (!booking.time) return false;

        // تحويل الأوقات إلى دقائق للمقارنة
        const bookingMinutes = convertTimeToMinutes(booking.time);
        const startMinutes = convertTimeToMinutes(timeRange.start);
        const endMinutes = convertTimeToMinutes(timeRange.end);

        return bookingMinutes >= startMinutes && bookingMinutes <= endMinutes;
      });
    }

    setFilteredBookings(result);
  }, [searchTerm, dateFilter, timeRange, bookings]);

  // دالة مساعدة لتحويل الوقت إلى دقائق
  const convertTimeToMinutes = (time) => {
    if (typeof time === 'string') {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    }
    return time.getHours() * 60 + time.getMinutes();
  };

  useEffect(() => {
    const fetchBookingStatus = async () => {
      try {
        const response = await fetch(`${SERVER_URL}/api/settings/booking`);
        if (!response.ok) {
          throw new Error('فشل في جلب حالة الحجز');
        }
        const data = await response.json();
        setBookingEnabled(data.enabled);
      } catch (error) {
        console.error('Error fetching booking status:', error);
      }
    };

    fetchBookingStatus();

    // الاستماع لتحديثات الإعدادات
    const socket = io(SERVER_URL, {
      transports: ['websocket'],
      upgrade: false
    });

    socket.on('settingsUpdated', (data) => {
      if (data.bookingEnabled !== undefined) {
        setBookingEnabled(data.bookingEnabled);
      }
    });

    return () => {
      socket.off('settingsUpdated');
      socket.disconnect();
    };
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // تعديل دالة إعادة التعيين
  const handleReset = () => {
    if (!isRotating) {
      setIsRotating(true);
      setSearchTerm('');
      setDateFilter(null);
      setTimeRange({ start: null, end: null });
      
      setTimeout(() => {
        setIsRotating(false);
      }, 600); // نفس مدة الأنيميشن
    }
  };

  // تحديث دالة تبديل الصوت
  const toggleSound = async () => {
    const newState = !isSoundEnabled;
    setIsSoundEnabled(newState);
    localStorage.setItem('soundEnabled', JSON.stringify(newState));
    
    if (newState) {
      try {
        audioRef.current.currentTime = 0;
        await audioRef.current.play();
      } catch (error) {
        console.error('Error playing test sound:', error);
      }
    }
  };

  // دالة فتح مربع حوار التأكيد
  const openDeleteConfirm = (bookingId) => {
    setDeleteConfirm({ open: true, multiple: false, bookingId });
  };

  // دالة إغلاق مربع حوار التأكيد
  const closeDeleteConfirm = () => {
    setDeleteConfirm({ open: false, multiple: false, bookingId: null });
  };

  // دالة الحذف المحسنة
  const handleDeleteSelected = () => {
    if (selectedBookings.length === 0) return;
    
    setDeleteConfirm({
      open: true,
      multiple: true,
      bookingId: null
    });
  };

  const handleDelete = async () => {
    setIsDeleting(true); // بدء التحميل قبل إغلاق مربع الحوار
    closeDeleteConfirm(); // إغلاق مربع الحوار مباشرة

    try {
      if (deleteConfirm.multiple) {
        // حذف متعدد
        const deletePromises = selectedBookings.map(id => 
          fetch(`${SERVER_URL}/api/bookings/${id}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json'
            }
          })
        );
        
        await Promise.all(deletePromises); // انتظار اكتمال جميع عمليات الحذف
        setSelectedBookings([]);
      } else {
        // حذف واحد
        await fetch(`${SERVER_URL}/api/bookings/${deleteConfirm.bookingId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        setSelectedBookings(prev => prev.filter(id => id !== deleteConfirm.bookingId));
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
    } finally {
      setIsDeleting(false); // إنهاء التحميل
    }
  };

  // دالة تحديد/إلغاء تحديد كل الحجوزات
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedBookings(filteredBookings.map(booking => booking._id));
    } else {
      setSelectedBookings([]);
    }
  };

  // دالة تحديد/إلغاء تحديد حجز واحد
  const handleSelectOne = (bookingId) => {
    setSelectedBookings(prev => {
      if (prev.includes(bookingId)) {
        return prev.filter(id => id !== bookingId);
      } else {
        return [...prev, bookingId];
      }
    });
  };

  // حساب الإحصائيات
  const stats = getStatistics(bookings);

  // دالة فتح قائمة الإعدادات
  const handleSettingsClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // دالة إغلاق قائمة الإعدادات
  const handleClose = () => {
    setAnchorEl(null);
  };

  // دالة تغيير حالة الحجز
  const handleBookingToggle = async () => {
    try {
      handleClose();
      const newState = !bookingEnabled;
      
      const response = await fetch(`${SERVER_URL}/api/settings/booking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ enabled: newState })
      });

      if (!response.ok) {
        throw new Error('فشل في تحديث الإعدادات');
      }

      const data = await response.json();
      if (data.success) {
        setBookingEnabled(newState);
        alert(newState ? 'تم فتح الحجز بنجاح' : 'تم إغلاق الحجز بنجاح');
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert('حدث خطأ أثناء تحديث الإعدادات');
    }
  };

  const calculateTotalGuests = (bookings) => {
    return bookings.reduce((total, booking) => {
      // تحويل عدد الأشخاص إلى رقم باستخدام parseInt
      const guests = parseInt(booking.guests) || 0;
      return total + guests;
    }, 0);
  };

  // تعديل دالة تسجيل الخروج
  const handleLogout = () => {
    setLogoutConfirm(true); // فتح نافذة التأكيد
  };

  // دالة تأكيد تسجيل الخروج
  const confirmLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/login');
  };

  // مراقبة السكرول
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // تعديل useEffect لمراقبة عدد الحجوزات اليومية
  useEffect(() => {
    const todayBookings = bookings.filter(booking => {
      const bookingDate = new Date(booking.createdAt);
      const today = new Date();
      return bookingDate.toDateString() === today.toDateString();
    });

    // إيقاف الحجز تلقائياً فقط إذا كان عدد الحجوزات اليوم يساوي أو أكبر من الحد الأقصى
    if (todayBookings.length > 0 && 
        todayBookings.length >= maxDailyBookings && 
        bookingEnabled) {
      
      // تأخير إغلاق الحجز لمدة 11 ثواني (10 ثواني لرسالة النجاح + 1 ثانية إضافية)
      setTimeout(async () => {
        const updateBookingStatus = async () => {
          try {
            const response = await fetch(`${SERVER_URL}/api/settings/booking`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ enabled: false })
            });

            if (!response.ok) {
              throw new Error('فشل في تحديث الإعدادات');
            }

            const data = await response.json();
            if (data.success) {
              setBookingEnabled(false);
              alert('تم إيقاف الحجز تلقائياً لاكتمال العدد المسموح به');
            }
          } catch (error) {
            console.error('Error updating booking status:', error);
          }
        };

        updateBookingStatus();
      }, 10000); // تأخير 11 ثواني
    }
  }, [bookings]);

  // دالة لتحديث الحد الأقصى
  const handleMaxBookingsChange = (event) => {
    const value = parseInt(event.target.value);
    setMaxDailyBookings(value);
    localStorage.setItem('maxDailyBookings', value);
    
    // إعادة تفعيل الحجز عند تغيير الحد الأقصى
    const updateBookingStatus = async () => {
      try {
        const response = await fetch(`${SERVER_URL}/api/settings/booking`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ enabled: true })
        });

        if (!response.ok) {
          throw new Error('فشل في تحديث الإعدادات');
        }

        const data = await response.json();
        if (data.success) {
          setBookingEnabled(true);
        }
      } catch (error) {
        console.error('Error updating booking status:', error);
      }
    };

    updateBookingStatus();
  };

  // دالة لتحديث الحد الأقصى لعدد الأشخاص
  const handleMaxGuestsChange = (event) => {
    const value = parseInt(event.target.value);
    setMaxGuestsPerBooking(value);
    localStorage.setItem('maxGuestsPerBooking', value);
    
    // تحديث الإعدادات في الخادم
    const updateSettings = async () => {
      try {
        const response = await fetch(`${SERVER_URL}/api/settings/maxGuests`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ maxGuests: value })
        });

        if (!response.ok) {
          throw new Error('فشل في تحديث الإعدادات');
        }
      } catch (error) {
        console.error('Error updating max guests:', error);
      }
    };

    updateSettings();
  };

  return (
    <PageWrapper>
      <StyledHeader scrolled={isScrolled}>
        <LogoContainer>
          <img 
            src="/logo.png" 
            alt="قهوة هيام"
            style={{ 
              width: isScrolled ? '38px' : '42px',
              height: 'auto',
              transition: 'all 0.3s ease',
              filter: 'drop-shadow(0 2px 4px rgba(38, 135, 242, 0.2))'
            }} 
          />
          <TitleContainer>
            <Typography 
              variant="h4" 
              sx={{ 
                color: '#1f365c', 
                fontWeight: 700,
                fontSize: { xs: '1.1rem', sm: '1.3rem' },
                letterSpacing: '0.5px',
                transition: 'all 0.3s ease',
                transform: isScrolled ? 'scale(0.95)' : 'scale(1)',
                transformOrigin: 'left'
              }}
            >
              قهوة هيام
            </Typography>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                color: 'text.secondary',
                fontSize: { xs: '0.75rem', sm: '0.85rem' },
                opacity: 0.8,
                letterSpacing: '0.5px',
                transform: isScrolled ? 'translateY(-2px)' : 'translateY(0)',
                transition: 'all 0.3s ease'
              }}
            >
              لوحة التحكم - المدير
            </Typography>
          </TitleContainer>
        </LogoContainer>

        {/* إضافة صورة رمضان في المنتصف */}
        <Box sx={{ 
          display: { xs: 'none', sm: 'flex' },  // إظهار للشاشات الأكبر من 600px
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          transition: 'all 0.3s ease'
        }}>
          <img 
            src="/ramadan.png" 
            alt="رمضان"
            style={{ 
              width: isScrolled ? '125px' : '125px',  // نفس حجم اللوغو
              height: 'auto',
              transition: 'all 0.3s ease',
              filter: 'drop-shadow(0 2px 4px rgba(38, 135, 242, 0.1))'
            }} 
          />
        </Box>

        <Stack direction="row" spacing={1}>
          <IconButton
            onClick={handleSettingsClick}
            sx={{
              bgcolor: Boolean(anchorEl) ? 'primary.main' : 'grey.300',
              color: 'white',
              '&:hover': {
                bgcolor: Boolean(anchorEl) ? 'primary.dark' : 'grey.400',
              }
            }}
          >
            <SettingsIcon />
          </IconButton>
          
          <IconButton
            onClick={toggleSound}
            sx={{
              bgcolor: isSoundEnabled ? 'primary.main' : 'grey.300',
              color: 'white',
              '&:hover': {
                bgcolor: isSoundEnabled ? 'primary.dark' : 'grey.400',
              }
            }}
          >
            {isSoundEnabled ? <NotificationsActiveIcon /> : <NotificationsOffIcon />}
          </IconButton>

          <IconButton
            onClick={handleLogout}
            sx={{
              bgcolor: logoutConfirm ? 'error.main' : 'grey.300',
              color: 'white',
              '&:hover': {
                bgcolor: logoutConfirm ? 'error.dark' : 'grey.400',
              }
            }}
          >
            <LogoutIcon />
          </IconButton>
        </Stack>
      </StyledHeader>

      {/* إضافة مسافة للمحتوى تحت الهيدر */}
      <Box sx={{ height: '80px' }} />

      {/* إضافة نافذة الإعدادات */}
      <Dialog
        open={Boolean(anchorEl)}
        onClose={handleClose}
        dir="rtl"
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 300,
            p: 2
          }
        }}
      >
        <DialogTitle sx={{ 
          p: 0, 
          mb: 2,
          color: '#1f365c',
          fontWeight: 700,
          fontSize: '1.3rem'
        }}>
          الإعدادات
        </DialogTitle>

        {/* إضافة عداد رمضان */}
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 2,
          p: 1.5,
          borderRadius: 2,
          bgcolor: 'rgba(38, 135, 242, 0.1)',
          border: '1px solid rgba(38, 135, 242, 0.2)'
        }}>
          <EventIcon sx={{ color: 'primary.main' }} />
          <Typography sx={{ 
            color: 'primary.main',
            fontWeight: 500
          }}>
            {getRamadanDay() === 'عيدكم مبارك' 
              ? getRamadanDay() 
              : `${getRamadanDay()} رمضان`
            }
          </Typography>
        </Box>

        {/* إضافة إعداد الحد الأقصى للحجوزات */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: 1,
          mb: 2,
          p: 1.5,
          borderRadius: 2,
          bgcolor: 'rgba(38, 135, 242, 0.1)',
          border: '1px solid rgba(38, 135, 242, 0.2)'
        }}>
          <Typography sx={{ color: 'text.secondary', mb: 1 }}>
            الحد الأقصى للحجوزات اليومية
          </Typography>
          <TextField
            type="number"
            value={maxDailyBookings}
            onChange={handleMaxBookingsChange}
            size="small"
            InputProps={{
              inputProps: { min: 1 },
              endAdornment: (
                <InputAdornment position="end">
                  <Typography sx={{ color: 'text.secondary' }}>حجز</Typography>
                </InputAdornment>
              )
            }}
          />
        </Box>

        {/* إضافة إعداد الحد الأقصى لعدد الأشخاص */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: 1,
          mb: 2,
          p: 1.5,
          borderRadius: 2,
          bgcolor: 'rgba(46, 125, 50, 0.1)',
          border: '1px solid rgba(46, 125, 50, 0.2)'
        }}>
          <Typography sx={{ color: 'text.secondary', mb: 1 }}>
            الحد الأقصى لعدد الأشخاص في الحجز الواحد
          </Typography>
          <TextField
            type="number"
            value={maxGuestsPerBooking}
            onChange={handleMaxGuestsChange}
            size="small"
            InputProps={{
              inputProps: { min: 1 },
              endAdornment: (
                <InputAdornment position="end">
                  <Typography sx={{ color: 'text.secondary' }}>شخص</Typography>
                </InputAdornment>
              )
            }}
          />
          <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5 }}>
            سيتم تطبيق هذا الحد على جميع الحجوزات الجديدة
          </Typography>
        </Box>

        {/* إعدادات السماح بالحجز */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BlockIcon color={bookingEnabled ? 'disabled' : 'error'} />
            <Typography>السماح بالحجز</Typography>
          </Box>
          <Switch
            checked={bookingEnabled}
            onChange={handleBookingToggle}
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': {
                color: 'primary.main',
              },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                backgroundColor: 'primary.main',
              },
            }}
          />
        </Box>

        <DialogActions sx={{ 
          p: 0, 
          mt: 2,
          display: 'flex',
          justifyContent: 'center'
        }}>
          <Button 
            onClick={handleClose} 
            fullWidth
            variant="contained"
            sx={{ 
              color: 'white',
              bgcolor: 'success.main',  // تغيير اللون إلى أخضر
              '&:hover': {
                bgcolor: 'success.dark',
              },
              maxWidth: '200px',
              height: '40px',
              fontSize: '1rem'
            }}
          >
            حفظ الإعدادات
          </Button>
        </DialogActions>
      </Dialog>

      <Stack spacing={5} sx={{
        '& > :not(style) ~ :not(style)': {
          marginTop: '25px !important'
        }
      }}>
        {/* مربعات الإحصائيات */}
        <Box sx={{ display: 'block' }}>
          <Box sx={{ mx: -2 }}>
            <Swiper
              modules={[Pagination]}
              pagination={{ clickable: true }}
              spaceBetween={16}
              slidesPerView={1}
              breakpoints={{
                // عند 600px وأكبر
                600: {
                  slidesPerView: 2,
                  spaceBetween: 16,
                },
                // عند 900px وأكبر
                900: {
                  slidesPerView: 3,
                  spaceBetween: 16,
                },
                // عند 1200px وأكبر
                1200: {
                  slidesPerView: 4,
                  spaceBetween: 16,
                },
              }}
              style={{ 
                padding: '20px 16px 20px',
                width: '100%'
              }}
            >
              {/* حجز اليوم */}
              <SwiperSlide>
                <StyledStatBox index={0}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h3" sx={{ color: '#1f365c', fontWeight: 700 }}>
                        {stats.todayBookings.count}
                      </Typography>
                      <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                        حجز اليوم
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'primary.light', p: 1 }}>
                      <EventIcon />
                    </Avatar>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min(stats.todayBookings.progress, 100)} 
                    sx={{ mt: 2, height: 6, borderRadius: 3, bgcolor: 'primary.lighter',
                      '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: 'primary.main' }
                    }} 
                  />
                </StyledStatBox>
              </SwiperSlide>

              {/* عدد الحجوزات */}
              <SwiperSlide>
                <StyledStatBox index={1}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h3" sx={{ color: '#ed6c02', fontWeight: 700 }}>
                        {filteredBookings.length}
                      </Typography>
                      <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                        عدد الحجوزات
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'warning.light', p: 1 }}>
                      <ShowChartIcon />
                    </Avatar>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min((filteredBookings.length / 200) * 100, 100)}
                    sx={{ mt: 2, height: 6, borderRadius: 3, bgcolor: 'warning.lighter',
                      '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: 'warning.main' }
                    }} 
                  />
                </StyledStatBox>
              </SwiperSlide>

              {/* عدد الأشخاص */}
              <SwiperSlide>
                <StyledStatBox index={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h3" sx={{ color: '#2e7d32', fontWeight: 700 }}>
                        {calculateTotalGuests(filteredBookings)}
                      </Typography>
                      <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                        عدد الأشخاص
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'success.light', p: 1 }}>
                      <GroupIcon />
                    </Avatar>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min(stats.todayGuests.progress, 100)} 
                    sx={{ mt: 2, height: 6, borderRadius: 3, bgcolor: 'success.lighter',
                      '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: 'success.main' }
                    }} 
                  />
                </StyledStatBox>
              </SwiperSlide>

              {/* الوقت الأكثر حجزاً */}
              <SwiperSlide>
                <StyledStatBox index={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h3" sx={{ color: '#9c27b0', fontWeight: 700 }}>
                        {stats.mostBookedTime.time}
                      </Typography>
                      <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                        الوقت الأكثر حجزاً
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'secondary.light', p: 1 }}>
                      <AccessTimeIcon />
                    </Avatar>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min(stats.mostBookedTime.progress, 100)} 
                    sx={{ mt: 2, height: 6, borderRadius: 3, bgcolor: 'secondary.lighter',
                      '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: 'secondary.main' }
                    }} 
                  />
                </StyledStatBox>
              </SwiperSlide>
            </Swiper>
          </Box>
        </Box>

        {/* قسم البحث والفلترة */}
        <AnimatedSearchBox>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ar}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5}>
              <StyledTextField
                fullWidth
                size="small"
                label="الاسم أو رقم الجوال"
                placeholder="ابحث بالاسم أو رقم الجوال..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                inputRef={searchInputRef}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton 
                        onClick={() => searchInputRef.current?.focus()}
                        edge="end"
                        sx={{
                          color: 'rgba(0, 0, 0, 0.54) !important', // إضافة !important لتجاوز أي أنماط أخرى
                          transition: 'color 0.2s',
                          '&:hover': {
                            backgroundColor: 'rgba(38, 135, 242, 0.04)',
                          },
                          '& .MuiSvgIcon-root': {
                            color: 'rgba(0, 0, 0, 0.54) !important', // تحديد لون الأيقونة بشكل مباشر
                          }
                        }}
                      >
                        <SearchIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{ 
                  flex: 2,
                  '& .MuiOutlinedInput-root.Mui-focused .MuiIconButton-root': {
                    '& .MuiSvgIcon-root': {
                      color: '#2687f2 !important', // تصحيح صيغة اللون بإزالة الأقواس المربعة
                    }
                  }
                }}
              />

              <StyledDatePicker
                label="التاريخ"
                value={dateFilter}
                onChange={(newValue) => setDateFilter(newValue)}
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                    sx: { 
                      ...commonInputStyles,
                      flex: 1,
                      maxWidth: { xs: '100%', sm: '200px' }
                    }
                  },
                  popper: {
                    sx: {
                      '& .MuiPaper-root': {
                        mt: 1,
                        boxShadow: '0 8px 32px rgba(31, 54, 92, 0.15)',
                        borderRadius: '16px',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        bgcolor: 'white',
                        overflow: 'hidden'
                      },
                      '& .MuiPickersLayout-root': {
                        bgcolor: 'white',
                        borderRadius: '16px',
                        '& .MuiPickersCalendarHeader-root': {
                       
                          '& .MuiPickersArrowSwitcher-root': {
                            direction: 'ltr'
                          },
                          '& .MuiPickersArrowSwitcher-spacer': {
                            width: '20px'
                          }
                        }
                      },
                      '& .MuiDayCalendar-weekDayLabel': {
                        color: '#1f365c',
                        fontWeight: 600
                      },
                      '& .MuiPickersDay-root': {
                        fontFamily: 'Tajawal, sans-serif',
                        '&.Mui-selected': {
                          bgcolor: 'primary.main',
                          '&:hover': {
                            bgcolor: 'primary.dark'
                          }
                        }
                      }
                    }
                  }
                }}
                format="dd/MM/yyyy"
              />

              <Stack 
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5} 
                sx={{ 
                  flex: 2,
                  alignItems: { xs: 'stretch', sm: 'center' }
                }}
              >
                <TimePicker
                  label="من"
                  value={timeRange.start}
                  onChange={(newValue) => setTimeRange(prev => ({ ...prev, start: newValue }))}
                  slotProps={{
                    ...timePickerCommonProps,
                    textField: {
                      ...timePickerCommonProps.textField,
                      fullWidth: true
                    }
                  }}
                  ampm
                  ampmText={{ am: 'ص', pm: 'م' }}
                  minutesStep={1}
                  views={['hours', 'minutes']}
                />
                <Typography sx={{ 
                  mx: 1,
                  display: { xs: 'none', sm: 'block' }
                }}>
                  إلى
                </Typography>
                <TimePicker
                  label="إلى"
                  value={timeRange.end}
                  onChange={(newValue) => setTimeRange(prev => ({ ...prev, end: newValue }))}
                  slotProps={{
                    ...timePickerCommonProps,
                    textField: {
                      ...timePickerCommonProps.textField,
                      fullWidth: true
                    }
                  }}
                  ampm
                  ampmText={{ am: 'ص', pm: 'م' }}
                  minutesStep={1}
                  views={['hours', 'minutes']}
                />
              </Stack>

              <Button 
                onClick={handleReset}
                variant="contained"
                startIcon={<RotatingIcon isrotating={isRotating.toString()} />}
                sx={{ 
                  display: { xs: 'flex', sm: 'none' },
                  bgcolor: 'primary.light',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.main',
                  },
                  width: '100%',
                  height: 45
                }}
              >
                إعادة التعيين
              </Button>

              <IconButton 
                onClick={handleReset}
                sx={{ 
                  display: { xs: 'none', sm: 'flex' },
                  bgcolor: 'primary.light',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.main',
                  },
                  width: 45,
                  height: 45
                }}
              >
                <RotatingIcon isrotating={isRotating.toString()} />
              </IconButton>
            </Stack>
          </LocalizationProvider>
        </AnimatedSearchBox>

        {/* قسم الجدول */}
        <AnimatedTableBox>
          <TableContainer>
            <Table sx={{ 
              '& .MuiTableCell-root': { 
                textAlign: 'center'
              },
              '& .MuiTableCell-head': {
                fontWeight: 700
              }
            }}>
              <TableHead>
                <TableRow>
                  <StyledTableCell padding="checkbox" align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Checkbox
                        checked={selectedBookings.length === filteredBookings.length}
                        indeterminate={
                          selectedBookings.length > 0 && 
                          selectedBookings.length < filteredBookings.length
                        }
                        onChange={handleSelectAll}
                      />
                    </Box>
                  </StyledTableCell>
                  <StyledTableCell>الرقم</StyledTableCell>
                  <StyledTableCell>الاسم</StyledTableCell>
                  <StyledTableCell>الجوال</StyledTableCell>
                  <StyledTableCell>الأشخاص</StyledTableCell>
                  <StyledTableCell>يوم الحضور</StyledTableCell>
                  <StyledTableCell>وقت الحضور</StyledTableCell>
                  <StyledTableCell>تاريخ ووقت الحجز</StyledTableCell>
                  <StyledTableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<DeleteIcon />}
                      onClick={handleDeleteSelected}
                      disabled={selectedBookings.length === 0}
                      sx={{
                        borderColor: 'error.light',
                        color: 'error.light',
                        '&:hover': {
                          backgroundColor: 'error.lighter',
                          borderColor: 'error.main',
                          color: 'error.main',
                        },
                        fontSize: '0.875rem',
                        height: 36,
                        minWidth: 'auto',
                        px: 2,
                        '&.Mui-disabled': {
                          borderColor: 'grey.300',
                          color: 'grey.400'
                        }
                      }}
                    >
                      {selectedBookings.length > 0 && `(${selectedBookings.length})`}
                    </Button>
                  </StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredBookings
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((booking, index) => (
                    <StyledTableRow key={booking._id}>
                      <StyledTableCell padding="checkbox" align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <Checkbox
                            checked={selectedBookings.includes(booking._id)}
                            onChange={() => handleSelectOne(booking._id)}
                          />
                        </Box>
                      </StyledTableCell>
                      <StyledTableCell>
                        {page * rowsPerPage + index + 1}
                      </StyledTableCell>
                      <StyledTableCell>{booking.name}</StyledTableCell>
                      <StyledTableCell>{booking.phone}</StyledTableCell>
                      <StyledTableCell>{booking.guests}</StyledTableCell>
                      <StyledTableCell>{booking.day}</StyledTableCell>
                      <StyledTableCell>{formatTime(booking.time)}</StyledTableCell>
                      <StyledTableCell>
                        {booking.createdAt ? 
                          format(new Date(booking.createdAt), 'dd/MM/yyyy HH:mm', { locale: ar })
                          : 'غير محدد'
                        }
                      </StyledTableCell>
                      <StyledTableCell>
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <IconButton
                            onClick={() => openDeleteConfirm(booking._id)}
                            sx={{
                              color: 'error.light',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                color: 'error.main',
                                transform: 'scale(1.1) rotate(10deg)',
                              },
                              '&:active': {
                                transform: 'scale(0.95) rotate(-10deg)',
                              }
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </StyledTableCell>
                    </StyledTableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={filteredBookings.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="العدد"
            labelDisplayedRows={({ from, to, count }) => 
              `${from}-${to} من ${count !== -1 ? count : `أكثر من ${to}`}`
            }
            sx={{
              '.MuiToolbar-root': {
                paddingRight: '0 !important',
                paddingLeft: '0 !important'
              }
            }}
          />
        </AnimatedTableBox>
      </Stack>

      {/* إضافة مربع حوار التأكيد */}
      <Dialog
        open={deleteConfirm.open}
        onClose={closeDeleteConfirm}
        dir="rtl"
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(31, 54, 92, 0.15)',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(45deg, #d32f2f 30%, #ef5350 90%)'
            }
          }
        }}
      >
        <DialogTitle sx={{ 
          fontSize: '1.5rem',
          fontWeight: 700,
          color: '#1f365c',
          fontFamily: 'Tajawal, sans-serif',
          pb: 1
        }}>
          تأكيد الحذف
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ 
            fontSize: '1.2rem',
            color: 'text.secondary',
            fontFamily: 'Tajawal, sans-serif',
            mb: 2
          }}>
            {deleteConfirm.multiple 
              ? `هل أنت متأكد من حذف ${selectedBookings.length} حجز؟`
              : 'هل أنت متأكد من حذف هذا الحجز؟'
            }
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{
          p: 2, 
          pt: 0,
          justifyContent: 'center',
          gap: 1
        }}>
          <Button 
            onClick={closeDeleteConfirm}
            variant="outlined"
            size="small"
            sx={{ 
              color: 'text.secondary',
              borderColor: 'divider',
              fontSize: '0.9rem',
              px: 2,
              minWidth: '70px',
              height: '32px',
              '&:hover': {
                borderColor: 'text.primary',
                backgroundColor: 'transparent'
              }
            }}
          >
            إلغاء
          </Button>
          <Button 
            onClick={handleDelete}
            variant="contained"
            size="small"
            color="error"
            sx={{ 
              fontSize: '0.9rem',
              px: 2,
              minWidth: '70px',
              height: '32px',
              background: 'linear-gradient(45deg, #d32f2f 30%, #ef5350 90%)',
              boxShadow: '0 2px 4px rgba(211, 47, 47, .2)',
              '&:hover': {
                background: 'linear-gradient(45deg, #c62828 30%, #d32f2f 90%)',
                boxShadow: '0 3px 6px rgba(211, 47, 47, .3)'
              }
            }}
          >
            حذف
          </Button>
        </DialogActions>
      </Dialog>

      {/* نافذة تأكيد تسجيل الخروج */}
      <Dialog
        open={logoutConfirm}
        onClose={() => setLogoutConfirm(false)}
        dir="rtl"
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(31, 54, 92, 0.15)',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(45deg, #d32f2f 30%, #ef5350 90%)'
            }
          }
        }}
      >
        <DialogTitle sx={{ 
          fontSize: '1.5rem',  // تعديل حجم العنوان
          fontWeight: 700,
          color: '#1f365c',
          fontFamily: 'Tajawal, sans-serif',
          pb: 1
        }}>
          تأكيد تسجيل الخروج
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ 
            fontSize: '1.2rem',  // تعديل حجم النص
            color: 'text.secondary',
            fontFamily: 'Tajawal, sans-serif',
            mb: 2
          }}>
            هل أنت متأكد من تسجيل الخروج؟
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{
          p: 2, 
          pt: 0,
          justifyContent: 'center',
          gap: 1
        }}>
          <Button 
            onClick={() => setLogoutConfirm(false)}
            variant="outlined"
            size="small"
            sx={{ 
              color: 'text.secondary',
              borderColor: 'divider',
              fontSize: '0.9rem',
              px: 2,
              minWidth: '70px',
              height: '32px',
              '&:hover': {
                borderColor: 'text.primary',
                backgroundColor: 'transparent'
              }
            }}
          >
            إلغاء
          </Button>
          <Button 
            onClick={confirmLogout}
            variant="contained"
            size="small"
            color="error"
            sx={{ 
              fontSize: '0.9rem',
              px: 2,
              minWidth: '70px',
              height: '32px',
              background: 'linear-gradient(45deg, #d32f2f 30%, #ef5350 90%)',
              boxShadow: '0 2px 4px rgba(211, 47, 47, .2)',
              '&:hover': {
                background: 'linear-gradient(45deg, #c62828 30%, #d32f2f 90%)',
                boxShadow: '0 3px 6px rgba(211, 47, 47, .3)'
              }
            }}
          >
            تأكيد
          </Button>
        </DialogActions>
      </Dialog>

      {/* إضافة Backdrop للتحميل */}
      <Backdrop
        sx={{ 
          color: '#fff', 
          zIndex: 9999, // زيادة قيمة zIndex
          flexDirection: 'column',
          gap: 2,
          backgroundColor: 'rgba(0, 0, 0, 0.8)' // زيادة التعتيم
        }}
        open={isDeleting}
      >
        <CircularProgress size={60} color="inherit" />
        <Typography variant="h6" color="inherit" sx={{ mt: 2 }}>
          جاري حذف {selectedBookings.length} حجز...
        </Typography>
      </Backdrop>
    </PageWrapper>
  );
};

export default AdminDashboard; 