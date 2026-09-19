import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AdminRoutingModule } from './admin-routing.module';
import { AdminLayoutComponent } from './components/admin-layout/admin-layout.component';
import { ShiftBoardComponent } from './components/shift-board/shift-board.component';
import { VacationAdminComponent } from './components/vacation-admin/vacation-admin.component';
import { SickLeaveAdminComponent } from './components/sick-leave-admin/sick-leave-admin.component';
import { AdminWeaponComponent } from './components/admin-weapon/admin-weapon.component';
import { BoardSettingsComponent } from './components/board-settings/board-settings.component';
import { ScheduleStatsComponent } from './components/schedule-stats/schedule-stats.component';
import { AdminStatisticsComponent } from './components/admin-statistics/admin-statistics.component';
import { EmployeeManagementComponent } from './components/employee-management/employee-management.component';
import { PersonalReportComponent } from './components/personal-report/personal-report.component';
// חדש - קומפוננטת "פרטי מנהל"
import { ManagerSettingsComponent } from './components/manager-settings/manager-settings.component';

@NgModule({
  declarations: [
    AdminLayoutComponent,
    ShiftBoardComponent,
    VacationAdminComponent,
    SickLeaveAdminComponent,
    AdminWeaponComponent,
    BoardSettingsComponent,
    ScheduleStatsComponent,
    AdminStatisticsComponent,
    EmployeeManagementComponent,
    PersonalReportComponent,
    ManagerSettingsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    AdminRoutingModule
  ]
})
export class AdminModule { }