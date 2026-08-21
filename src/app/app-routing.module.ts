import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';

// עדכון: נוסף /login (נטען מיד, בלי הגנה - זו הדרך היחידה להיכנס
// למערכת). מודול האדמין מוגן עכשיו ב-AdminGuard (מחובר + תפקיד Admin
// בדיוק), ומודול העובד מוגן ב-AuthGuard (מחובר בכלל, כל תפקיד) - כי
// עכשיו גם עובדים חייבים להתחבר, לא רק אדמינים.
const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'admin',
    canActivate: [AdminGuard],
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule)
  },
  {
    path: '',
    canActivate: [AuthGuard],
    loadChildren: () => import('./employee/employee.module').then(m => m.EmployeeModule)
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }