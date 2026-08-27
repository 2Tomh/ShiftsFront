export const environment = {
  production: true,
  apiUrl: 'https://shiftsbackend-8qns.onrender.com/api',
  // חדש - אותו מפתח בדיוק כמו ב-environment.ts (Vapid Public Key
  // הוא ציבורי, בטוח להיות זהה בשתי הסביבות - הפרטי בלבד נשמר בסוד
  // בשרת, לא כאן).
  vapidPublicKey: 'BK4UstUWZawF59aH3vBmG-n5rqKwgGGi4FBQCa1YuI9fIXgmEAIjAKySmmVK49FneO07BR_ICj7XisldHGH544w'
};