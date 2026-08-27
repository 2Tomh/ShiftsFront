// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  apiUrl: 'https://localhost:7278/api',
  // חדש - המפתח הציבורי (VAPID Public Key) הנדרש להרשמה ל-Push.
  // נוצר פעם אחת (ר' ההסבר בהודעה), זהה גם ב-Dev וגם ב-Prod.
  vapidPublicKey: 'BFxqU8peZs11YxMFTAQFNjTOm0IqP1QOXpxIQv7k5T6Vx_Xa7z7Z8TFAL52pS2jrNgKzfjENAgZwJMcTdvYkjBc'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.