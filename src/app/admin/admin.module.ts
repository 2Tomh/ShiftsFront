import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AdminRoutingModule } from './admin-routing.module';
import { AdminLayoutComponent } from './components/admin-layout/admin-layout.component';
import { ShiftBoardComponent } from './components/shift-board/shift-board.component';
import { VacationAdminComponent } from './components/vacation-admin/vacation-admin.component';
import { SickLeaveAdminComponent } from './components/sick-leave-admin/sick-leave-admin.component';
import { UserManagementComponent } from './components/user-management/user-management.component';
import { AdminWeaponComponent } from './components/admin-weapon/admin-weapon.component';

// חדש - SchedulePageComponent / ScheduleHeaderComponent / ScheduleStatsComponent
// הוסרו: היו שריד מנוטש מניסיון קודם, לא מנותבים בכלל
// ב-admin-routing.module.ts, וככל הנראה הם גרמו לקריסת ה-AOT compiler
// (שגיאת "Cannot read properties of undefined").
@NgModule({
  declarations: [
    AdminLayoutComponent,
    ShiftBoardComponent,
    VacationAdminComponent,
    SickLeaveAdminComponent,
    UserManagementComponent,
    AdminWeaponComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    AdminRoutingModule
  ]
})
export class AdminModule { }