import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminWeaponComponent } from './admin-weapon.component';

describe('AdminWeaponComponent', () => {
  let component: AdminWeaponComponent;
  let fixture: ComponentFixture<AdminWeaponComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminWeaponComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminWeaponComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
