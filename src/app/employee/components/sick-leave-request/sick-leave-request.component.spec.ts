import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SickLeaveRequestComponent } from './sick-leave-request.component';

describe('SickLeaveRequestComponent', () => {
  let component: SickLeaveRequestComponent;
  let fixture: ComponentFixture<SickLeaveRequestComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SickLeaveRequestComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SickLeaveRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
