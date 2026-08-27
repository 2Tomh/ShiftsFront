export const environment = {
  production: true,
  apiUrl: 'https://shiftsbackend-8qns.onrender.com/api',
  // חדש - אותו מפתח בדיוק כמו ב-environment.ts (Vapid Public Key
  // הוא ציבורי, בטוח להיות זהה בשתי הסביבות - הפרטי בלבד נשמר בסוד
  // בשרת, לא כאן).
  vapidPublicKey: 'vBom-iEXqMa2P1y2JJNvQIcnIypVyVP7wndGqTuONWc'
};