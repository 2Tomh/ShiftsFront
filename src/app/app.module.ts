import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { LoginComponent } from './login/login.component';
import { AuthInterceptor } from './interceptors/auth.interceptor';

// עדכון: נוסף LoginComponent (חי ברמת ה-Root - נטען מיד, לא Lazy, כי
// הוא נקודת הכניסה לפני שידוע בכלל אם המשתמש אדמין או עובד). נוסף גם
// FormsModule (בשביל ngModel בטופס ההתחברות), ו-HTTP_INTERCEPTORS
// שמצמיד את הטוקן אוטומטית לכל בקשה יוצאת. חדש - ServiceWorkerModule
// נדרש לתמיכה ב-Push Notifications, פעיל רק ב-Production.
@NgModule({
  declarations: [
    AppComponent,
    LoginComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }