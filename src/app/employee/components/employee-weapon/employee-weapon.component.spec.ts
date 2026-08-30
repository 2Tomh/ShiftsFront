import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeWeaponComponent } from './employee-weapon.component';

describe('EmployeeWeaponComponent', () => {
  let component: EmployeeWeaponComponent;
  let fixture: ComponentFixture<EmployeeWeaponComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EmployeeWeaponComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EmployeeWeaponComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
