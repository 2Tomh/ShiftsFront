import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

// חדש - קריטי: מנקה כל Service Worker ישן שנרשם בעבר (מהניסיון עם
// Push Notifications), אצל כל מי שכבר ביקר באתר לפני שהסרנו את
// ServiceWorkerModule. בלי זה, הדפדפן ממשיך להגיש קבצים ישנים
// מה-Cache לנצח, ולא משנה כמה פעמים נעדכן ונפרוס גרסה חדשה - בדיוק
// הבעיה שגרמה לכל הבלבול עם Push. רץ פעם אחת, בכל טעינה, לפני
// שהאפליקציה של Angular בכלל עולה.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });

  if ('caches' in window) {
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => {
        caches.delete(cacheName);
      });
    });
  }
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));