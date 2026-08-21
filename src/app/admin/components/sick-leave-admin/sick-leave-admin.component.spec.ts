import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SickLeaveAdminComponent } from './sick-leave-admin.component';

describe('SickLeaveAdminComponent', () => {
  let component: SickLeaveAdminComponent;
  let fixture: ComponentFixture<SickLeaveAdminComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SickLeaveAdminComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SickLeaveAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
