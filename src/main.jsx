import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import '@fontsource/tajawal/400.css'
import '@fontsource/tajawal/500.css'
import '@fontsource/tajawal/700.css'
import { ThemeProvider } from '@mui/material/styles'
import rtlPlugin from 'stylis-plugin-rtl'
import { CacheProvider } from '@emotion/react'
import createCache from '@emotion/cache'
import { prefixer } from 'stylis'
import { ramadanTheme } from './theme/ramadanTheme.js'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import './styles/global.css'

// إنشاء كاش للـ RTL
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
})

// إيقاف رسائل التطوير في الإنتاج
if (process.env.NODE_ENV === 'production') {
  console.log = () => {};
  console.error = () => {};
  console.debug = () => {};
  console.warn = () => {};
}

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <CacheProvider value={cacheRtl}>
        <ThemeProvider theme={ramadanTheme}>
          <App />
        </ThemeProvider>
      </CacheProvider>
    </LocalizationProvider>
  // </React.StrictMode>
) 