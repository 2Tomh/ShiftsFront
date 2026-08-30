import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { EmployeeRoutingModule } from './employee-routing.module';
import { EmployeeLayoutComponent } from './components/employee-layout/employee-layout.component';
import { EmployeeRegistrationComponent } from './components/employee-registration/employee-registration.component';
import { VacationRequestComponent } from './components/vacation-request/vacation-request.component';
import { SickLeaveRequestComponent } from '../employee/components/sick-leave-request/sick-leave-request.component';
import { ScheduleViewComponent } from './components/schedule-view/schedule-view.component';
import { EmployeeWeaponComponent } from './components/employee-weapon/employee-weapon.component';

@NgModule({
  declarations: [
    EmployeeLayoutComponent,
    EmployeeRegistrationComponent,
    VacationRequestComponent,
    SickLeaveRequestComponent,
    ScheduleViewComponent,
    EmployeeWeaponComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    EmployeeRoutingModule
  ]
})
export class EmployeeModule { }