import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EmployeeLayoutComponent } from './components/employee-layout/employee-layout.component';
import { EmployeeRegistrationComponent } from './components/employee-registration/employee-registration.component';
import { VacationRequestComponent } from './components/vacation-request/vacation-request.component';
import { SickLeaveRequestComponent } from '../employee/components/sick-leave-request/sick-leave-request.component';
import { ScheduleViewComponent } from './components/schedule-view/schedule-view.component';

const routes: Routes = [
  {
    path: '',
    component: EmployeeLayoutComponent,
    children: [
      { path: 'register', component: EmployeeRegistrationComponent },
      { path: 'vacation', component: VacationRequestComponent },
      { path: 'sick-leave', component: SickLeaveRequestComponent },
      { path: 'schedule', component: ScheduleViewComponent },
      { path: '', redirectTo: 'register', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EmployeeRoutingModule { }