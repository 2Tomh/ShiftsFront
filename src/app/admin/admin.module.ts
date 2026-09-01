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
import { BoardSettingsComponent } from './components/board-settings/board-settings.component';
import { ScheduleStatsComponent } from './components/schedule-stats/schedule-stats.component';
import { EmployeeManagementComponent } from './components/employee-management/employee-management.component'; // חדש

@NgModule({
  declarations: [
    AdminLayoutComponent,
    ShiftBoardComponent,
    VacationAdminComponent,
    SickLeaveAdminComponent,
    UserManagementComponent,
    AdminWeaponComponent,
    BoardSettingsComponent,
    ScheduleStatsComponent,
    EmployeeManagementComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    AdminRoutingModule
  ]
})
export class AdminModule { }