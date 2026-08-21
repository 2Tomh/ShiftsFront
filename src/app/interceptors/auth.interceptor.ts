import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

// חדש - מצמיד אוטומטית את הטוקן (אם קיים) לכותרת Authorization בכל
// בקשת HTTP יוצאת, כך שלא צריך להוסיף אותו ידנית בכל קריאת שירות
// בנפרד. אם אין טוקן (המשתמש עדיין לא התחבר) - הבקשה יוצאת כרגיל
// בלי הכותרת, והשרת יחזיר 401 בעצמו אם ה-endpoint דורש הרשאה.
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();

    if (token) {
      const cloned = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
      return next.handle(cloned);
    }

    return next.handle(req);
  }
}