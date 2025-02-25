import { createTheme } from '@mui/material/styles';

export const ramadanTheme = createTheme({
  direction: 'rtl',
  palette: {
    primary: {
      main: '#2687f2', // اللون الأزرق الفاتح
      light: '#4a9cf4',
      dark: '#1c6cd2',
    },
    secondary: {
      main: '#1f365c', // اللون الأزرق الداكن
      light: '#2a4a7d',
      dark: '#152642',
    },
    background: {
      default: '#f5f8fc', // لون خلفية فاتح يتناسق مع الألوان الرئيسية
      paper: 'rgba(255, 255, 255, 0.95)',
    },
    text: {
      primary: '#1f365c',
      secondary: '#2687f2',
    },
  },
  typography: {
    fontFamily: 'Tajawal, sans-serif',
    h4: {
      fontWeight: 700,
      color: '#1f365c',
      letterSpacing: '-0.5px',
    },
    h6: {
      fontWeight: 600,
      color: '#2687f2',
    },
    subtitle1: {
      fontWeight: 500,
      color: '#1f365c',
    },
    button: {
      fontWeight: 600,
      letterSpacing: '0.5px',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '12px 28px',
          fontSize: '1.1rem',
          textTransform: 'none',
          boxShadow: '0 2px 8px rgba(38, 135, 242, 0.15)',
        },
        contained: {
          background: 'linear-gradient(45deg, #2687f2 70%, #4a9cf4 90%)',
          '&:hover': {
            background: 'linear-gradient(45deg, #1c6cd2 70%, #2687f2 90%)',
            boxShadow: '0 4px 12px rgba(38, 135, 242, 0.25)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: '#2687f2',
            },
            '&:hover fieldset': {
              borderColor: '#4a9cf4',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#1c6cd2',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#1f365c',
            '&.Mui-focused': {
              color: '#2687f2',
            },
            '&.Mui-required': {
              '& .MuiInputLabel-asterisk': {
                display: 'none'
              }
            },
            '&.MuiInputLabel-shrink': {
              background: 'rgba(255, 255, 255, 0.95)',
              padding: '0 8px',
              marginRight: -8,
              marginLeft: -8,
            }
          },
          '& .MuiFormLabel-asterisk': {
            display: 'none'
          },
          '& .MuiInputLabel-outlined': {
            transform: 'translate(14px, 16px) scale(1)',
            '&.MuiInputLabel-shrink': {
              transform: 'translate(20px, -9px) scale(0.75)',
            }
          }
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(245, 248, 252, 0.95) 100%)',
          boxShadow: '0 8px 32px rgba(31, 54, 92, 0.15)',
          '&::before': {
            background: 'linear-gradient(45deg, #2687f2 70%, #4a9cf4 90%)',
          },
        },
      },
    },
  },
}); 