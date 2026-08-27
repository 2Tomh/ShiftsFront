import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AdminRoutingModule } from './admin-routing.module';
import { AdminLayoutComponent } from './components/admin-layout/admin-layout.component';
import { ShiftBoardComponent } from './components/shift-board/shift-board.component';
import { VacationAdminComponent } from './components/vacation-admin/vacation-admin.component';
import { SickLeaveAdminComponent } from './components/sick-leave-admin/sick-leave-admin.component';
import { UserManagementComponent } from './components/user-management/user-management.component';
import { SchedulePageComponent } from './components/schedule-page/schedule-page.component';
import { ScheduleHeaderComponent } from './components/schedule-header/schedule-header.component';
import { ScheduleStatsComponent } from './components/schedule-stats/schedule-stats.component';

@NgModule({
  declarations: [
    AdminLayoutComponent,
    ShiftBoardComponent,
    VacationAdminComponent,
    SickLeaveAdminComponent,
    UserManagementComponent,
    SchedulePageComponent,
    ScheduleHeaderComponent,
    ScheduleStatsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    AdminRoutingModule
  ]
})
export class AdminModule { }