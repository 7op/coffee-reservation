import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Container,
  InputAdornment,
  IconButton,
  styled
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PhoneIcon from '@mui/icons-material/Phone';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { SERVER_URL, API_ENDPOINTS } from '../config';

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
        rgba(38, 135, 242, 0.1) 0%,
        rgba(31, 54, 92, 0.1) 100%
      )
    `,
    backgroundImage: `
      radial-gradient(circle at 50% 50%, rgba(38, 135, 242, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 0% 0%, rgba(31, 54, 92, 0.05) 0%, transparent 50%),
      radial-gradient(circle at 100% 100%, rgba(74, 156, 244, 0.1) 0%, transparent 50%)
    `,
    backgroundSize: '100% 100%, 50% 50%, 75% 75%',
    backgroundRepeat: 'no-repeat',
    zIndex: -1,
  },
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
  backgroundPosition: '0 0, 20px 20px',
});

// تصميم ورقة تسجيل الدخول
const StyledPaper = styled(Paper)(({ theme }) => ({
  position: 'relative',
  padding: theme.spacing(4),
  borderRadius: 20,
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 8px 32px rgba(31, 54, 92, 0.15)',
  overflow: 'hidden',
  width: '100%',
  maxWidth: 400,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'linear-gradient(45deg, #2687f2 30%, #4a9cf4 90%)',
  },
}));

// تصميم حقول الإدخال
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
  },
  '& .MuiInputLabel-root': {
    fontFamily: 'Tajawal, sans-serif',
  },
}));

// تصميم الشعار
const Logo = styled('img')({
  width: 140,
  height: 'auto',
  marginBottom: 24,
});

const LoginPage = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // مسح الأخطاء السابقة
    
    try {
      const response = await fetch(`${SERVER_URL}${API_ENDPOINTS.login}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone, password })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'رقم الجوال أو كلمة المرور غير صحيحة');
      }

      if (data.success) {
        localStorage.setItem('isAuthenticated', 'true');
        navigate('/admin');
      }
    } catch (error) {
      setError(error.message || 'حدث خطأ في الاتصال بالخادم');
    }
  };

  return (
    <PageWrapper>
      <Container 
        maxWidth="sm" 
        sx={{ 
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <StyledPaper elevation={24}>
          <Box 
            component="form" 
            onSubmit={handleSubmit}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3
            }}
          >
            <Logo 
              src="/logo.png" 
              alt="قهوة هيام"
            />
            
            <Typography 
              variant="h4" 
              sx={{
                color: '#1f365c',
                fontWeight: 700,
                fontSize: '1.5rem',
                textAlign: 'center',
                fontFamily: 'Tajawal, sans-serif',
              }}
            >
              تسجيل الدخول للوحة التحكم
            </Typography>

            <StyledTextField
              fullWidth
              label="رقم الجوال"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon sx={{ color: 'primary.main' }} />
                  </InputAdornment>
                ),
              }}
              inputProps={{
                maxLength: 10,
                pattern: '[0-9]*'
              }}
              placeholder="05xxxxxxxx"
              dir="rtl"
            />

            <StyledTextField
              fullWidth
              label="كلمة المرور"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: 'primary.main' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              dir="rtl"
            />

            {error && (
              <Typography 
                color="error" 
                sx={{ 
                  fontSize: '0.875rem',
                  textAlign: 'center' 
                }}
              >
                {error}
              </Typography>
            )}

            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                height: 48,
                borderRadius: 3,
                fontSize: '1.1rem',
                fontWeight: 600,
                background: 'linear-gradient(45deg, #2687f2 30%, #4a9cf4 90%)',
                boxShadow: '0 3px 5px 2px rgba(38, 135, 242, .3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1976d2 30%, #2687f2 90%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 10px 2px rgba(38, 135, 242, .3)',
                },
              }}
            >
              دخول
            </Button>
          </Box>
        </StyledPaper>
      </Container>
    </PageWrapper>
  );
};

export default LoginPage; 