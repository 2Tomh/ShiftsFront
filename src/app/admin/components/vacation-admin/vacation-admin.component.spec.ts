import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VacationAdminComponent } from './vacation-admin.component';

describe('VacationAdminComponent', () => {
  let component: VacationAdminComponent;
  let fixture: ComponentFixture<VacationAdminComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VacationAdminComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VacationAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
