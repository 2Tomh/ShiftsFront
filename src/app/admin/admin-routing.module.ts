import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AdminLayoutComponent } from './components/admin-layout/admin-layout.component';
import { ShiftBoardComponent } from './components/shift-board/shift-board.component';
import { VacationAdminComponent } from './components/vacation-admin/vacation-admin.component';
import { SickLeaveAdminComponent } from './components/sick-leave-admin/sick-leave-admin.component';
import { AdminWeaponComponent } from './components/admin-weapon/admin-weapon.component';
import { BoardSettingsComponent } from './components/board-settings/board-settings.component';
import { AdminStatisticsComponent } from './components/admin-statistics/admin-statistics.component';
import { EmployeeManagementComponent } from './components/employee-management/employee-management.component';
import { PersonalReportComponent } from './components/personal-report/personal-report.component';
// חדש - קומפוננטת "פרטי מנהל"
import { ManagerSettingsComponent } from './components/manager-settings/manager-settings.component';

const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: 'board', component: ShiftBoardComponent },
      { path: 'vacations', component: VacationAdminComponent },
      { path: 'sick-leaves', component: SickLeaveAdminComponent },
      { path: 'weapon', component: AdminWeaponComponent },
      { path: 'board-settings', component: BoardSettingsComponent },
      { path: 'stats', component: AdminStatisticsComponent },
      { path: 'employee-management', component: EmployeeManagementComponent },
      { path: 'personal-report', component: PersonalReportComponent },
      // חדש - route שהיה חסר, זו הסיבה שהקישור בתפריט היה מבוטל
      { path: 'manager-settings', component: ManagerSettingsComponent },
      { path: '', redirectTo: 'board', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }