import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AdminLayoutComponent } from './components/admin-layout/admin-layout.component';
import { ShiftBoardComponent } from './components/shift-board/shift-board.component';
import { VacationAdminComponent } from './components/vacation-admin/vacation-admin.component';
import { SickLeaveAdminComponent } from './components/sick-leave-admin/sick-leave-admin.component';
import { UserManagementComponent } from './components/user-management/user-management.component';
import { AdminWeaponComponent } from './components/admin-weapon/admin-weapon.component';
import { BoardSettingsComponent } from './components/board-settings/board-settings.component';
import { ScheduleStatsComponent } from './components/schedule-stats/schedule-stats.component';
import { EmployeeManagementComponent } from './components/employee-management/employee-management.component'; // חדש

const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: 'board', component: ShiftBoardComponent },
      { path: 'vacations', component: VacationAdminComponent },
      { path: 'sick-leaves', component: SickLeaveAdminComponent },
      { path: 'users', component: UserManagementComponent },
      { path: 'weapon', component: AdminWeaponComponent },
      { path: 'board-settings', component: BoardSettingsComponent },
      { path: 'stats', component: ScheduleStatsComponent },
      { path: 'employee-management', component: EmployeeManagementComponent }, // חדש
      { path: '', redirectTo: 'board', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }